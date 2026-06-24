import { TaskDTO, minToHHMM, durationLabel } from "@/lib/types";
import { colorFor } from "@/lib/colors";
import { startOfWeek, addDays, WEEKDAYS_SHORT, isSameDay } from "@/lib/date";

const START_HOUR = 6;
const END_HOUR = 23;
const HOUR_PX = 46;
const TOTAL_MIN = (END_HOUR - START_HOUR) * 60;
const GRID_H = (END_HOUR - START_HOUR) * HOUR_PX;

type Placed = { task: TaskDTO; start: number; end: number; col: number; cols: number };

// Distribui eventos sobrepostos em colunas lado a lado (estilo agenda)
function layoutDay(tasks: TaskDTO[]): Placed[] {
  const evs = tasks
    .filter((t) => t.startMin !== null)
    .map((t) => ({ task: t, start: t.startMin as number, end: (t.startMin as number) + t.durationMin }))
    .sort((a, b) => a.start - b.start || a.end - b.end);

  const placed: Placed[] = [];
  let i = 0;
  while (i < evs.length) {
    // cluster de eventos encadeados por sobreposição
    let j = i + 1;
    let clusterEnd = evs[i].end;
    while (j < evs.length && evs[j].start < clusterEnd) {
      clusterEnd = Math.max(clusterEnd, evs[j].end);
      j++;
    }
    const cluster = evs.slice(i, j);
    const cols: number[] = []; // fim do último evento em cada coluna
    const assign: number[] = [];
    cluster.forEach((e) => {
      let c = cols.findIndex((end) => end <= e.start);
      if (c === -1) { c = cols.length; cols.push(e.end); } else { cols[c] = e.end; }
      assign.push(c);
    });
    const total = cols.length;
    cluster.forEach((e, k) => placed.push({ ...e, col: assign[k], cols: total }));
    i = j;
  }
  return placed;
}

export default function WeekTimeGrid({ anchor, tasks }: { anchor: Date; tasks: TaskDTO[] }) {
  const start = startOfWeek(anchor);
  const now = new Date();
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const nowTop = ((nowMin - START_HOUR * 60) / TOTAL_MIN) * GRID_H;

  return (
    <div className="border border-line rounded-xl overflow-hidden bg-surface">
      {/* Cabeçalho dos dias */}
      <div className="grid" style={{ gridTemplateColumns: `52px repeat(7, 1fr)` }}>
        <div className="border-b border-line2" />
        {days.map((d, i) => {
          const today = isSameDay(d, now);
          return (
            <div key={i} className="border-b border-l border-line2 px-2 py-2 text-center">
              <div className="text-[11px] text-ink-muted">{WEEKDAYS_SHORT[i]}</div>
              <div className={`text-sm mt-0.5 inline-grid place-items-center size-7 rounded-full ${today ? "bg-accent text-white font-semibold" : "text-ink"}`}>
                {d.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Faixa de itens sem horário */}
      <AllDayRow days={days} tasks={tasks} now={now} />

      {/* Grade de horários */}
      <div className="grid" style={{ gridTemplateColumns: `52px repeat(7, 1fr)` }}>
        {/* coluna de horas */}
        <div className="relative" style={{ height: GRID_H }}>
          {hours.map((h, idx) => (
            <div key={h} className="absolute left-0 right-1 text-right text-[10px] text-ink-muted" style={{ top: idx * HOUR_PX - 6 }}>
              {idx === 0 ? "" : `${String(h).padStart(2, "0")}:00`}
            </div>
          ))}
        </div>

        {/* 7 colunas de dias */}
        {days.map((day, di) => {
          const dayTasks = tasks.filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), day));
          const placed = layoutDay(dayTasks);
          const today = isSameDay(day, now);
          return (
            <div key={di} className="relative border-l border-line2" style={{ height: GRID_H }}>
              {/* linhas das horas */}
              {hours.map((_, idx) => (
                <div key={idx} className="absolute left-0 right-0 border-t border-line2" style={{ top: idx * HOUR_PX }} />
              ))}
              {/* linha do agora */}
              {today && nowTop >= 0 && nowTop <= GRID_H && (
                <div className="absolute left-0 right-0 z-10" style={{ top: nowTop }}>
                  <div className="h-px bg-accent" />
                  <div className="absolute -left-1 -top-1 size-2 rounded-full bg-accent" />
                </div>
              )}
              {/* eventos */}
              {placed.map((p) => {
                const c = colorFor(p.task.projects[0]?.color);
                const top = ((p.start - START_HOUR * 60) / TOTAL_MIN) * GRID_H;
                const height = Math.max((p.task.durationMin / TOTAL_MIN) * GRID_H, 22);
                const widthPct = 100 / p.cols;
                const done = p.task.status === "done";
                return (
                  <div
                    key={p.task.id}
                    className="absolute rounded-md px-1.5 py-1 overflow-hidden"
                    style={{
                      top, height,
                      left: `calc(${p.col * widthPct}% + 2px)`,
                      width: `calc(${widthPct}% - 4px)`,
                      backgroundColor: c.soft,
                      borderLeft: `3px solid ${c.hex}`,
                      opacity: done ? 0.55 : 1,
                    }}
                    title={`${p.task.title} · ${minToHHMM(p.task.startMin)} (${durationLabel(p.task.durationMin)})`}
                  >
                    <div className="text-[11px] leading-tight font-medium break-words" style={{ color: c.hex }}>
                      {p.task.title}
                    </div>
                    <div className="text-[10px]" style={{ color: c.hex, opacity: 0.8 }}>
                      {minToHHMM(p.task.startMin)} · {durationLabel(p.task.durationMin)}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AllDayRow({ days, tasks, now }: { days: Date[]; tasks: TaskDTO[]; now: Date }) {
  const has = days.some((day) => tasks.some((t) => t.dueDate && isSameDay(new Date(t.dueDate), day) && t.startMin === null));
  if (!has) return null;
  return (
    <div className="grid border-b border-line2" style={{ gridTemplateColumns: `52px repeat(7, 1fr)` }}>
      <div className="text-right pr-1 py-1 text-[10px] text-ink-muted">dia todo</div>
      {days.map((day, i) => {
        const items = tasks.filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), day) && t.startMin === null);
        return (
          <div key={i} className="border-l border-line2 p-1 flex flex-col gap-1 min-h-[28px]">
            {items.map((t) => {
              const c = colorFor(t.projects[0]?.color);
              return (
                <div key={t.id} className={`text-[11px] leading-tight rounded px-1.5 py-0.5 break-words ${t.status === "done" ? "line-through opacity-60" : ""}`} style={{ backgroundColor: c.soft, color: c.hex }}>
                  {t.title}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
