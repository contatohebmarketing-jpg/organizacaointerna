"use client";

import { useState } from "react";
import { TaskDTO, ProjectDTO } from "@/lib/types";
import { colorFor } from "@/lib/colors";
import MonthCalendar from "./MonthCalendar";
import WeekTimeGrid from "./WeekTimeGrid";
import { addDays, startOfWeek, MONTHS_PT } from "@/lib/date";

export default function CalendarView({ tasks, projects }: { tasks: TaskDTO[]; projects: ProjectDTO[] }) {
  const [view, setView] = useState<"mes" | "semana">("mes");
  const [cursor, setCursor] = useState<Date>(new Date());

  function shift(dir: number) {
    if (view === "mes") setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + dir, 1));
    else setCursor(addDays(cursor, dir * 7));
  }

  const title = view === "mes" ? `${MONTHS_PT[cursor.getMonth()]} ${cursor.getFullYear()}` : weekTitle(cursor);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={() => shift(-1)} className="btn-ghost px-2.5">‹</button>
          <h2 className="h-title text-xl capitalize min-w-[170px] text-center">{title}</h2>
          <button onClick={() => shift(1)} className="btn-ghost px-2.5">›</button>
          <button onClick={() => setCursor(new Date())} className="btn-ghost text-xs">hoje</button>
        </div>
        <div className="seg">
          <button data-active={view === "semana"} onClick={() => setView("semana")}>Semana</button>
          <button data-active={view === "mes"} onClick={() => setView("mes")}>Mês</button>
        </div>
      </div>

      {view === "mes" ? (
        <MonthCalendar month={cursor} tasks={tasks} />
      ) : (
        <WeekTimeGrid anchor={cursor} tasks={tasks} />
      )}

      {projects.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 border-t border-line">
          <span className="stat-label">Projetos</span>
          {projects.map((p) => (
            <span key={p.id} className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: colorFor(p.color).hex }} />
              {p.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function weekTitle(d: Date): string {
  const s = startOfWeek(d);
  const e = addDays(s, 6);
  const sm = MONTHS_PT[s.getMonth()].slice(0, 3).toLowerCase();
  const em = MONTHS_PT[e.getMonth()].slice(0, 3).toLowerCase();
  return `${s.getDate()} ${sm} – ${e.getDate()} ${em}`;
}
