"use client";

import { useState } from "react";
import { ProjectDTO } from "@/lib/types";
import { colorFor } from "@/lib/colors";

export type TaskFormValues = {
  title: string;
  notes: string;
  projectIds: string[];
  dueDate: string; // yyyy-mm-dd
  startTime: string; // HH:MM ("" = sem horário)
  durationMin: number;
};

const DURATIONS = [
  { v: 15, l: "15 min" },
  { v: 30, l: "30 min" },
  { v: 45, l: "45 min" },
  { v: 60, l: "1 h" },
  { v: 90, l: "1h30" },
  { v: 120, l: "2 h" },
  { v: 180, l: "3 h" },
  { v: 240, l: "4 h" },
];

export default function TaskForm({
  projects,
  initial,
  submitLabel,
  pending,
  onSubmit,
  onCancel,
  onDelete,
}: {
  projects: ProjectDTO[];
  initial?: Partial<TaskFormValues>;
  submitLabel: string;
  pending?: boolean;
  onSubmit: (v: TaskFormValues) => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const [v, setV] = useState<TaskFormValues>({
    title: initial?.title ?? "",
    notes: initial?.notes ?? "",
    projectIds: initial?.projectIds ?? [],
    dueDate: initial?.dueDate ?? "",
    startTime: initial?.startTime ?? "",
    durationMin: initial?.durationMin ?? 60,
  });

  function toggleProject(id: string) {
    setV((s) => ({
      ...s,
      projectIds: s.projectIds.includes(id)
        ? s.projectIds.filter((x) => x !== id)
        : [...s.projectIds, id],
    }));
  }

  return (
    <div className="card p-4 grid gap-3.5">
      <div>
        <label className="field-label">Nome para visualização</label>
        <input
          autoFocus
          value={v.title}
          onChange={(e) => setV({ ...v, title: e.target.value })}
          placeholder="Como aparece no kanban e no calendário"
          className="field mt-1"
        />
      </div>

      <div>
        <label className="field-label">Do que se trata?</label>
        <textarea
          value={v.notes}
          onChange={(e) => setV({ ...v, notes: e.target.value })}
          placeholder="Pontos importantes pra você lembrar"
          rows={2}
          className="field mt-1 resize-y"
        />
      </div>

      <div>
        <label className="field-label">Projeto(s)</label>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {projects.length === 0 && (
            <span className="text-xs text-ink-muted">Crie projetos na aba Projetos.</span>
          )}
          {projects.map((p) => {
            const on = v.projectIds.includes(p.id);
            const c = colorFor(p.color);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggleProject(p.id)}
                className="chip border transition-colors"
                style={{
                  backgroundColor: on ? c.soft : "transparent",
                  color: on ? c.hex : "var(--ink-soft, #5B6470)",
                  borderColor: on ? c.hex : "#E7E8EB",
                }}
              >
                <span className="size-2 rounded-full" style={{ backgroundColor: c.hex }} />
                {p.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div>
          <label className="field-label">Data</label>
          <input type="date" value={v.dueDate} onChange={(e) => setV({ ...v, dueDate: e.target.value })} className="field mt-1" />
        </div>
        <div>
          <label className="field-label">Hora de início</label>
          <input type="time" value={v.startTime} onChange={(e) => setV({ ...v, startTime: e.target.value })} className="field mt-1" />
        </div>
        <div>
          <label className="field-label">Duração média</label>
          <select value={v.durationMin} onChange={(e) => setV({ ...v, durationMin: Number(e.target.value) })} className="field mt-1">
            {DURATIONS.map((d) => <option key={d.v} value={d.v}>{d.l}</option>)}
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        {onDelete ? (
          <button onClick={onDelete} className="text-xs text-danger hover:underline">Excluir</button>
        ) : <span />}
        <div className="flex gap-2">
          <button onClick={onCancel} className="btn-ghost text-xs">Cancelar</button>
          <button disabled={pending} onClick={() => onSubmit(v)} className="btn-primary text-xs">{submitLabel}</button>
        </div>
      </div>
    </div>
  );
}
