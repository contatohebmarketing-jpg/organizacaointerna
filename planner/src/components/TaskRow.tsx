"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TaskDTO, ProjectDTO, minToHHMM, hhmmToMin, REPEAT_LABEL } from "@/lib/types";
import { colorFor } from "@/lib/colors";
import { isMultiDay } from "@/lib/recurrence";
import { dueLabel, toDateInputValue } from "@/lib/format";
import { toggleTask, updateTask, deleteTask } from "@/app/actions";
import PriorityBadge from "./PriorityBadge";
import TaskForm from "./TaskForm";

function shortDay(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
}

export default function TaskRow({ task, projects }: { task: TaskDTO; projects: ProjectDTO[] }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  const done = task.status === "done";
  const multi = isMultiDay(task);

  // tempo / período
  const timeStr =
    task.startMin !== null
      ? `${minToHHMM(task.startMin)}${task.endMin !== null ? "–" + minToHHMM(task.endMin) : ""}`
      : "";

  // rótulo à direita
  let rightText = "";
  let rightTone = "text-ink-muted";
  if (task.repeat !== "none") {
    rightText = REPEAT_LABEL[task.repeat];
    rightTone = "text-accent";
  } else if (multi && task.dueDate && task.endDate) {
    rightText = `${shortDay(task.dueDate)} – ${shortDay(task.endDate)}`;
  } else {
    const due = dueLabel(task.dueDate);
    rightText = due.text;
    rightTone =
      due.tone === "late" ? "text-danger" : due.tone === "today" ? "text-accent font-medium" : due.tone === "soon" ? "text-ink-soft" : "text-ink-muted";
  }

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
          repeat: task.repeat,
          startDate: toDateInputValue(task.dueDate),
          startTime: minToHHMM(task.startMin),
          endDate: toDateInputValue(task.endDate),
          endTime: minToHHMM(task.endMin),
        }}
        onCancel={() => setOpen(false)}
        onDelete={() => start(async () => { await deleteTask(task.id); router.refresh(); })}
        onSubmit={(v) =>
          start(async () => {
            await updateTask(task.id, {
              title: v.title,
              notes: v.notes,
              projectIds: v.projectIds,
              dueDate: v.startDate || null,
              startMin: hhmmToMin(v.startTime),
              endDate: v.endDate || null,
              endMin: hhmmToMin(v.endTime),
              repeat: v.repeat,
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
          {timeStr && <span className="ml-2 text-xs text-ink-muted">{timeStr}</span>}
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
          <span className={`text-xs ${rightTone} w-24 text-right`}>{rightText}</span>
        </div>
      </div>
    </div>
  );
}
