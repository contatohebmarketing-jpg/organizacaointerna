"use client";

import { useState, useTransition } from "react";
import { ProjectDTO, hhmmToMin } from "@/lib/types";
import { createTask } from "@/app/actions";
import TaskForm from "./TaskForm";

export default function AddTask({
  projects,
  defaultProjectId,
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

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={compact ? "w-full text-left text-sm text-ink-muted hover:text-accent px-2 py-1.5" : "btn-primary"}
      >
        + {label}
      </button>
    );
  }

  return (
    <TaskForm
      projects={projects}
      submitLabel="Adicionar"
      pending={pending}
      initial={{ projectIds: defaultProjectId ? [defaultProjectId] : [] }}
      onCancel={() => setOpen(false)}
      onSubmit={(v) =>
        start(async () => {
          await createTask({
            title: v.title,
            notes: v.notes,
            projectIds: v.projectIds,
            dueDate: v.startDate || null,
            startMin: hhmmToMin(v.startTime),
            endDate: v.endDate || null,
            endMin: hhmmToMin(v.endTime),
            repeat: v.repeat,
            status: defaultStatus,
          });
          setOpen(false);
        })
      }
    />
  );
}
