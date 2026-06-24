import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const libsql = createClient({
  url: process.env.TURSO_DATABASE_URL ?? "file:./prisma/dev.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter: new PrismaLibSQL(libsql) });

function at(daysFromNow: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(0, 0, 0, 0);
  return d;
}
function ts(daysFromNow: number, hour: number): Date {
  const d = at(daysFromNow);
  d.setHours(hour, 0, 0, 0);
  return d;
}

async function main() {
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();

  const P = {
    imersao: await prisma.project.create({ data: { name: "Imersão Escolha Óbvia", color: "red" } }),
    founder: await prisma.project.create({ data: { name: "Founder", color: "green" } }),
    ascend: await prisma.project.create({ data: { name: "ASCEND", color: "blue" } }),
    conteudo: await prisma.project.create({ data: { name: "Conteúdo", color: "amber" } }),
    gestao: await prisma.project.create({ data: { name: "Gestão & Time", color: "purple" } }),
    pessoal: await prisma.project.create({ data: { name: "Pessoal", color: "teal" } }),
  };

  type Seed = {
    title: string; proj: (keyof typeof P)[]; priority: string; status: string;
    due: number; start?: number | null; dur?: number; push?: number; done?: number; notes?: string;
  };

  const tasks: Seed[] = [
    // Atrasadas
    { title: "Definir lotes e preços dos ingressos", proj: ["imersao"], priority: "alta", status: "todo", due: -2, push: 3, notes: "Lotes R$47 → R$67 → R$97. Decidir corte de cada lote." },
    { title: "Revisar precificação de O Conselho", proj: ["gestao"], priority: "media", status: "todo", due: -1, push: 1 },
    { title: "Responder proposta da parceria", proj: ["gestao"], priority: "media", status: "todo", due: -3, push: 2 },
    // Hoje (com horários — pra ver a semana cheia)
    { title: "Kick-off com Aline e Suellen", proj: ["gestao"], priority: "alta", status: "todo", due: 0, start: 8 * 60 + 30, dur: 30, notes: "Metas da semana por pessoa." },
    { title: "Escrever direcionais do Dr. Thiago", proj: ["conteudo", "ascend"], priority: "alta", status: "doing", due: 0, start: 10 * 60, dur: 120 },
    { title: "Gravação de conteúdo", proj: ["conteudo"], priority: "media", status: "todo", due: 0, start: 14 * 60, dur: 120 },
    { title: "Aprovar copy da página da Imersão", proj: ["imersao"], priority: "media", status: "todo", due: 0, start: null, dur: 30 },
    // Próximos 3 dias
    { title: "Gravar VSL da Imersão", proj: ["imersao"], priority: "alta", status: "todo", due: 2, start: 9 * 60, dur: 180 },
    { title: "Roteiro do mentorado novo (Cecília)", proj: ["ascend"], priority: "media", status: "todo", due: 3, start: 15 * 60, dur: 60 },
    // Esta semana
    { title: "Treinar Suellen no script de vendas", proj: ["gestao"], priority: "alta", status: "todo", due: 5, start: 11 * 60, dur: 90 },
    // Próxima semana (dia lotado de propósito)
    { title: "Imersão — ensaio geral", proj: ["imersao"], priority: "alta", status: "todo", due: 9, start: 9 * 60, dur: 180 },
    { title: "Reunião com Matheus", proj: ["gestao"], priority: "alta", status: "todo", due: 9, start: 14 * 60, dur: 120 },
    { title: "Planejar pós-venda Founder", proj: ["founder"], priority: "media", status: "todo", due: 9, start: 16 * 60 + 30, dur: 120 },
    // Sem data
    { title: "Organizar gravações no Drive", proj: ["pessoal"], priority: "baixa", status: "todo", due: NaN },
    // Concluídas (algumas no prazo/rápidas, uma atrasada)
    { title: "Onboarding com a Lanna", proj: ["founder"], priority: "media", status: "done", due: -1, done: -1 },
    { title: "Postar Reels de segunda", proj: ["conteudo"], priority: "media", status: "done", due: -2, done: -2 },
    { title: "Responder e-mails da semana", proj: ["pessoal"], priority: "baixa", status: "done", due: -2, done: -2 },
    { title: "Fechar relatório do mês", proj: ["gestao"], priority: "media", status: "done", due: -4, done: -2 },
  ];

  let order = 0;
  for (const t of tasks) {
    const completed = t.done !== undefined;
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
        completedAt: completed ? ts(t.done as number, 17) : null,
        projects: { connect: t.proj.map((k) => ({ id: P[k].id })) },
      },
    });
  }

  console.log(`Seed concluído: ${tasks.length} tarefas, 6 projetos.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
