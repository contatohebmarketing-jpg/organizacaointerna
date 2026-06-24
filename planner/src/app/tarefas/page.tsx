import { listProjects, listTasks, bucketTasks } from "@/lib/data";
import TasksView from "@/components/TasksView";

export const dynamic = "force-dynamic";

export default async function TarefasPage() {
  const now = new Date();
  const [all, projects] = await Promise.all([listTasks({}), listProjects()]);
  const buckets = bucketTasks(all, now);
  const done = all
    .filter((t) => t.status === "done")
    .sort((a, b) => (b.completedAt || "").localeCompare(a.completedAt || ""));

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="h-title text-3xl text-ink">Minhas tarefas</h1>
        <p className="text-ink-muted mt-1">Organizadas por prazo, prontas pra dar check.</p>
      </header>
      <TasksView buckets={buckets} done={done} all={all} projects={projects} />
    </div>
  );
}
