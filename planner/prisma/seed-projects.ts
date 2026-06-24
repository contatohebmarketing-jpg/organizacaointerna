import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

// Seed de PRODUÇÃO: cria apenas os projetos iniciais (sem tarefas),
// pra começar limpo. Idempotente — não duplica se já existirem.
const libsql = createClient({
  url: process.env.TURSO_DATABASE_URL ?? "file:./prisma/dev.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter: new PrismaLibSQL(libsql) });

const PROJECTS = [
  { name: "Imersão Escolha Óbvia", color: "red" },
  { name: "Founder", color: "green" },
  { name: "ASCEND", color: "blue" },
  { name: "Conteúdo", color: "amber" },
  { name: "Gestão & Time", color: "purple" },
  { name: "Pessoal", color: "teal" },
];

async function main() {
  const count = await prisma.project.count();
  if (count > 0) {
    console.log(`Já existem ${count} projetos — nada a fazer.`);
    return;
  }
  for (const p of PROJECTS) await prisma.project.create({ data: p });
  console.log(`Criados ${PROJECTS.length} projetos iniciais.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
