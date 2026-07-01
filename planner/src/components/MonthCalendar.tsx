import { TaskDTO, minToHHMM } from "@/lib/types";
import { colorFor } from "@/lib/colors";
import { occurrencesInRange, isOccurrenceDone } from "@/lib/recurrence";
import { monthGrid, WEEKDAYS_SHORT, isSameDay } from "@/lib/date";

function keyOf(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

type Item = { task: TaskDTO; date: Date; startMin: number | null; multiDay: boolean };

export default function MonthCalendar({
  month,
  tasks,
  compact = false,
}: {
  month: Date;
  tasks: TaskDTO[];
  compact?: boolean;
}) {
  const grid = monthGrid(month);
  const flat = grid.flat();
  const rangeStart = flat[0];
  const rangeEnd = flat[flat.length - 1];
  const now = new Date();
  const monthIndex = month.getMonth();

  const byDay = new Map<string, Item[]>();
  for (const t of tasks) {
    for (const occ of occurrencesInRange(t, rangeStart, rangeEnd)) {
      const k = keyOf(occ.date);
      if (!byDay.has(k)) byDay.set(k, []);
      byDay.get(k)!.push({ task: t, date: occ.date, startMin: occ.startMin, multiDay: occ.multiDay });
    }
  }
  for (const arr of byDay.values()) arr.sort((a, b) => (a.startMin ?? 9999) - (b.startMin ?? 9999));

  return (
    <div>
      <div className="grid grid-cols-7 mb-1.5">
        {WEEKDAYS_SHORT.map((w) => (
          <div key={w} className="text-center text-[11px] text-ink-muted py-1">{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {flat.map((day, i) => {
          const inMonth = day.getMonth() === monthIndex;
          const today = isSameDay(day, now);
          const items = byDay.get(keyOf(day)) ?? [];
          const max = compact ? 0 : 6;
          return (
            <div
              key={i}
              className={`rounded-lg border p-1.5 ${compact ? "min-h-0 aspect-square" : "min-h-[124px]"} ${
                inMonth ? "border-line bg-surface" : "border-transparent bg-transparent opacity-40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs grid place-items-center size-6 rounded-full ${today ? "bg-accent text-white font-semibold" : "text-ink-soft"}`}>
                  {day.getDate()}
                </span>
                {compact && items.length > 0 && (
                  <span className="flex gap-0.5">
                    {items.slice(0, 3).map((it, j) => (
                      <span key={j} className="size-1.5 rounded-full" style={{ backgroundColor: colorFor(it.task.projects[0]?.color).hex }} />
                    ))}
                  </span>
                )}
              </div>
              {!compact && (
                <div className="mt-1 flex flex-col gap-1">
                  {items.slice(0, max).map((it, j) => {
                    const c = colorFor(it.task.projects[0]?.color);
                    const doneHere = isOccurrenceDone(it.task, it.date);
                    return (
                      <div
                        key={j}
                        className={`text-[11px] leading-tight rounded px-1.5 py-1 break-words ${doneHere ? "line-through opacity-60" : ""}`}
                        style={{ backgroundColor: c.soft, color: c.hex }}
                        title={it.task.title}
                      >
                        {it.multiDay && <span className="font-medium">• </span>}
                        {it.startMin !== null && <span className="font-medium">{minToHHMM(it.startMin)} </span>}
                        {it.task.title}
                      </div>
                    );
                  })}
                  {items.length > max && <span className="text-[10px] text-ink-muted px-1">+{items.length - max}</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function monthTitle(d: Date): string {
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}
