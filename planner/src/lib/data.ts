import { prisma } from "./prisma";
import {
  PRIORITY_WEIGHT,
  ProjectDTO,
  TaskDTO,
} from "./types";
import {
  addDays,
  endOfDay,
  endOfWeek,
  isSameDay,
  startOfDay,
  startOfWeek,
  WEEKDAYS_SHORT,
} from "./date";

type RawTask = Awaited<ReturnType<typeof prisma.task.findMany>>[number] & {
  project: { id: string; name: string; color: string } | null;
};

export function serializeTask(t: RawTask): TaskDTO {
  return {
    id: t.id,
    title: t.title,
    notes: t.notes,
    status: t.status as TaskDTO["status"],
    priority: t.priority as TaskDTO["priority"],
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    completedAt: t.completedAt ? t.completedAt.toISOString() : null,
    order: t.order,
    project: t.project
      ? { id: t.project.id, name: t.project.name, color: t.project.color }
      : null,
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
    include: { project: true },
    orderBy: [{ dueDate: "asc" }, { order: "asc" }, { createdAt: "asc" }],
  });
  return (tasks as RawTask[]).map(serializeTask);
}

// Ordena por prioridade e depois por prazo
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

// Distribui tarefas (não concluídas) em faixas mutuamente exclusivas
export function bucketTasks(tasks: TaskDTO[], now: Date): Buckets {
  const today0 = startOfDay(now);
  const todayEnd = endOfDay(now);
  const in3 = endOfDay(addDays(now, 3));
  const weekEnd = endOfWeek(now);

  const b: Buckets = {
    atrasadas: [],
    hoje: [],
    proximos3: [],
    semana: [],
    depois: [],
    semData: [],
  };

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
  date: string; // ISO
  isToday: boolean;
  due: number; // tarefas com prazo nesse dia
  done: number; // concluídas nesse dia
};

export type Dashboard = {
  todayTasks: TaskDTO[];
  buckets: Buckets;
  week: WeekDay[];
  summary: string;
  stats: {
    overdue: number;
    dueThisWeek: number;
    doneThisWeek: number;
    todayCount: number;
    weekProgress: number; // 0..100
  };
};

export async function getDashboard(now: Date): Promise<Dashboard> {
  const wkStart = startOfWeek(now);
  const wkEnd = endOfWeek(now);

  const tasks = await listTasks({ project: { is: { archived: false } } });
  // tarefas sem projeto também entram (project null não casa o filtro acima)
  const all = await listTasks({});
  const tasksAll = all;

  const buckets = bucketTasks(tasksAll, now);

  // Tarefas do dia por ordem de prioridade (hoje + atrasadas que precisam de atenção)
  const todayTasks = [...buckets.hoje, ...buckets.atrasadas]
    .slice()
    .sort(byPriority);

  // Gráfico da semana (Dom..Sáb)
  const week: WeekDay[] = [];
  for (let i = 0; i < 7; i++) {
    const day = addDays(wkStart, i);
    const due = tasksAll.filter(
      (t) => t.dueDate && isSameDay(new Date(t.dueDate), day)
    ).length;
    const done = tasksAll.filter(
      (t) => t.completedAt && isSameDay(new Date(t.completedAt), day)
    ).length;
    week.push({
      label: WEEKDAYS_SHORT[i],
      date: day.toISOString(),
      isToday: isSameDay(day, now),
      due,
      done,
    });
  }

  const overdue = buckets.atrasadas.length;
  const dueThisWeek = tasksAll.filter(
    (t) =>
      t.status !== "done" &&
      t.dueDate &&
      new Date(t.dueDate) >= wkStart &&
      new Date(t.dueDate) <= wkEnd
  ).length;
  const doneThisWeek = tasksAll.filter(
    (t) =>
      t.completedAt &&
      new Date(t.completedAt) >= wkStart &&
      new Date(t.completedAt) <= wkEnd
  ).length;
  const totalWeek = dueThisWeek + doneThisWeek;
  const weekProgress = totalWeek === 0 ? 0 : Math.round((doneThisWeek / totalWeek) * 100);

  const summary = buildSummary({
    overdue,
    dueThisWeek,
    doneThisWeek,
    todayCount: buckets.hoje.length,
    weekProgress,
  });

  void tasks; // (mantido para clareza; usamos tasksAll)

  return {
    todayTasks,
    buckets,
    week,
    summary,
    stats: { overdue, dueThisWeek, doneThisWeek, todayCount: buckets.hoje.length, weekProgress },
  };
}

function buildSummary(s: {
  overdue: number;
  dueThisWeek: number;
  doneThisWeek: number;
  todayCount: number;
  weekProgress: number;
}): string {
  const parts: string[] = [];

  if (s.overdue === 0 && s.dueThisWeek === 0 && s.doneThisWeek === 0) {
    return "Sua semana está em branco por aqui. Que tal cadastrar as primeiras tarefas e definir os prazos? Eu te ajudo a manter o ritmo a partir daí.";
  }

  // Tom geral
  if (s.overdue === 0) {
    parts.push("Você está em dia — nada atrasado.");
  } else if (s.overdue <= 2) {
    parts.push(`Quase tudo sob controle: só ${s.overdue} ${s.overdue === 1 ? "tarefa atrasada" : "tarefas atrasadas"} pedindo atenção.`);
  } else {
    parts.push(`Atenção: ${s.overdue} tarefas estão atrasadas. Vale começar por elas hoje.`);
  }

  // Carga da semana
  if (s.dueThisWeek === 0) {
    parts.push("Não há prazos pendentes para o restante da semana — uma semana mais tranquila.");
  } else if (s.dueThisWeek <= 4) {
    parts.push(`Para esta semana, ${s.dueThisWeek} ${s.dueThisWeek === 1 ? "tarefa" : "tarefas"} com prazo — uma carga leve.`);
  } else {
    parts.push(`A semana é cheia: ${s.dueThisWeek} tarefas com prazo. Foque nas de prioridade alta primeiro.`);
  }

  // Progresso
  if (s.doneThisWeek > 0) {
    parts.push(`Você já concluiu ${s.doneThisWeek} ${s.doneThisWeek === 1 ? "tarefa" : "tarefas"} esta semana (${s.weekProgress}% do previsto).`);
  }

  // Hoje
  if (s.todayCount > 0) {
    parts.push(`Hoje há ${s.todayCount} ${s.todayCount === 1 ? "tarefa marcada" : "tarefas marcadas"}.`);
  }

  return parts.join(" ");
}
