export type ProjectDTO = {
  id: string;
  name: string;
  color: string;
};

export type TaskDTO = {
  id: string;
  title: string;
  notes: string | null;
  status: "todo" | "doing" | "done";
  priority: "alta" | "media" | "baixa";
  dueDate: string | null; // ISO
  completedAt: string | null;
  order: number;
  project: ProjectDTO | null;
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
