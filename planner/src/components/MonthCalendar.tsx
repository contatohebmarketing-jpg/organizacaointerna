import { TaskDTO } from "@/lib/types";
import { colorFor } from "@/lib/colors";
import { minToHHMM } from "@/lib/types";
import { monthGrid, WEEKDAYS_SHORT, isSameDay } from "@/lib/date";

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
  const now = new Date();
  const monthIndex = month.getMonth();

  const tasksByDay = (day: Date) =>
    tasks
      .filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), day))
      .sort((a, b) => (a.startMin ?? 9999) - (b.startMin ?? 9999));

  return (
    <div>
      <div className="grid grid-cols-7 mb-1.5">
        {WEEKDAYS_SHORT.map((w) => (
          <div key={w} className="text-center text-[11px] text-ink-muted py-1">{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {grid.flat().map((day, i) => {
          const inMonth = day.getMonth() === monthIndex;
          const today = isSameDay(day, now);
          const dayTasks = tasksByDay(day);
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
                {compact && dayTasks.length > 0 && (
                  <span className="flex gap-0.5">
                    {dayTasks.slice(0, 3).map((t) => (
                      <span key={t.id} className="size-1.5 rounded-full" style={{ backgroundColor: colorFor(t.projects[0]?.color).hex }} />
                    ))}
                  </span>
                )}
              </div>
              {!compact && (
                <div className="mt-1 flex flex-col gap-1">
                  {dayTasks.slice(0, max).map((t) => {
                    const c = colorFor(t.projects[0]?.color);
                    return (
                      <div
                        key={t.id}
                        className={`text-[11px] leading-tight rounded px-1.5 py-1 break-words ${t.status === "done" ? "line-through opacity-60" : ""}`}
                        style={{ backgroundColor: c.soft, color: c.hex }}
                        title={t.title}
                      >
                        {t.startMin !== null && <span className="font-medium">{minToHHMM(t.startMin)} </span>}
                        {t.title}
                      </div>
                    );
                  })}
                  {dayTasks.length > max && <span className="text-[10px] text-ink-muted px-1">+{dayTasks.length - max}</span>}
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
