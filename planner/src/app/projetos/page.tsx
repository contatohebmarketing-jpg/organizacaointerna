import { prisma } from "@/lib/prisma";
import ProjectsManager from "@/components/ProjectsManager";

export const dynamic = "force-dynamic";

export default async function ProjetosPage() {
  const projects = await prisma.project.findMany({
    where: { archived: false },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { tasks: true } }, tasks: { select: { status: true } } },
  });

  const data = projects.map((p) => ({
    id: p.id,
    name: p.name,
    color: p.color,
    total: p.tasks.length,
    open: p.tasks.filter((t) => t.status !== "done").length,
  }));

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="display text-4xl text-ink">Projetos</h1>
        <p className="text-ink-muted mt-1">Classifique por cor e acompanhe cada frente.</p>
      </header>
      <ProjectsManager projects={data} />
    </div>
  );
}
