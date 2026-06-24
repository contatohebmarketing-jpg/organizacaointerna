"use client";

import { useState, useTransition } from "react";
import { TaskDTO, ProjectDTO } from "@/lib/types";
import { colorFor } from "@/lib/colors";
import { dueLabel, toDateInputValue } from "@/lib/format";
import { toggleTask, updateTask, deleteTask } from "@/app/actions";
import PriorityBadge from "./PriorityBadge";

export default function TaskRow({
  task,
  projects,
}: {
  task: TaskDTO;
  projects: ProjectDTO[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const done = task.status === "done";
  const due = dueLabel(task.dueDate);
  const color = colorFor(task.project?.color);

  const toneClass =
    due.tone === "late"
      ? "text-[#B14A33]"
      : due.tone === "today"
      ? "text-teal font-medium"
      : due.tone === "soon"
      ? "text-ink-soft"
      : "text-ink-muted";

  return (
    <div className={`group rounded-xl border border-line bg-white ${pending ? "opacity-60" : ""}`}>
      <div className="flex items-center gap-3 px-3.5 py-2.5">
        <button
          aria-label="concluir"
          onClick={() => start(() => toggleTask(task.id, !done))}
          className={`size-[18px] shrink-0 rounded-[6px] border flex items-center justify-center transition-colors ${
            done ? "bg-teal border-teal text-white" : "border-ink-muted/50 hover:border-teal"
          }`}
        >
          {done && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="m5 12 5 5 9-11" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        <button onClick={() => setOpen((v) => !v)} className="flex-1 text-left min-w-0">
          <span className={`text-[15px] ${done ? "line-through text-ink-muted" : "text-ink"}`}>
            {task.title}
          </span>
        </button>

        <div className="hidden sm:flex items-center gap-2.5 shrink-0">
          {task.project && (
            <span className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: color.hex }} />
              {task.project.name}
            </span>
          )}
          {!done && <PriorityBadge priority={task.priority} />}
          <span className={`text-xs ${toneClass} w-20 text-right`}>{due.text}</span>
        </div>
      </div>

      {open && (
        <Editor
          task={task}
          projects={projects}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function Editor({
  task,
  projects,
  onClose,
}: {
  task: TaskDTO;
  projects: ProjectDTO[];
  onClose: () => void;
}) {
  const [pending, start] = useTransition();
  const [title, setTitle] = useState(task.title);
  const [projectId, setProjectId] = useState(task.project?.id ?? "");
  const [priority, setPriority] = useState(task.priority);
  const [dueDate, setDueDate] = useState(toDateInputValue(task.dueDate));

  return (
    <div className="border-t border-line px-3.5 py-3 grid gap-2.5 sm:grid-cols-2 bg-cream-50 rounded-b-xl">
      <label className="text-xs text-ink-muted sm:col-span-2">
        Título
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
        />
      </label>
      <label className="text-xs text-ink-muted">
        Projeto
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
        >
          <option value="">— sem projeto —</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </label>
      <label className="text-xs text-ink-muted">
        Prioridade
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as TaskDTO["priority"])}
          className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
        >
          <option value="alta">Alta</option>
          <option value="media">Média</option>
          <option value="baixa">Baixa</option>
        </select>
      </label>
      <label className="text-xs text-ink-muted">
        Prazo
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
        />
      </label>
      <div className="flex items-center justify-between sm:col-span-2 pt-1">
        <button
          onClick={() => start(async () => { await deleteTask(task.id); })}
          className="text-xs text-[#B14A33] hover:underline"
        >
          Excluir tarefa
        </button>
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-ghost text-xs">Fechar</button>
          <button
            disabled={pending}
            onClick={() =>
              start(async () => {
                await updateTask(task.id, {
                  title,
                  projectId: projectId || null,
                  priority,
                  dueDate: dueDate || null,
                });
                onClose();
              })
            }
            className="btn-primary text-xs"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
