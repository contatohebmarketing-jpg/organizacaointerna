import { getDashboard, listProjects, listTasks } from "@/lib/data";
import { greetingFor } from "@/lib/date";
import TaskRow from "@/components/TaskRow";
import WeekChart from "@/components/WeekChart";
import MonthCalendar, { monthTitle } from "@/components/MonthCalendar";

export const dynamic = "force-dynamic";

const NAME = "Thally";

export default async function DashboardPage() {
  const now = new Date();
  const [dash, projects, allTasks] = await Promise.all([
    getDashboard(now),
    listProjects(),
    listTasks({}),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="h-title text-3xl md:text-4xl">
          {greetingFor(now)}, {NAME}.
        </h1>
        <p className="text-ink-muted mt-1 capitalize">
          {now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Tarefas pra hoje" value={dash.stats.todayCount} />
        <Stat label="Atrasadas" value={dash.stats.overdue} tone={dash.stats.overdue > 0 ? "alert" : "ok"} />
        <Stat label="Prazos na semana" value={dash.stats.dueThisWeek} />
        <Stat label="Concluídas na semana" value={dash.stats.doneThisWeek} tone="ok" />
      </div>

      {/* Sugestões de produtividade */}
      <section className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <SparkIcon />
          <h2 className="text-sm font-semibold text-ink">Pra você render mais na próxima semana</h2>
        </div>
        <p className="text-[15px] text-ink-soft mb-3">{dash.headline}</p>
        <ul className="flex flex-col gap-2">
          {dash.suggestions.map((s, i) => (
            <li key={i} className="flex gap-2.5 text-sm text-ink-soft">
              <span className="mt-1.5 size-1.5 rounded-full bg-accent shrink-0" />
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <section className="lg:col-span-3 card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="h-title text-lg">Prioridades de hoje</h2>
            <a href="/tarefas" className="text-xs text-accent hover:underline">ver todas</a>
          </div>
          <div className="flex flex-col gap-2">
            {dash.todayTasks.length === 0 ? (
              <p className="text-sm text-ink-muted py-6 text-center">Nada para hoje. Aproveite o respiro ✨</p>
            ) : (
              dash.todayTasks.map((t) => <TaskRow key={t.id} task={t} projects={projects} />)
            )}
          </div>
        </section>

        <div className="lg:col-span-2 flex flex-col gap-4">
          <section className="card p-5">
            <div className="flex items-center justify-between mb-1">
              <h2 className="h-title text-lg">Prazos da semana</h2>
              <span className="text-sm text-progress font-medium">{dash.stats.weekProgress}%</span>
            </div>
            <p className="stat-label mb-3">execução vs. previsto</p>
            <WeekChart week={dash.week} />
          </section>

          <section className="card p-5">
            <h2 className="h-title text-lg mb-3 capitalize">{monthTitle(now)}</h2>
            <MonthCalendar month={now} tasks={allTasks} compact />
            <a href="/calendario" className="mt-3 inline-block text-xs text-accent hover:underline">abrir calendário</a>
          </section>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone = "neutral" }: { label: string; value: number; tone?: "neutral" | "ok" | "alert" }) {
  const valueColor = tone === "alert" && value > 0 ? "text-danger" : tone === "ok" ? "text-progress" : "text-ink";
  return (
    <div className="card px-4 py-4">
      <p className="stat-label">{label}</p>
      <p className={`h-title text-3xl mt-1 ${valueColor}`}>{value}</p>
    </div>
  );
}

function SparkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2F6FE0" strokeWidth="1.8">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" strokeLinecap="round" />
    </svg>
  );
}
