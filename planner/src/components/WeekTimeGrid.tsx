import { TaskDTO, minToHHMM } from "@/lib/types";
import { colorFor } from "@/lib/colors";
import { occurrencesInRange, isOccurrenceDone } from "@/lib/recurrence";
import { startOfWeek, endOfWeek, addDays, WEEKDAYS_SHORT, isSameDay } from "@/lib/date";

const START_HOUR = 6;
const END_HOUR = 23;
const HOUR_PX = 46;
const TOTAL_MIN = (END_HOUR - START_HOUR) * 60;
const GRID_H = (END_HOUR - START_HOUR) * HOUR_PX;

type TimedItem = { task: TaskDTO; start: number; end: number; done: boolean };
type Timed = TimedItem & { col: number; cols: number };

function layout(items: TimedItem[]): Timed[] {
  const evs = items.slice().sort((a, b) => a.start - b.start || a.end - b.end);
  const placed: Timed[] = [];
  let i = 0;
  while (i < evs.length) {
    let j = i + 1;
    let clusterEnd = evs[i].end;
    while (j < evs.length && evs[j].start < clusterEnd) {
      clusterEnd = Math.max(clusterEnd, evs[j].end);
      j++;
    }
    const cluster = evs.slice(i, j);
    const cols: number[] = [];
    const assign: number[] = [];
    cluster.forEach((e) => {
      let c = cols.findIndex((end) => end <= e.start);
      if (c === -1) { c = cols.length; cols.push(e.end); } else { cols[c] = e.end; }
      assign.push(c);
    });
    cluster.forEach((e, k) => placed.push({ ...e, col: assign[k], cols: cols.length }));
    i = j;
  }
  return placed;
}

export default function WeekTimeGrid({ anchor, tasks }: { anchor: Date; tasks: TaskDTO[] }) {
  const wkStart = startOfWeek(anchor);
  const wkEnd = endOfWeek(anchor);
  const now = new Date();
  const days = Array.from({ length: 7 }, (_, i) => addDays(wkStart, i));
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const nowTop = ((nowMin - START_HOUR * 60) / TOTAL_MIN) * GRID_H;

  // distribui ocorrências da semana em "com horário" (bloco) e "dia todo/multi-dias"
  const timed: TimedItem[][] = days.map(() => []);
  const allday: { task: TaskDTO; done: boolean }[][] = days.map(() => []);
  for (const t of tasks) {
    for (const occ of occurrencesInRange(t, wkStart, wkEnd)) {
      const di = days.findIndex((d) => isSameDay(d, occ.date));
      if (di < 0) continue;
      const done = isOccurrenceDone(t, occ.date);
      if (occ.startMin !== null && !occ.multiDay) {
        const end = occ.endMin !== null && occ.endMin > occ.startMin ? occ.endMin : occ.startMin + t.durationMin;
        timed[di].push({ task: t, start: occ.startMin, end, done });
      } else {
        allday[di].push({ task: t, done });
      }
    }
  }

  const hasAllDay = allday.some((a) => a.length > 0);

  return (
    <div className="border border-line rounded-xl overflow-hidden bg-surface">
      <div className="grid" style={{ gridTemplateColumns: `52px repeat(7, 1fr)` }}>
        <div className="border-b border-line2" />
        {days.map((d, i) => {
          const today = isSameDay(d, now);
          return (
            <div key={i} className="border-b border-l border-line2 px-2 py-2 text-center">
              <div className="text-[11px] text-ink-muted">{WEEKDAYS_SHORT[i]}</div>
              <div className={`text-sm mt-0.5 inline-grid place-items-center size-7 rounded-full ${today ? "bg-accent text-white font-semibold" : "text-ink"}`}>{d.getDate()}</div>
            </div>
          );
        })}
      </div>

      {hasAllDay && (
        <div className="grid border-b border-line2" style={{ gridTemplateColumns: `52px repeat(7, 1fr)` }}>
          <div className="text-right pr-1 py-1 text-[10px] text-ink-muted">dia todo</div>
          {days.map((_, i) => (
            <div key={i} className="border-l border-line2 p-1 flex flex-col gap-1 min-h-[28px]">
              {allday[i].map((it, k) => {
                const c = colorFor(it.task.projects[0]?.color);
                return (
                  <div key={k} className={`text-[11px] leading-tight rounded px-1.5 py-0.5 break-words ${it.done ? "line-through opacity-60" : ""}`} style={{ backgroundColor: c.soft, color: c.hex }} title={it.task.title}>
                    {it.task.title}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      <div className="grid" style={{ gridTemplateColumns: `52px repeat(7, 1fr)` }}>
        <div className="relative" style={{ height: GRID_H }}>
          {hours.map((h, idx) => (
            <div key={h} className="absolute left-0 right-1 text-right text-[10px] text-ink-muted" style={{ top: idx * HOUR_PX - 6 }}>
              {idx === 0 ? "" : `${String(h).padStart(2, "0")}:00`}
            </div>
          ))}
        </div>

        {days.map((day, di) => {
          const placed = layout(timed[di]);
          const today = isSameDay(day, now);
          return (
            <div key={di} className="relative border-l border-line2" style={{ height: GRID_H }}>
              {hours.map((_, idx) => (
                <div key={idx} className="absolute left-0 right-0 border-t border-line2" style={{ top: idx * HOUR_PX }} />
              ))}
              {today && nowTop >= 0 && nowTop <= GRID_H && (
                <div className="absolute left-0 right-0 z-10" style={{ top: nowTop }}>
                  <div className="h-px bg-accent" />
                  <div className="absolute -left-1 -top-1 size-2 rounded-full bg-accent" />
                </div>
              )}
              {placed.map((p, k) => {
                const c = colorFor(p.task.projects[0]?.color);
                const top = ((p.start - START_HOUR * 60) / TOTAL_MIN) * GRID_H;
                const height = Math.max(((p.end - p.start) / TOTAL_MIN) * GRID_H, 22);
                const widthPct = 100 / p.cols;
                const done = p.done;
                return (
                  <div
                    key={k}
                    className="absolute rounded-md px-1.5 py-1 overflow-hidden"
                    style={{
                      top, height,
                      left: `calc(${p.col * widthPct}% + 2px)`,
                      width: `calc(${widthPct}% - 4px)`,
                      backgroundColor: c.soft,
                      borderLeft: `3px solid ${c.hex}`,
                      opacity: done ? 0.55 : 1,
                    }}
                    title={`${p.task.title} · ${minToHHMM(p.start)}–${minToHHMM(p.end)}`}
                  >
                    <div className="text-[11px] leading-tight font-medium break-words" style={{ color: c.hex }}>{p.task.title}</div>
                    <div className="text-[10px]" style={{ color: c.hex, opacity: 0.8 }}>{minToHHMM(p.start)}–{minToHHMM(p.end)}</div>
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
