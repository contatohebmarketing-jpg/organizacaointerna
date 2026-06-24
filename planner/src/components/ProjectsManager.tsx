"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ProjectDTO } from "@/lib/types";
import { PROJECT_COLORS, colorFor } from "@/lib/colors";
import { createProject, updateProject, deleteProject } from "@/app/actions";

type ProjectCard = ProjectDTO & { open: number; total: number };

export default function ProjectsManager({ projects }: { projects: ProjectCard[] }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("blue");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {projects.map((p) =>
        editingId === p.id ? (
          <ProjectEditor
            key={p.id}
            project={p}
            pending={pending}
            onClose={() => setEditingId(null)}
            onSave={(n, c) => start(async () => { await updateProject(p.id, { name: n, color: c }); setEditingId(null); })}
            onDelete={() => start(async () => { await deleteProject(p.id); setEditingId(null); })}
          />
        ) : (
          <ProjectCardView key={p.id} project={p} onEdit={() => setEditingId(p.id)} />
        )
      )}

      {!adding ? (
        <button
          onClick={() => setAdding(true)}
          className="rounded-xl border border-dashed border-line text-ink-muted hover:text-accent hover:border-accent p-4 min-h-[120px] flex items-center justify-center text-sm"
        >
          + Novo projeto
        </button>
      ) : (
        <div className="card p-4">
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do projeto" className="field mb-3" />
          <ColorPicker value={color} onChange={setColor} />
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={() => setAdding(false)} className="btn-ghost text-xs">Cancelar</button>
            <button
              disabled={pending}
              onClick={() => start(async () => { await createProject({ name, color }); setName(""); setColor("blue"); setAdding(false); })}
              className="btn-primary text-xs"
            >
              Criar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectCardView({ project: p, onEdit }: { project: ProjectCard; onEdit: () => void }) {
  const router = useRouter();
  const c = colorFor(p.color);
  const pct = p.total ? ((p.total - p.open) / p.total) * 100 : 0;
  return (
    <div className="card p-4 relative group cursor-pointer hover:shadow-pop transition-shadow" onClick={() => router.push(`/projetos/${p.id}`)}>
      <button
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
        title="Editar projeto"
        className="absolute top-3 right-3 text-ink-muted hover:text-accent opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      <div className="flex items-center gap-2.5 mb-3 pr-6">
        <span className="size-3.5 rounded-full shrink-0" style={{ backgroundColor: c.hex }} />
        <h3 className="text-[15px] font-medium text-ink truncate">{p.name}</h3>
      </div>
      <div className="flex items-center gap-3 text-xs text-ink-muted">
        <span>{p.open} aberta{p.open === 1 ? "" : "s"}</span><span>·</span><span>{p.total} no total</span>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-line2 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: c.hex }} />
      </div>
    </div>
  );
}

function ProjectEditor({
  project: p, pending, onClose, onSave, onDelete,
}: {
  project: ProjectCard; pending: boolean; onClose: () => void;
  onSave: (name: string, color: string) => void; onDelete: () => void;
}) {
  const [name, setName] = useState(p.name);
  const [color, setColor] = useState(p.color);
  return (
    <div className="card p-4">
      <input autoFocus value={name} onChange={(e) => setName(e.target.value)} className="field mb-3" />
      <ColorPicker value={color} onChange={setColor} />
      <div className="flex items-center justify-between mt-3">
        <button onClick={onDelete} className="text-xs text-danger hover:underline">Excluir</button>
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-ghost text-xs">Cancelar</button>
          <button disabled={pending} onClick={() => onSave(name, color)} className="btn-primary text-xs">Salvar</button>
        </div>
      </div>
    </div>
  );
}

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {PROJECT_COLORS.map((c) => (
        <button
          key={c.key}
          onClick={() => onChange(c.key)}
          title={c.label}
          className={`size-6 rounded-full transition-transform ${value === c.key ? "ring-2 ring-offset-2 ring-ink scale-110" : ""}`}
          style={{ backgroundColor: c.hex }}
        />
      ))}
    </div>
  );
}
