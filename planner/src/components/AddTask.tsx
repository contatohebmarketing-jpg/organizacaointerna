"use client";

import { useState, useTransition } from "react";
import { ProjectDTO } from "@/lib/types";
import { createTask } from "@/app/actions";

export default function AddTask({
  projects,
  defaultProjectId = "",
  defaultStatus = "todo",
  compact = false,
  label = "Nova tarefa",
}: {
  projects: ProjectDTO[];
  defaultProjectId?: string;
  defaultStatus?: string;
  compact?: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState(defaultProjectId);
  const [priority, setPriority] = useState("media");
  const [dueDate, setDueDate] = useState("");

  function submit() {
    if (!title.trim()) return;
    start(async () => {
      await createTask({
        title,
        projectId: projectId || null,
        priority,
        dueDate: dueDate || null,
        status: defaultStatus,
      });
      setTitle("");
      setDueDate("");
      setPriority("media");
      if (compact) setOpen(false);
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={compact ? "w-full text-left text-sm text-ink-muted hover:text-teal px-2 py-1.5" : "btn-primary"}
      >
        + {label}
      </button>
    );
  }

  return (
    <div className="card p-3 grid gap-2.5">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
        placeholder="O que precisa ser feito?"
        className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
      />
      <div className="flex flex-wrap gap-2">
        <select value={projectId} onChange={(e) => setProjectId(e.target.value)}
          className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs text-ink">
          <option value="">— sem projeto —</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)}
          className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs text-ink">
          <option value="alta">Alta</option>
          <option value="media">Média</option>
          <option value="baixa">Baixa</option>
        </select>
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
          className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs text-ink" />
        <div className="ml-auto flex gap-2">
          <button onClick={() => setOpen(false)} className="btn-ghost text-xs">Cancelar</button>
          <button disabled={pending} onClick={submit} className="btn-primary text-xs">Adicionar</button>
        </div>
      </div>
    </div>
  );
}
