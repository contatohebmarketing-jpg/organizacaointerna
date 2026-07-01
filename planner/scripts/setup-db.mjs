// Prepara o banco durante o build (roda na Vercel, que alcança o Turso):
// 1) aplica o schema (idempotente) 2) adiciona colunas novas se faltarem
// 3) popula com dados de exemplo SE estiver vazio.
import { createClient } from "@libsql/client";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { readFileSync } from "node:fs";

const url = process.env.TURSO_DATABASE_URL || "file:./prisma/dev.db";
const authToken = process.env.TURSO_AUTH_TOKEN;
const isRemote = url.startsWith("libsql://") || url.startsWith("https://");
const client = createClient({ url, authToken });

// 1) Schema base (idempotente)
const sql = readFileSync(new URL("../prisma/schema.sql", import.meta.url), "utf8");
const statements = sql
  .split(";")
  .map((s) => s.replace(/--.*$/gm, "").trim())
  .filter((s) => s.length > 0);

for (const stmt of statements) {
  try {
    await client.execute(stmt);
  } catch (e) {
    // "no such column" pode ocorrer p/ índices de colunas que só existem após os ALTERs abaixo
    if (!/already exists|no such column|duplicate column/i.test(String(e?.message || e))) {
      console.error("Erro aplicando schema:", String(e?.message || e));
      process.exit(1);
    }
  }
}

// 2) Migrações leves: adiciona colunas novas em bancos antigos (ignora se já existem)
const alters = [
  `ALTER TABLE "Task" ADD COLUMN "endDate" DATETIME`,
  `ALTER TABLE "Task" ADD COLUMN "endMin" INTEGER`,
  `ALTER TABLE "Task" ADD COLUMN "repeat" TEXT NOT NULL DEFAULT 'none'`,
  `ALTER TABLE "Task" ADD COLUMN "source" TEXT`,
  `ALTER TABLE "Task" ADD COLUMN "externalId" TEXT`,
  `CREATE UNIQUE INDEX "Task_externalId_key" ON "Task"("externalId")`,
];
for (const a of alters) {
  try {
    await client.execute(a);
    console.log("[setup-db] migração:", a.slice(0, 46));
  } catch (e) {
    if (!/duplicate column|already exists/i.test(String(e?.message || e))) {
      console.error("Erro no ALTER:", String(e?.message || e));
      process.exit(1);
    }
  }
}
console.log(`[setup-db] schema OK em ${isRemote ? "Turso" : "arquivo local"}.`);

// 3) Seed condicional
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

function at(days) { const d = new Date(); d.setUTCDate(d.getUTCDate() + days); d.setUTCHours(12, 0, 0, 0); return d; }
function ts(days, hour) { const d = new Date(); d.setDate(d.getDate() + days); d.setHours(hour, 0, 0, 0); return d; }

const P = {
  imersao: await prisma.project.create({ data: { name: "Imersão Escolha Óbvia", color: "red" } }),
  founder: await prisma.project.create({ data: { name: "Founder", color: "green" } }),
  ascend: await prisma.project.create({ data: { name: "ASCEND", color: "blue" } }),
  conteudo: await prisma.project.create({ data: { name: "Conteúdo", color: "amber" } }),
  gestao: await prisma.project.create({ data: { name: "Gestão & Time", color: "purple" } }),
  pessoal: await prisma.project.create({ data: { name: "Pessoal", color: "teal" } }),
};

const tasks = [
  { title: "Definir lotes e preços dos ingressos", proj: ["imersao"], priority: "alta", status: "todo", due: -2, push: 3 },
  { title: "Revisar precificação de O Conselho", proj: ["gestao"], priority: "media", status: "todo", due: -1, push: 1 },
  { title: "Planejamento do dia", proj: ["pessoal"], priority: "media", status: "todo", due: 0, start: 480, end: 510, repeat: "daily" },
  { title: "Kick-off com Aline e Suellen", proj: ["gestao"], priority: "alta", status: "todo", due: 0, start: 510, end: 540 },
  { title: "Escrever direcionais do Dr. Thiago", proj: ["conteudo", "ascend"], priority: "alta", status: "doing", due: 0, start: 600, end: 720 },
  { title: "Gravação de conteúdo", proj: ["conteudo"], priority: "media", status: "todo", due: 0, start: 840, end: 960 },
  { title: "Gravar VSL da Imersão", proj: ["imersao"], priority: "alta", status: "todo", due: 2, start: 540, end: 720 },
  { title: "Treinar Suellen no script de vendas", proj: ["gestao"], priority: "alta", status: "todo", due: 5, start: 660, end: 750 },
  { title: "Imersão presencial (viagem)", proj: ["imersao"], priority: "alta", status: "todo", due: 12, endDays: 14 },
  { title: "Reunião com Matheus", proj: ["gestao"], priority: "alta", status: "todo", due: 9, start: 840, end: 960 },
  { title: "Organizar gravações no Drive", proj: ["pessoal"], priority: "baixa", status: "todo", due: NaN },
  { title: "Onboarding com a Lanna", proj: ["founder"], priority: "media", status: "done", due: -1, done: -1 },
  { title: "Postar Reels de segunda", proj: ["conteudo"], priority: "media", status: "done", due: -2, done: -2 },
];

let order = 0;
for (const t of tasks) {
  const startMin = t.start ?? null;
  const endMin = t.end ?? null;
  await prisma.task.create({
    data: {
      title: t.title,
      priority: t.priority,
      status: t.status,
      order: order++,
      dueDate: Number.isNaN(t.due) ? null : at(t.due),
      startMin,
      endMin,
      endDate: t.endDays !== undefined ? at(t.endDays) : null,
      repeat: t.repeat ?? "none",
      durationMin: startMin !== null && endMin !== null ? endMin - startMin : 60,
      pushCount: t.push ?? 0,
      completedAt: t.done !== undefined ? ts(t.done, 17) : null,
      projects: { connect: t.proj.map((k) => ({ id: P[k].id })) },
    },
  });
}

console.log(`[setup-db] seed inicial: ${tasks.length} tarefas, 6 projetos.`);
await prisma.$disconnect();
