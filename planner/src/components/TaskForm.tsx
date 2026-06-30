"use client";

import { useState } from "react";
import { ProjectDTO, RepeatRule, REPEAT_OPTIONS } from "@/lib/types";
import { colorFor } from "@/lib/colors";

export type TaskFormValues = {
  title: string;
  notes: string;
  projectIds: string[];
  repeat: RepeatRule;
  startDate: string; // yyyy-mm-dd
  startTime: string; // HH:MM ("" = dia todo)
  endDate: string; // yyyy-mm-dd ("" = mesmo dia)
  endTime: string; // HH:MM ("" = sem hora de término)
};

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
    repeat: initial?.repeat ?? "none",
    startDate: initial?.startDate ?? "",
    startTime: initial?.startTime ?? "",
    endDate: initial?.endDate ?? "",
    endTime: initial?.endTime ?? "",
  });

  function set<K extends keyof TaskFormValues>(k: K, val: TaskFormValues[K]) {
    setV((s) => ({ ...s, [k]: val }));
  }
  function toggleProject(id: string) {
    setV((s) => ({
      ...s,
      projectIds: s.projectIds.includes(id) ? s.projectIds.filter((x) => x !== id) : [...s.projectIds, id],
    }));
  }

  return (
    <div className="card p-4 grid gap-3.5">
      <div>
        <label className="field-label">Nome para visualização</label>
        <input autoFocus value={v.title} onChange={(e) => set("title", e.target.value)} placeholder="Como aparece no kanban e no calendário" className="field mt-1" />
      </div>

      <div>
        <label className="field-label">Do que se trata?</label>
        <textarea value={v.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Pontos importantes pra você lembrar" rows={2} className="field mt-1 resize-y" />
      </div>

      <div>
        <label className="field-label">Projeto(s)</label>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {projects.length === 0 && <span className="text-xs text-ink-muted">Crie projetos na aba Projetos.</span>}
          {projects.map((p) => {
            const on = v.projectIds.includes(p.id);
            const c = colorFor(p.color);
            return (
              <button key={p.id} type="button" onClick={() => toggleProject(p.id)} className="chip border transition-colors"
                style={{ backgroundColor: on ? c.soft : "transparent", color: on ? c.hex : "#5B6470", borderColor: on ? c.hex : "#E7E8EB" }}>
                <span className="size-2 rounded-full" style={{ backgroundColor: c.hex }} />
                {p.name}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="field-label">Repetição</label>
        <select value={v.repeat} onChange={(e) => set("repeat", e.target.value as RepeatRule)} className="field mt-1">
          {REPEAT_OPTIONS.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="field-label">Início — data</label>
          <input type="date" value={v.startDate} onChange={(e) => set("startDate", e.target.value)} className="field mt-1" />
        </div>
        <div>
          <label className="field-label">Início — hora</label>
          <input type="time" value={v.startTime} onChange={(e) => set("startTime", e.target.value)} className="field mt-1" />
        </div>
        <div>
          <label className="field-label">Término — data</label>
          <input type="date" value={v.endDate} onChange={(e) => set("endDate", e.target.value)} className="field mt-1" />
        </div>
        <div>
          <label className="field-label">Término — hora</label>
          <input type="time" value={v.endTime} onChange={(e) => set("endTime", e.target.value)} className="field mt-1" />
        </div>
      </div>
      <p className="text-[11px] text-ink-muted -mt-1">
        Sem hora = dia todo. Término em outra data = bloqueia vários dias no calendário (ex.: viagem).
      </p>

      <div className="flex items-center justify-between pt-1">
        {onDelete ? <button onClick={onDelete} className="text-xs text-danger hover:underline">Excluir</button> : <span />}
        <div className="flex gap-2">
          <button onClick={onCancel} className="btn-ghost text-xs">Cancelar</button>
          <button disabled={pending} onClick={() => onSubmit(v)} className="btn-primary text-xs">{submitLabel}</button>
        </div>
      </div>
    </div>
  );
}
