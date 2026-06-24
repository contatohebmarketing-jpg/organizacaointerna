"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TaskDTO, ProjectDTO, minToHHMM, hhmmToMin, durationLabel } from "@/lib/types";
import { colorFor } from "@/lib/colors";
import { dueLabel, toDateInputValue } from "@/lib/format";
import { toggleTask, updateTask, deleteTask } from "@/app/actions";
import PriorityBadge from "./PriorityBadge";
import TaskForm from "./TaskForm";

export default function TaskRow({ task, projects }: { task: TaskDTO; projects: ProjectDTO[] }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  const done = task.status === "done";
  const due = dueLabel(task.dueDate);

  const toneClass =
    due.tone === "late" ? "text-danger"
    : due.tone === "today" ? "text-accent font-medium"
    : due.tone === "soon" ? "text-ink-soft" : "text-ink-muted";

  if (open) {
    return (
      <TaskForm
        projects={projects}
        submitLabel="Salvar"
        pending={pending}
        initial={{
          title: task.title,
          notes: task.notes ?? "",
          projectIds: task.projects.map((p) => p.id),
          dueDate: toDateInputValue(task.dueDate),
          startTime: minToHHMM(task.startMin),
          durationMin: task.durationMin,
        }}
        onCancel={() => setOpen(false)}
        onDelete={() => start(async () => { await deleteTask(task.id); router.refresh(); })}
        onSubmit={(v) =>
          start(async () => {
            await updateTask(task.id, {
              title: v.title,
              notes: v.notes,
              projectIds: v.projectIds,
              dueDate: v.dueDate || null,
              startMin: hhmmToMin(v.startTime),
              durationMin: v.durationMin,
            });
            setOpen(false);
            router.refresh();
          })
        }
      />
    );
  }

  return (
    <div className={`group rounded-xl border border-line bg-surface ${pending ? "opacity-60" : ""}`}>
      <div className="flex items-center gap-3 px-3.5 py-2.5">
        <button
          aria-label="concluir"
          onClick={() => start(async () => { await toggleTask(task.id, !done); router.refresh(); })}
          className={`size-[18px] shrink-0 rounded-[6px] border flex items-center justify-center transition-colors ${
            done ? "bg-accent border-accent text-white" : "border-ink-muted/50 hover:border-accent"
          }`}
        >
          {done && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="m5 12 5 5 9-11" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        <button onClick={() => setOpen(true)} className="flex-1 text-left min-w-0">
          <span className={`text-[15px] ${done ? "line-through text-ink-muted" : "text-ink"}`}>{task.title}</span>
          {task.startMin !== null && (
            <span className="ml-2 text-xs text-ink-muted">
              {minToHHMM(task.startMin)} · {durationLabel(task.durationMin)}
            </span>
          )}
        </button>

        <div className="hidden sm:flex items-center gap-2 shrink-0">
          {task.projects.map((p) => {
            const c = colorFor(p.color);
            return (
              <span key={p.id} className="inline-flex items-center gap-1.5 text-xs" style={{ color: c.hex }}>
                <span className="size-2.5 rounded-full" style={{ backgroundColor: c.hex }} />
                {p.name}
              </span>
            );
          })}
          {!done && <PriorityBadge priority={task.priority} />}
          <span className={`text-xs ${toneClass} w-20 text-right`}>{due.text}</span>
        </div>
      </div>
    </div>
  );
}
