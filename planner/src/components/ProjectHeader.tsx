"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ProjectDTO } from "@/lib/types";
import { PROJECT_COLORS, colorFor } from "@/lib/colors";
import { updateProject, deleteProject } from "@/app/actions";

export default function ProjectHeader({ project }: { project: ProjectDTO }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(project.name);
  const [color, setColor] = useState(project.color);
  const [pending, start] = useTransition();
  const c = colorFor(color);

  if (!editing) {
    return (
      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <span className="size-4 rounded-full" style={{ backgroundColor: c.hex }} />
            <h1 className="display text-4xl text-ink">{project.name}</h1>
          </div>
          <button onClick={() => setEditing(true)} className="text-xs text-teal hover:underline mt-1 ml-7">
            editar projeto
          </button>
        </div>
        <a href="/projetos" className="btn-ghost text-sm">← projetos</a>
      </header>
    );
  }

  return (
    <header className="card p-4">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-lg border border-line bg-white px-3 py-2 text-lg mb-3"
      />
      <div className="flex flex-wrap gap-1.5 mb-3">
        {PROJECT_COLORS.map((pc) => (
          <button
            key={pc.key}
            onClick={() => setColor(pc.key)}
            title={pc.label}
            className={`size-6 rounded-full ${color === pc.key ? "ring-2 ring-offset-2 ring-ink scale-110" : ""}`}
            style={{ backgroundColor: pc.hex }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <button
          onClick={() => start(async () => { await deleteProject(project.id); router.push("/projetos"); })}
          className="text-xs text-[#B14A33] hover:underline"
        >
          Excluir projeto
        </button>
        <div className="flex gap-2">
          <button onClick={() => setEditing(false)} className="btn-ghost text-xs">Cancelar</button>
          <button
            disabled={pending}
            onClick={() => start(async () => { await updateProject(project.id, { name, color }); setEditing(false); })}
            className="btn-primary text-xs"
          >
            Salvar
          </button>
        </div>
      </div>
    </header>
  );
}
