import { WeekDay } from "@/lib/data";

export default function WeekChart({ week }: { week: WeekDay[] }) {
  const max = Math.max(1, ...week.map((d) => Math.max(d.due, d.done)));
  return (
    <div>
      <div className="flex items-end justify-between gap-2 h-32">
        {week.map((d) => {
          const dueH = (d.due / max) * 100;
          const doneH = (d.done / max) * 100;
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-2">
              <div className="relative w-full max-w-[32px] h-[100px] flex items-end">
                <div className="absolute bottom-0 w-full rounded-md bg-line2" style={{ height: `${Math.max(dueH, 4)}%` }} title={`${d.due} com prazo`} />
                <div className="absolute bottom-0 w-full rounded-md bg-progress" style={{ height: `${doneH}%` }} title={`${d.done} concluídas`} />
              </div>
              <span className={`text-[11px] ${d.isToday ? "text-accent font-semibold" : "text-ink-muted"}`}>{d.label}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-4 text-[11px] text-ink-muted">
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-progress" /> concluídas</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-line2" /> com prazo no dia</span>
      </div>
    </div>
  );
}
