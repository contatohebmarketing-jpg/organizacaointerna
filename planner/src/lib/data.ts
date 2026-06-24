import { prisma } from "./prisma";
import { PRIORITY_WEIGHT, ProjectDTO, TaskDTO, durationLabel } from "./types";
import {
  addDays,
  endOfDay,
  endOfWeek,
  isSameDay,
  startOfDay,
  startOfWeek,
  WEEKDAYS_SHORT,
} from "./date";

type RawTask = {
  id: string;
  title: string;
  notes: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  startMin: number | null;
  durationMin: number;
  pushCount: number;
  order: number;
  completedAt: Date | null;
  createdAt: Date;
  projects: { id: string; name: string; color: string }[];
};

// Normaliza um prazo para "meio-dia UTC" do seu dia de calendário, de modo que
// a extração do dia (local ou UTC) caia sempre no mesmo dia em qualquer fuso.
function pad(n: number): string {
  return String(n).padStart(2, "0");
}
function dayNoonISO(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T12:00:00.000Z`;
}

export function serializeTask(t: RawTask): TaskDTO {
  return {
    id: t.id,
    title: t.title,
    notes: t.notes,
    status: t.status as TaskDTO["status"],
    priority: t.priority as TaskDTO["priority"],
    dueDate: t.dueDate ? dayNoonISO(t.dueDate) : null,
    startMin: t.startMin,
    durationMin: t.durationMin,
    pushCount: t.pushCount,
    completedAt: t.completedAt ? t.completedAt.toISOString() : null,
    createdAt: t.createdAt.toISOString(),
    order: t.order,
    projects: t.projects.map((p) => ({ id: p.id, name: p.name, color: p.color })),
  };
}

export async function listProjects(): Promise<ProjectDTO[]> {
  const projects = await prisma.project.findMany({
    where: { archived: false },
    orderBy: { createdAt: "asc" },
  });
  return projects.map((p) => ({ id: p.id, name: p.name, color: p.color }));
}

export async function listTasks(where: object = {}): Promise<TaskDTO[]> {
  const tasks = await prisma.task.findMany({
    where,
    include: { projects: true },
    orderBy: [{ dueDate: "asc" }, { order: "asc" }, { createdAt: "asc" }],
  });
  return (tasks as unknown as RawTask[]).map(serializeTask);
}

export function byPriority(a: TaskDTO, b: TaskDTO): number {
  const p = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
  if (p !== 0) return p;
  if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
  if (a.dueDate) return -1;
  if (b.dueDate) return 1;
  return 0;
}

export type Buckets = {
  atrasadas: TaskDTO[];
  hoje: TaskDTO[];
  proximos3: TaskDTO[];
  semana: TaskDTO[];
  depois: TaskDTO[];
  semData: TaskDTO[];
};

export function bucketTasks(tasks: TaskDTO[], now: Date): Buckets {
  const today0 = startOfDay(now);
  const todayEnd = endOfDay(now);
  const in3 = endOfDay(addDays(now, 3));
  const weekEnd = endOfWeek(now);

  const b: Buckets = { atrasadas: [], hoje: [], proximos3: [], semana: [], depois: [], semData: [] };

  for (const t of tasks) {
    if (t.status === "done") continue;
    if (!t.dueDate) {
      b.semData.push(t);
      continue;
    }
    const d = new Date(t.dueDate);
    if (d < today0) b.atrasadas.push(t);
    else if (d <= todayEnd) b.hoje.push(t);
    else if (d <= in3) b.proximos3.push(t);
    else if (d <= weekEnd) b.semana.push(t);
    else b.depois.push(t);
  }

  (Object.keys(b) as (keyof Buckets)[]).forEach((k) => b[k].sort(byPriority));
  return b;
}

export type WeekDay = {
  label: string;
  date: string;
  isToday: boolean;
  due: number;
  done: number;
};

export type Dashboard = {
  todayTasks: TaskDTO[];
  buckets: Buckets;
  week: WeekDay[];
  headline: string;
  suggestions: string[];
  stats: {
    overdue: number;
    dueThisWeek: number;
    doneThisWeek: number;
    todayCount: number;
    weekProgress: number;
  };
};

export async function getDashboard(now: Date): Promise<Dashboard> {
  const wkStart = startOfWeek(now);
  const wkEnd = endOfWeek(now);
  const all = await listTasks({});
  const buckets = bucketTasks(all, now);

  const todayTasks = [...buckets.hoje, ...buckets.atrasadas].slice().sort(byPriority);

  const week: WeekDay[] = [];
  for (let i = 0; i < 7; i++) {
    const day = addDays(wkStart, i);
    week.push({
      label: WEEKDAYS_SHORT[i],
      date: day.toISOString(),
      isToday: isSameDay(day, now),
      due: all.filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), day)).length,
      done: all.filter((t) => t.completedAt && isSameDay(new Date(t.completedAt), day)).length,
    });
  }

  const overdue = buckets.atrasadas.length;
  const dueThisWeek = all.filter(
    (t) => t.status !== "done" && t.dueDate && new Date(t.dueDate) >= wkStart && new Date(t.dueDate) <= wkEnd
  ).length;
  const doneThisWeek = all.filter(
    (t) => t.completedAt && new Date(t.completedAt) >= wkStart && new Date(t.completedAt) <= wkEnd
  ).length;
  const totalWeek = dueThisWeek + doneThisWeek;
  const weekProgress = totalWeek === 0 ? 0 : Math.round((doneThisWeek / totalWeek) * 100);

  const { headline, suggestions } = buildInsights(all, now);

  return {
    todayTasks,
    buckets,
    week,
    headline,
    suggestions,
    stats: { overdue, dueThisWeek, doneThisWeek, todayCount: buckets.hoje.length, weekProgress },
  };
}

// Analisa o histórico e gera sugestões de produtividade para a próxima semana.
function buildInsights(all: TaskDTO[], now: Date): { headline: string; suggestions: string[] } {
  const today0 = startOfDay(now);
  const nextWkStart = startOfWeek(addDays(now, 7));
  const nextWkEnd = endOfWeek(addDays(now, 7));

  const open = all.filter((t) => t.status !== "done");
  const overdue = open.filter((t) => t.dueDate && new Date(t.dueDate) < today0);

  const completed = all.filter((t) => t.completedAt);
  const completedLate = completed.filter(
    (t) => t.dueDate && new Date(t.completedAt!) > endOfDay(new Date(t.dueDate))
  );
  const completedFast = completed.filter((t) => {
    const ms = new Date(t.completedAt!).getTime() - new Date(t.createdAt).getTime();
    return ms <= 24 * 3600 * 1000;
  });

  // Tarefas que vivem sendo empurradas de um dia pro outro
  const pushed = open
    .filter((t) => t.pushCount >= 2)
    .sort((a, b) => b.pushCount - a.pushCount);

  // Carga (por duração) de cada dia da próxima semana
  const dayLoad: Record<string, number> = {};
  for (const t of open) {
    if (!t.dueDate) continue;
    const d = new Date(t.dueDate);
    if (d >= nextWkStart && d <= nextWkEnd) {
      const key = startOfDay(d).toISOString();
      dayLoad[key] = (dayLoad[key] || 0) + t.durationMin;
    }
  }
  const heaviest = Object.entries(dayLoad).sort((a, b) => b[1] - a[1])[0];

  const suggestions: string[] = [];

  if (pushed.length > 0) {
    const top = pushed[0];
    suggestions.push(
      `"${top.title}" já foi adiada ${top.pushCount}x. Reserve um horário fixo no início do dia pra ela — tarefas empurradas raramente somem sozinhas.`
    );
  }
  if (completedLate.length >= 2) {
    suggestions.push(
      `${completedLate.length} tarefas foram concluídas depois do prazo. Tente colocar prazos com 1 dia de folga, ou quebrar as grandes em partes menores.`
    );
  }
  if (overdue.length >= 3) {
    suggestions.push(
      `Você tem ${overdue.length} tarefas atrasadas acumuladas. Comece a próxima semana com um "dia de limpeza" pra zerar o passado antes de pegar o novo.`
    );
  }
  if (heaviest && heaviest[1] >= 6 * 60) {
    const dia = new Date(heaviest[0]).toLocaleDateString("pt-BR", { weekday: "long" });
    suggestions.push(
      `${dia.charAt(0).toUpperCase() + dia.slice(1)} da próxima semana já tem ${durationLabel(heaviest[1])} de compromissos — está lotado. Evite marcar coisas novas nesse dia.`
    );
  }
  if (completedFast.length >= 3) {
    suggestions.push(
      `Você fecha tarefas rápidas com facilidade (${completedFast.length} no histórico). Agrupe as pequenas num único bloco do dia pra liberar tempo pras profundas.`
    );
  }
  if (suggestions.length === 0) {
    suggestions.push(
      "Conforme você for usando o planner, eu aprendo seus padrões (o que atrasa, o que empaca, dias cheios) e trago sugestões personalizadas aqui."
    );
  }

  // Headline curta de status
  let headline: string;
  if (overdue.length === 0) headline = "Você está em dia — sem nada atrasado. Bom momento pra planejar a frente.";
  else if (overdue.length <= 2) headline = `Quase tudo sob controle: ${overdue.length} ${overdue.length === 1 ? "tarefa atrasada" : "tarefas atrasadas"}.`;
  else headline = `Atenção: ${overdue.length} tarefas atrasadas. Vale priorizar elas hoje.`;

  return { headline, suggestions: suggestions.slice(0, 4) };
}
