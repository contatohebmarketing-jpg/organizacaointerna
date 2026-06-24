import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const libsql = createClient({
  url: process.env.TURSO_DATABASE_URL ?? "file:./prisma/dev.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter: new PrismaLibSQL(libsql) });

function at(daysFromNow: number, hour = 12): Date {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, 0, 0, 0);
  return d;
}

async function main() {
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();

  const imersao = await prisma.project.create({ data: { name: "Imersão Escolha Óbvia", color: "terracotta" } });
  const founder = await prisma.project.create({ data: { name: "Founder", color: "teal" } });
  const ascend = await prisma.project.create({ data: { name: "ASCEND", color: "ocean" } });
  const conteudo = await prisma.project.create({ data: { name: "Conteúdo", color: "mustard" } });
  const gestao = await prisma.project.create({ data: { name: "Gestão & Time", color: "plum" } });
  const pessoal = await prisma.project.create({ data: { name: "Pessoal", color: "sage" } });

  const tasks: {
    title: string; projectId: string; priority: string; status: string; due: number; done?: number;
  }[] = [
    // Atrasadas
    { title: "Definir lotes e preços dos ingressos", projectId: imersao.id, priority: "alta", status: "todo", due: -2 },
    { title: "Revisar precificação de O Conselho", projectId: gestao.id, priority: "media", status: "todo", due: -1 },
    // Hoje
    { title: "Escrever direcionais de conteúdo do Dr. Thiago", projectId: conteudo.id, priority: "alta", status: "doing", due: 0 },
    { title: "Rodar o 1º Kick-off com Aline e Suellen", projectId: gestao.id, priority: "alta", status: "todo", due: 0 },
    { title: "Aprovar copy da página de vendas da Imersão", projectId: imersao.id, priority: "media", status: "todo", due: 0 },
    // Próximos 3 dias
    { title: "Gravar VSL da Imersão", projectId: imersao.id, priority: "alta", status: "todo", due: 2 },
    { title: "Montar roteiro do mentorado novo (Cecília)", projectId: ascend.id, priority: "media", status: "todo", due: 3 },
    // Esta semana
    { title: "Definir régua de pós-venda da Founder", projectId: founder.id, priority: "media", status: "todo", due: 5 },
    { title: "Treinar Suellen no script de vendas", projectId: gestao.id, priority: "alta", status: "todo", due: 6 },
    // Depois
    { title: "Escrever oferta da nova mentoria (R$24k)", projectId: founder.id, priority: "alta", status: "todo", due: 10 },
    { title: "Planejar evento presencial de outubro", projectId: imersao.id, priority: "baixa", status: "todo", due: 20 },
    // Sem data
    { title: "Organizar pasta de gravações no Drive", projectId: pessoal.id, priority: "baixa", status: "todo", due: NaN },
    // Concluídas nesta semana
    { title: "Onboarding com a Lanna", projectId: founder.id, priority: "media", status: "done", due: -1, done: -1 },
    { title: "Postar Reels de segunda", projectId: conteudo.id, priority: "media", status: "done", due: -2, done: -2 },
    { title: "Reunião de mentoria com Matheus", projectId: gestao.id, priority: "alta", status: "done", due: -3, done: -3 },
  ];

  let order = 0;
  for (const t of tasks) {
    await prisma.task.create({
      data: {
        title: t.title,
        projectId: t.projectId,
        priority: t.priority,
        status: t.status,
        order: order++,
        dueDate: Number.isNaN(t.due) ? null : at(t.due),
        completedAt: t.done !== undefined ? at(t.done) : null,
      },
    });
  }

  console.log(`Seed concluído: ${tasks.length} tarefas, 6 projetos.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
