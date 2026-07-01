export type ProjectDTO = {
  id: string;
  name: string;
  color: string;
};

export type RepeatRule = "none" | "daily" | "weekdays" | "weekly" | "monthly";

export type TaskDTO = {
  id: string;
  title: string;
  notes: string | null;
  status: "todo" | "doing" | "done";
  priority: "alta" | "media" | "baixa";
  dueDate: string | null; // início (ISO, dia ancorado ao meio-dia UTC)
  startMin: number | null; // hora de início (min); null = dia todo
  endDate: string | null; // término (ISO, dia); null = mesmo dia que dueDate
  endMin: number | null; // hora de término (min); null = sem hora de término
  repeat: RepeatRule;
  durationMin: number;
  pushCount: number;
  completedAt: string | null;
  createdAt: string;
  order: number;
  projects: ProjectDTO[];
  completions: string[]; // dias concluídos (chaves AAAA-MM-DD) p/ tarefas recorrentes
};

export const REPEAT_OPTIONS: { v: RepeatRule; l: string }[] = [
  { v: "none", l: "Uma vez" },
  { v: "daily", l: "Todos os dias" },
  { v: "weekdays", l: "Dias de semana (seg–sex)" },
  { v: "weekly", l: "Toda semana" },
  { v: "monthly", l: "Todo mês" },
];

export const REPEAT_LABEL: Record<RepeatRule, string> = {
  none: "",
  daily: "Diária",
  weekdays: "Seg–Sex",
  weekly: "Semanal",
  monthly: "Mensal",
};

export const PRIORITY_LABEL: Record<TaskDTO["priority"], string> = {
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};

export const PRIORITY_WEIGHT: Record<TaskDTO["priority"], number> = {
  alta: 0,
  media: 1,
  baixa: 2,
};

export const STATUS_LABEL: Record<TaskDTO["status"], string> = {
  todo: "A fazer",
  doing: "Em andamento",
  done: "Concluído",
};

export const STATUS_ORDER: TaskDTO["status"][] = ["todo", "doing", "done"];

// minutos -> "HH:MM"
export function minToHHMM(min: number | null): string {
  if (min === null || min === undefined) return "";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// "HH:MM" -> minutos
export function hhmmToMin(v: string): number | null {
  if (!v) return null;
  const [h, m] = v.split(":").map((n) => parseInt(n, 10));
  if (Number.isNaN(h)) return null;
  return h * 60 + (m || 0);
}

export function durationLabel(min: number): string {
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h${m}`;
}
