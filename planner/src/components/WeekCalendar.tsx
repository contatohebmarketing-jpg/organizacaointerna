import { TaskDTO } from "@/lib/types";
import { colorFor } from "@/lib/colors";
import { startOfWeek, addDays, WEEKDAYS_SHORT, isSameDay } from "@/lib/date";

export default function WeekCalendar({
  anchor,
  tasks,
}: {
  anchor: Date;
  tasks: TaskDTO[];
}) {
  const start = startOfWeek(anchor);
  const now = new Date();
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
      {days.map((day, i) => {
        const today = isSameDay(day, now);
        const dayTasks = tasks
          .filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), day))
          .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));
        return (
          <div key={i} className={`rounded-xl border min-h-[180px] p-2 ${today ? "border-teal bg-cream-50" : "border-line bg-white"}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-ink-muted">{WEEKDAYS_SHORT[i]}</span>
              <span className={`text-xs grid place-items-center size-6 rounded-full ${today ? "bg-ink text-white font-semibold" : "text-ink-soft"}`}>
                {day.getDate()}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              {dayTasks.map((t) => {
                const c = colorFor(t.project?.color);
                return (
                  <div
                    key={t.id}
                    className={`text-[11px] leading-tight rounded-md px-1.5 py-1 ${t.status === "done" ? "line-through opacity-60" : ""}`}
                    style={{ backgroundColor: c.soft, color: c.hex }}
                    title={t.title}
                  >
                    {t.title}
                  </div>
                );
              })}
              {dayTasks.length === 0 && <span className="text-[11px] text-ink-muted/60">—</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
