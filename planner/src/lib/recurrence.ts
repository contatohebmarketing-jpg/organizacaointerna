import { startOfDay, addDays, isSameDay, dayKey } from "./date";
import { TaskDTO, RepeatRule } from "./types";

// Uma tarefa recorrente está concluída num dia se houver registro daquele dia.
export function isOccurrenceDone(task: TaskDTO, date: Date): boolean {
  if (task.repeat === "none") return task.status === "done";
  return task.completions.includes(dayKey(date));
}

export type Occurrence = {
  date: Date; // dia da ocorrência
  startMin: number | null;
  endMin: number | null;
  multiDay: boolean;
  isFirst: boolean;
  isLast: boolean;
};

function dayOf(iso: string): Date {
  return startOfDay(new Date(iso));
}

export function matchesRule(repeat: RepeatRule, day: Date, startDay: Date): boolean {
  if (day < startDay && !isSameDay(day, startDay)) return false;
  switch (repeat) {
    case "daily":
      return true;
    case "weekdays": {
      const w = day.getDay();
      return w >= 1 && w <= 5;
    }
    case "weekly":
      return day.getDay() === startDay.getDay();
    case "monthly":
      return day.getDate() === startDay.getDate();
    default:
      return false;
  }
}

export function isMultiDay(task: TaskDTO): boolean {
  if (!task.dueDate || !task.endDate) return false;
  const s = dayOf(task.dueDate);
  const e = dayOf(task.endDate);
  return e > s && !isSameDay(e, s);
}

// Expande uma tarefa em ocorrências dentro de [rangeStart, rangeEnd] (inclusive).
export function occurrencesInRange(task: TaskDTO, rangeStart: Date, rangeEnd: Date): Occurrence[] {
  if (!task.dueDate) return [];
  const start = dayOf(task.dueDate);
  const rs = startOfDay(rangeStart);
  const re = startOfDay(rangeEnd);
  const out: Occurrence[] = [];

  if (task.repeat === "none") {
    if (isMultiDay(task)) {
      const end = dayOf(task.endDate as string);
      let d = start;
      let guard = 0;
      while (d <= end && guard++ < 800) {
        if (d >= rs && d <= re)
          out.push({ date: d, startMin: null, endMin: null, multiDay: true, isFirst: isSameDay(d, start), isLast: isSameDay(d, end) });
        d = addDays(d, 1);
      }
    } else if (start >= rs && start <= re) {
      out.push({ date: start, startMin: task.startMin, endMin: task.endMin, multiDay: false, isFirst: true, isLast: true });
    }
  } else {
    let d = rs > start ? rs : start;
    let guard = 0;
    while (d <= re && guard++ < 800) {
      if (matchesRule(task.repeat, d, start))
        out.push({ date: d, startMin: task.startMin, endMin: task.endMin, multiDay: false, isFirst: true, isLast: true });
      d = addDays(d, 1);
    }
  }
  return out;
}

// Data "efetiva" para posicionar a tarefa nas seções da lista.
export function effectiveDateFor(task: TaskDTO, now: Date): Date | null {
  if (!task.dueDate) return null;
  const start = dayOf(task.dueDate);
  const today = startOfDay(now);

  if (task.repeat === "none") {
    if (isMultiDay(task)) {
      const end = dayOf(task.endDate as string);
      if (today >= start && today <= end) return today; // em andamento
      return start;
    }
    return start;
  }

  // recorrente: próxima ocorrência a partir de hoje
  let d = today > start ? today : start;
  for (let i = 0; i < 400; i++) {
    if (matchesRule(task.repeat, d, start)) return d;
    d = addDays(d, 1);
  }
  return start;
}
