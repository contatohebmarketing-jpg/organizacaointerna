"use client";

import { useState } from "react";
import { TaskDTO, ProjectDTO } from "@/lib/types";
import type { Buckets } from "@/lib/data";
import TaskRow from "./TaskRow";
import KanbanBoard from "./KanbanBoard";
import AddTask from "./AddTask";

const SECTIONS: { key: keyof Buckets; label: string; tone?: string }[] = [
  { key: "atrasadas", label: "Atrasadas", tone: "text-[#B14A33]" },
  { key: "hoje", label: "A fazer hoje", tone: "text-teal" },
  { key: "proximos3", label: "Foco dos próximos 3 dias" },
  { key: "semana", label: "Ainda esta semana" },
  { key: "depois", label: "Mais adiante" },
  { key: "semData", label: "Sem data" },
];

export default function TasksView({
  buckets,
  done,
  all,
  projects,
}: {
  buckets: Buckets;
  done: TaskDTO[];
  all: TaskDTO[];
  projects: ProjectDTO[];
}) {
  const [view, setView] = useState<"lista" | "quadro">("lista");
  const [showDone, setShowDone] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-cream-100 rounded-lg p-1">
          <Toggle active={view === "lista"} onClick={() => setView("lista")}>Lista</Toggle>
          <Toggle active={view === "quadro"} onClick={() => setView("quadro")}>Quadro</Toggle>
        </div>
        <AddTask projects={projects} />
      </div>

      {view === "lista" ? (
        <div className="flex flex-col gap-6">
          {SECTIONS.map((s) => {
            const items = buckets[s.key];
            if (items.length === 0) return null;
            return (
              <section key={s.key}>
                <h3 className={`text-sm font-medium mb-2 ${s.tone ?? "text-ink-soft"}`}>
                  {s.label} <span className="text-ink-muted font-normal">· {items.length}</span>
                </h3>
                <div className="flex flex-col gap-2">
                  {items.map((t) => <TaskRow key={t.id} task={t} projects={projects} />)}
                </div>
              </section>
            );
          })}

          {done.length > 0 && (
            <section>
              <button onClick={() => setShowDone((v) => !v)} className="text-sm font-medium text-ink-muted mb-2 hover:text-ink">
                {showDone ? "▾" : "▸"} Concluídas · {done.length}
              </button>
              {showDone && (
                <div className="flex flex-col gap-2">
                  {done.map((t) => <TaskRow key={t.id} task={t} projects={projects} />)}
                </div>
              )}
            </section>
          )}
        </div>
      ) : (
        <KanbanBoard tasks={all} projects={projects} />
      )}
    </div>
  );
}

function Toggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-md text-sm transition-colors ${active ? "bg-white text-ink shadow-card font-medium" : "text-ink-muted hover:text-ink"}`}
    >
      {children}
    </button>
  );
}
