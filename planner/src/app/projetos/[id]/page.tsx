import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { listProjects, listTasks, bucketTasks } from "@/lib/data";
import TasksView from "@/components/TasksView";
import ProjectHeader from "@/components/ProjectHeader";

export const dynamic = "force-dynamic";

export default async function ProjetoPage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project) notFound();

  const now = new Date();
  const [all, projects] = await Promise.all([
    listTasks({ projects: { some: { id: params.id } } }),
    listProjects(),
  ]);
  const buckets = bucketTasks(all, now);
  const done = all
    .filter((t) => t.status === "done")
    .sort((a, b) => (b.completedAt || "").localeCompare(a.completedAt || ""));

  return (
    <div className="flex flex-col gap-6">
      <ProjectHeader project={{ id: project.id, name: project.name, color: project.color }} />
      <TasksView buckets={buckets} done={done} all={all} projects={projects} />
    </div>
  );
}
