"use client";

import { useState, useTransition } from "react";
import { TaskDTO, ProjectDTO, STATUS_LABEL, minToHHMM, REPEAT_LABEL } from "@/lib/types";
import { colorFor } from "@/lib/colors";
import { dueLabel } from "@/lib/format";
import { setTaskStatus, toggleTask } from "@/app/actions";
import AddTask from "./AddTask";

const COLUMNS: { key: TaskDTO["status"]; accent: string }[] = [
  { key: "todo", accent: "#8A929C" },
  { key: "doing", accent: "#D69011" },
  { key: "done", accent: "#1F9D6B" },
];

export default function KanbanBoard({ tasks, projects }: { tasks: TaskDTO[]; projects: ProjectDTO[] }) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [, start] = useTransition();

  function drop(status: TaskDTO["status"]) {
    if (dragId) start(() => setTaskStatus(dragId, status));
    setDragId(null);
    setOver(null);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {COLUMNS.map((col) => {
        const items = tasks.filter((t) => t.status === col.key);
        return (
          <div
            key={col.key}
            onDragOver={(e) => { e.preventDefault(); setOver(col.key); }}
            onDragLeave={() => setOver((o) => (o === col.key ? null : o))}
            onDrop={() => drop(col.key)}
            className={`rounded-xl p-3 transition-colors ${over === col.key ? "bg-accent-soft" : "bg-offwhite"}`}
          >
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: col.accent }} />
              <h3 className="text-sm font-medium text-ink">{STATUS_LABEL[col.key]}</h3>
              <span className="text-xs text-ink-muted">{items.length}</span>
            </div>
            <div className="flex flex-col gap-2 min-h-[40px]">
              {items.map((t) => (
                <KanbanCard key={t.id} task={t} onDragStart={() => setDragId(t.id)} />
              ))}
            </div>
            <div className="mt-2">
              <AddTask projects={projects} defaultStatus={col.key} compact label={`em ${STATUS_LABEL[col.key]}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KanbanCard({ task, onDragStart }: { task: TaskDTO; onDragStart: () => void }) {
  const [, start] = useTransition();
  const primary = colorFor(task.projects[0]?.color);
  const due = dueLabel(task.dueDate);
  const done = task.status === "done";
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="card p-3 cursor-grab active:cursor-grabbing"
      style={{ borderLeft: `3px solid ${primary.hex}` }}
    >
      <div className="flex items-start gap-2">
        <button
          aria-label="concluir"
          onClick={() => start(() => toggleTask(task.id, !done))}
          className={`mt-0.5 size-[16px] shrink-0 rounded-[5px] border flex items-center justify-center ${done ? "bg-accent border-accent text-white" : "border-ink-muted/50"}`}
        >
          {done && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m5 12 5 5 9-11" strokeLinecap="round" strokeLinejoin="round" /></svg>
          )}
        </button>
        <p className={`text-sm leading-snug ${done ? "line-through text-ink-muted" : "text-ink"}`}>{task.title}</p>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 mt-2 pl-6">
        {task.projects.map((p) => {
          const c = colorFor(p.color);
          return <span key={p.id} className="chip" style={{ backgroundColor: c.soft, color: c.hex }}>{p.name}</span>;
        })}
      </div>
      <div className="flex items-center gap-2 mt-1.5 pl-6 text-[11px] text-ink-muted">
        {task.startMin !== null && (
          <span>{minToHHMM(task.startMin)}{task.endMin !== null ? "–" + minToHHMM(task.endMin) : ""}</span>
        )}
        {task.repeat !== "none" && <span className="text-accent">· {REPEAT_LABEL[task.repeat]}</span>}
        {task.repeat === "none" && task.dueDate && (
          <span className={due.tone === "late" ? "text-danger" : ""}>· {due.text}</span>
        )}
      </div>
    </div>
  );
}
