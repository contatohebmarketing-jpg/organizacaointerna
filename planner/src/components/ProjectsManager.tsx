"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ProjectDTO } from "@/lib/types";
import { PROJECT_COLORS, colorFor } from "@/lib/colors";
import { createProject } from "@/app/actions";

export default function ProjectsManager({
  projects,
}: {
  projects: (ProjectDTO & { open: number; total: number })[];
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("blue");
  const [pending, start] = useTransition();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {projects.map((p) => {
        const c = colorFor(p.color);
        const pct = p.total ? ((p.total - p.open) / p.total) * 100 : 0;
        return (
          <Link key={p.id} href={`/projetos/${p.id}`} className="card p-4 hover:shadow-pop transition-shadow">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="size-3.5 rounded-full" style={{ backgroundColor: c.hex }} />
              <h3 className="text-[15px] font-medium text-ink truncate">{p.name}</h3>
            </div>
            <div className="flex items-center gap-3 text-xs text-ink-muted">
              <span>{p.open} aberta{p.open === 1 ? "" : "s"}</span>
              <span>·</span>
              <span>{p.total} no total</span>
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-line2 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: c.hex }} />
            </div>
          </Link>
        );
      })}

      {!adding ? (
        <button
          onClick={() => setAdding(true)}
          className="rounded-xl border border-dashed border-line text-ink-muted hover:text-accent hover:border-accent p-4 min-h-[110px] flex items-center justify-center text-sm"
        >
          + Novo projeto
        </button>
      ) : (
        <div className="card p-4">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do projeto"
            className="field mb-3"
          />
          <div className="flex flex-wrap gap-1.5 mb-3">
            {PROJECT_COLORS.map((c) => (
              <button
                key={c.key}
                onClick={() => setColor(c.key)}
                title={c.label}
                className={`size-6 rounded-full transition-transform ${color === c.key ? "ring-2 ring-offset-2 ring-ink scale-110" : ""}`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setAdding(false)} className="btn-ghost text-xs">Cancelar</button>
            <button
              disabled={pending}
              onClick={() =>
                start(async () => {
                  await createProject({ name, color });
                  setName("");
                  setColor("blue");
                  setAdding(false);
                })
              }
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
