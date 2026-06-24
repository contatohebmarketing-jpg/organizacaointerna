import { listProjects, listTasks } from "@/lib/data";
import CalendarView from "@/components/CalendarView";

export const dynamic = "force-dynamic";

export default async function CalendarioPage() {
  const [tasks, projects] = await Promise.all([listTasks({}), listProjects()]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="h-title text-3xl text-ink">Calendário</h1>
        <p className="text-ink-muted mt-1">Suas tarefas no tempo, coloridas por projeto.</p>
      </header>
      <CalendarView tasks={tasks} projects={projects} />
    </div>
  );
}
