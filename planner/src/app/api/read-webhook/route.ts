import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function noon(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(12, 0, 0, 0);
  return x;
}
function pick<T>(...vals: (T | undefined | null)[]): T | undefined {
  for (const v of vals) if (v !== undefined && v !== null && v !== "") return v as T;
  return undefined;
}

type Item = { text: string; owner?: string; due?: string };

// Extrai action items de formatos variados do payload do Read.ai
function extractActionItems(body: any): Item[] {
  const cand =
    pick<any[]>(
      body?.action_items,
      body?.report?.action_items,
      body?.data?.action_items,
      body?.session?.action_items,
      body?.report?.summary?.action_items,
      body?.summary?.action_items
    ) ?? [];
  if (!Array.isArray(cand)) return [];
  return cand
    .map((it: any): Item | null => {
      if (typeof it === "string") return { text: it };
      const text = pick<string>(it.text, it.action_item, it.title, it.name, it.value, it.description);
      if (!text) return null;
      return { text, owner: pick<string>(it.owner, it.assignee, it.owner_name), due: pick<string>(it.due_date, it.dueDate, it.due) };
    })
    .filter((x): x is Item => !!x && !!x.text);
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "read-webhook",
    hint: "Configure esta URL (com ?token=SEU_SEGREDO) como webhook no Read.ai. Ela recebe as reuniões e cria tarefas.",
  });
}

export async function POST(req: NextRequest) {
  const secret = process.env.READ_WEBHOOK_SECRET;
  const token = req.nextUrl.searchParams.get("token");
  if (secret && token !== secret) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const items = extractActionItems(body);
  const title =
    pick<string>(body?.title, body?.session_title, body?.report?.title, body?.session?.title, body?.trigger?.title) ?? "Reunião";
  const sessionId =
    pick<string>(
      body?.session_id,
      body?.id,
      body?.trigger?.session_id,
      body?.session?.session_id,
      body?.report?.session_id
    ) ?? `t${Date.now()}`;
  const meetingRaw = pick<string>(body?.end_time, body?.start_time, body?.session?.start_time, body?.report?.start_time);
  const meetingDate = meetingRaw ? new Date(meetingRaw) : new Date();

  if (items.length === 0) {
    return NextResponse.json({ ok: true, created: 0, note: "sem action items neste evento" });
  }

  // projeto "Reuniões" (cria se não existir)
  let project = await prisma.project.findFirst({ where: { name: "Reuniões", archived: false } });
  if (!project) project = await prisma.project.create({ data: { name: "Reuniões", color: "graphite" } });

  const defaultDue = noon(new Date(meetingDate.getTime() + 3 * 86400000));

  let created = 0;
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const externalId = `read:${sessionId}:${i}`;
    const due = it.due && !isNaN(new Date(it.due).getTime()) ? noon(new Date(it.due)) : defaultDue;
    const notes = `Da reunião: ${title}${it.owner ? ` · responsável: ${it.owner}` : ""}`;
    try {
      const existing = await prisma.task.findUnique({ where: { externalId } });
      if (existing) continue;
      await prisma.task.create({
        data: {
          title: it.text.slice(0, 200),
          notes,
          priority: "media",
          status: "todo",
          dueDate: due,
          source: "read",
          externalId,
          projects: { connect: { id: project.id } },
        },
      });
      created++;
    } catch {
      // ignora duplicata/erro pontual e segue
    }
  }

  revalidatePath("/");
  revalidatePath("/tarefas");
  revalidatePath("/calendario");
  return NextResponse.json({ ok: true, created, of: items.length });
}
