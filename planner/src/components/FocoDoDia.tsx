"use client";

import { useState } from "react";
import { TaskDTO, minToHHMM } from "@/lib/types";

export default function FocoDoDia({ tasks, dateLabel }: { tasks: TaskDTO[]; dateLabel: string }) {
  const [copied, setCopied] = useState(false);

  function buildText(): string {
    const lines = [`🎯 Foco do dia — ${dateLabel}`, ""];
    if (tasks.length === 0) {
      lines.push("Dia livre por aqui ✨");
    } else {
      tasks.forEach((t, i) => {
        const time = t.startMin !== null ? `${minToHHMM(t.startMin)} ` : "";
        const proj = t.projects.length ? ` (${t.projects.map((p) => p.name).join(", ")})` : "";
        lines.push(`${i + 1}. ${time}${t.title}${proj}`);
      });
    }
    return lines.join("\n");
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(buildText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: seleciona num prompt
      window.prompt("Copie o foco do dia:", buildText());
    }
  }

  return (
    <button onClick={copy} className="btn-ghost text-xs border border-line" title="Copiar para mandar no grupo do time">
      {copied ? "Copiado ✓" : "📋 Copiar foco do dia"}
    </button>
  );
}
