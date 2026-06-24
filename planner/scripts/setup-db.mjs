// Prepara o banco durante o build (roda na Vercel, que alcança o Turso):
// 1) aplica o schema (idempotente) 2) popula com dados de exemplo SE estiver vazio.
// Funciona tanto local (file:) quanto em produção (Turso libsql://).
import { createClient } from "@libsql/client";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { readFileSync } from "node:fs";

const url = process.env.TURSO_DATABASE_URL || "file:./prisma/dev.db";
const authToken = process.env.TURSO_AUTH_TOKEN;
const isRemote = url.startsWith("libsql://") || url.startsWith("https://");

const client = createClient({ url, authToken });

// 1) Schema (idempotente)
const sql = readFileSync(new URL("../prisma/schema.sql", import.meta.url), "utf8");
const statements = sql
  .split(";")
  .map((s) => s.replace(/--.*$/gm, "").trim())
  .filter((s) => s.length > 0);

for (const stmt of statements) {
  try {
    await client.execute(stmt);
  } catch (e) {
    if (!/already exists/i.test(String(e?.message || e))) {
      console.error("Erro aplicando schema:", String(e?.message || e));
      process.exit(1);
    }
  }
}
console.log(`[setup-db] schema OK em ${isRemote ? "Turso" : "arquivo local"}.`);

// 2) Seed condicional
const prisma = new PrismaClient({ adapter: new PrismaLibSQL(client) });

if (process.env.SEED_RESET === "1") {
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  console.log("[setup-db] reset solicitado (SEED_RESET=1).");
}

const existing = await prisma.project.count();
if (existing > 0) {
  console.log(`[setup-db] já há ${existing} projeto(s) — seed ignorado.`);
  await prisma.$disconnect();
  process.exit(0);
}

function at(days) { const d = new Date(); d.setDate(d.getDate() + days); d.setHours(0, 0, 0, 0); return d; }
function ts(days, hour) { const d = at(days); d.setHours(hour, 0, 0, 0); return d; }

const P = {
  imersao: await prisma.project.create({ data: { name: "Imersão Escolha Óbvia", color: "red" } }),
  founder: await prisma.project.create({ data: { name: "Founder", color: "green" } }),
  ascend: await prisma.project.create({ data: { name: "ASCEND", color: "blue" } }),
  conteudo: await prisma.project.create({ data: { name: "Conteúdo", color: "amber" } }),
  gestao: await prisma.project.create({ data: { name: "Gestão & Time", color: "purple" } }),
  pessoal: await prisma.project.create({ data: { name: "Pessoal", color: "teal" } }),
};

const tasks = [
  { title: "Definir lotes e preços dos ingressos", proj: ["imersao"], priority: "alta", status: "todo", due: -2, push: 3, notes: "Lotes R$47 → R$67 → R$97." },
  { title: "Revisar precificação de O Conselho", proj: ["gestao"], priority: "media", status: "todo", due: -1, push: 1 },
  { title: "Responder proposta da parceria", proj: ["gestao"], priority: "media", status: "todo", due: -3, push: 2 },
  { title: "Kick-off com Aline e Suellen", proj: ["gestao"], priority: "alta", status: "todo", due: 0, start: 510, dur: 30, notes: "Metas da semana por pessoa." },
  { title: "Escrever direcionais do Dr. Thiago", proj: ["conteudo", "ascend"], priority: "alta", status: "doing", due: 0, start: 600, dur: 120 },
  { title: "Gravação de conteúdo", proj: ["conteudo"], priority: "media", status: "todo", due: 0, start: 840, dur: 120 },
  { title: "Aprovar copy da página da Imersão", proj: ["imersao"], priority: "media", status: "todo", due: 0, start: null, dur: 30 },
  { title: "Gravar VSL da Imersão", proj: ["imersao"], priority: "alta", status: "todo", due: 2, start: 540, dur: 180 },
  { title: "Roteiro do mentorado novo (Cecília)", proj: ["ascend"], priority: "media", status: "todo", due: 3, start: 900, dur: 60 },
  { title: "Treinar Suellen no script de vendas", proj: ["gestao"], priority: "alta", status: "todo", due: 5, start: 660, dur: 90 },
  { title: "Imersão — ensaio geral", proj: ["imersao"], priority: "alta", status: "todo", due: 9, start: 540, dur: 180 },
  { title: "Reunião com Matheus", proj: ["gestao"], priority: "alta", status: "todo", due: 9, start: 840, dur: 120 },
  { title: "Planejar pós-venda Founder", proj: ["founder"], priority: "media", status: "todo", due: 9, start: 990, dur: 120 },
  { title: "Organizar gravações no Drive", proj: ["pessoal"], priority: "baixa", status: "todo", due: NaN },
  { title: "Onboarding com a Lanna", proj: ["founder"], priority: "media", status: "done", due: -1, done: -1 },
  { title: "Postar Reels de segunda", proj: ["conteudo"], priority: "media", status: "done", due: -2, done: -2 },
  { title: "Fechar relatório do mês", proj: ["gestao"], priority: "media", status: "done", due: -4, done: -2 },
];

let order = 0;
for (const t of tasks) {
  await prisma.task.create({
    data: {
      title: t.title,
      notes: t.notes ?? null,
      priority: t.priority,
      status: t.status,
      order: order++,
      dueDate: Number.isNaN(t.due) ? null : at(t.due),
      startMin: t.start === undefined ? null : t.start,
      durationMin: t.dur ?? 60,
      pushCount: t.push ?? 0,
      completedAt: t.done !== undefined ? ts(t.done, 17) : null,
      projects: { connect: t.proj.map((k) => ({ id: P[k].id })) },
    },
  });
}

console.log(`[setup-db] seed inicial: ${tasks.length} tarefas, 6 projetos.`);
await prisma.$disconnect();
