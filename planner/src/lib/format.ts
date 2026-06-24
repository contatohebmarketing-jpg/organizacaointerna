import { isSameDay, addDays, MONTHS_PT } from "./date";

// Rótulo amigável de prazo
export function dueLabel(iso: string | null): { text: string; tone: "late" | "today" | "soon" | "normal" | "none" } {
  if (!iso) return { text: "sem data", tone: "none" };
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const day = new Date(d); day.setHours(0, 0, 0, 0);
  const diff = Math.round((day.getTime() - today.getTime()) / 86400000);

  if (diff < 0) return { text: diff === -1 ? "ontem" : `${Math.abs(diff)} dias atrás`, tone: "late" };
  if (isSameDay(d, now)) return { text: "hoje", tone: "today" };
  if (isSameDay(d, addDays(now, 1))) return { text: "amanhã", tone: "soon" };
  if (diff <= 6) return { text: `em ${diff} dias`, tone: "soon" };
  return { text: `${d.getDate()} ${MONTHS_PT[d.getMonth()].slice(0, 3).toLowerCase()}`, tone: "normal" };
}

export function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
