"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/tarefas");
  revalidatePath("/projetos");
  revalidatePath("/calendario");
}

function parseDate(d?: string | null): Date | null {
  if (!d) return null;
  // Guarda como meio-dia UTC: assim o "dia" não muda em fusos de -11h a +11h
  // (evita o erro de a data aparecer um dia antes no horário do Brasil).
  return new Date(`${d}T12:00:00.000Z`);
}

function computeDuration(startMin?: number | null, endMin?: number | null): number {
  if (startMin != null && endMin != null && endMin > startMin) return endMin - startMin;
  return 60;
}

export async function createTask(input: {
  title: string;
  notes?: string | null;
  projectIds?: string[];
  priority?: string;
  dueDate?: string | null;
  startMin?: number | null;
  endDate?: string | null;
  endMin?: number | null;
  repeat?: string;
  status?: string;
}) {
  const title = input.title?.trim();
  if (!title) return;
  const startMin = input.startMin ?? null;
  const endMin = input.endMin ?? null;
  await prisma.task.create({
    data: {
      title,
      notes: input.notes?.trim() || null,
      priority: input.priority || "media",
      status: input.status || "todo",
      dueDate: parseDate(input.dueDate),
      startMin,
      endDate: parseDate(input.endDate),
      endMin,
      repeat: input.repeat || "none",
      durationMin: computeDuration(startMin, endMin),
      projects: input.projectIds?.length
        ? { connect: input.projectIds.map((id) => ({ id })) }
        : undefined,
    },
  });
  revalidateAll();
}

export async function toggleTask(id: string, done: boolean) {
  await prisma.task.update({
    where: { id },
    data: { status: done ? "done" : "todo", completedAt: done ? new Date() : null },
  });
  revalidateAll();
}

export async function setTaskStatus(id: string, status: string) {
  await prisma.task.update({
    where: { id },
    data: { status, completedAt: status === "done" ? new Date() : null },
  });
  revalidateAll();
}

export async function updateTask(
  id: string,
  data: {
    title?: string;
    notes?: string | null;
    priority?: string;
    dueDate?: string | null;
    startMin?: number | null;
    endDate?: string | null;
    endMin?: number | null;
    repeat?: string;
    projectIds?: string[];
  }
) {
  const current = await prisma.task.findUnique({ where: { id } });
  let pushInc = 0;
  if (current && data.dueDate !== undefined) {
    const next = parseDate(data.dueDate);
    if (current.dueDate && next && next.getTime() > current.dueDate.getTime()) {
      pushInc = 1; // adiou para frente
    }
  }

  const startMin = data.startMin !== undefined ? data.startMin : current?.startMin ?? null;
  const endMin = data.endMin !== undefined ? data.endMin : current?.endMin ?? null;

  await prisma.task.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.notes !== undefined ? { notes: data.notes?.trim() || null } : {}),
      ...(data.priority !== undefined ? { priority: data.priority } : {}),
      ...(data.dueDate !== undefined ? { dueDate: parseDate(data.dueDate) } : {}),
      ...(data.startMin !== undefined ? { startMin: data.startMin } : {}),
      ...(data.endDate !== undefined ? { endDate: parseDate(data.endDate) } : {}),
      ...(data.endMin !== undefined ? { endMin: data.endMin } : {}),
      ...(data.repeat !== undefined ? { repeat: data.repeat } : {}),
      ...(data.startMin !== undefined || data.endMin !== undefined
        ? { durationMin: computeDuration(startMin, endMin) }
        : {}),
      ...(pushInc ? { pushCount: { increment: pushInc } } : {}),
      ...(data.projectIds !== undefined
        ? { projects: { set: data.projectIds.map((id) => ({ id })) } }
        : {}),
    },
  });
  revalidateAll();
}

export async function deleteTask(id: string) {
  await prisma.task.delete({ where: { id } });
  revalidateAll();
}

export async function createProject(input: { name: string; color: string }) {
  const name = input.name?.trim();
  if (!name) return;
  await prisma.project.create({ data: { name, color: input.color || "blue" } });
  revalidateAll();
}

export async function updateProject(id: string, data: { name?: string; color?: string }) {
  await prisma.project.update({ where: { id }, data });
  revalidateAll();
}

export async function deleteProject(id: string) {
  await prisma.project.delete({ where: { id } });
  revalidateAll();
}
