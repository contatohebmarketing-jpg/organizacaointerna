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
      {/* Saudação */}
      <header>
        <h1 className="display text-4xl md:text-5xl text-ink">
          {greetingFor(now)}, <span className="text-teal">{NAME}</span>.
        </h1>
        <p className="text-ink-muted mt-1 capitalize">
          {now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </header>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Tarefas pra hoje" value={dash.stats.todayCount} />
        <Stat label="Atrasadas" value={dash.stats.overdue} tone={dash.stats.overdue > 0 ? "alert" : "ok"} />
        <Stat label="Prazos na semana" value={dash.stats.dueThisWeek} />
        <Stat label="Concluídas na semana" value={dash.stats.doneThisWeek} tone="ok" />
      </div>

      {/* Resumo da semana */}
      <section className="card p-5">
        <p className="stat-label mb-2">Resumo da semana</p>
        <p className="text-[15px] leading-relaxed text-ink-soft">{dash.summary}</p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Tarefas do dia por prioridade */}
        <section className="lg:col-span-3 card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="display text-xl text-ink">Prioridades de hoje</h2>
            <a href="/tarefas" className="text-xs text-teal hover:underline">ver todas</a>
          </div>
          <div className="flex flex-col gap-2">
            {dash.todayTasks.length === 0 ? (
              <Empty text="Nada para hoje. Aproveite o respiro ✨" />
            ) : (
              dash.todayTasks.map((t) => <TaskRow key={t.id} task={t} projects={projects} />)
            )}
          </div>
        </section>

        {/* Gráfico + calendário */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <section className="card p-5">
            <div className="flex items-center justify-between mb-1">
              <h2 className="display text-xl text-ink">Prazos da semana</h2>
              <span className="text-sm text-leaf font-medium">{dash.stats.weekProgress}%</span>
            </div>
            <p className="stat-label mb-3">execução vs. previsto</p>
            <WeekChart week={dash.week} />
          </section>

          <section className="card p-5">
            <h2 className="display text-xl text-ink mb-3 capitalize">{monthTitle(now)}</h2>
            <MonthCalendar month={now} tasks={allTasks} compact />
            <a href="/calendario" className="mt-3 inline-block text-xs text-teal hover:underline">abrir calendário</a>
          </section>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone = "neutral" }: { label: string; value: number; tone?: "neutral" | "ok" | "alert" }) {
  const valueColor = tone === "alert" && value > 0 ? "text-[#B14A33]" : tone === "ok" ? "text-teal" : "text-ink";
  return (
    <div className="card px-4 py-4">
      <p className="stat-label">{label}</p>
      <p className={`display text-4xl mt-1 ${valueColor}`}>{value}</p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-ink-muted py-6 text-center">{text}</p>;
}
