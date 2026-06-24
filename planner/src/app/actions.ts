"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/tarefas");
  revalidatePath("/projetos");
  revalidatePath("/calendario");
}

export async function createTask(input: {
  title: string;
  projectId?: string | null;
  priority?: string;
  dueDate?: string | null;
  status?: string;
}) {
  const title = input.title?.trim();
  if (!title) return;
  await prisma.task.create({
    data: {
      title,
      projectId: input.projectId || null,
      priority: input.priority || "media",
      status: input.status || "todo",
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
    },
  });
  revalidateAll();
}

export async function toggleTask(id: string, done: boolean) {
  await prisma.task.update({
    where: { id },
    data: {
      status: done ? "done" : "todo",
      completedAt: done ? new Date() : null,
    },
  });
  revalidateAll();
}

export async function setTaskStatus(id: string, status: string) {
  await prisma.task.update({
    where: { id },
    data: {
      status,
      completedAt: status === "done" ? new Date() : null,
    },
  });
  revalidateAll();
}

export async function updateTask(
  id: string,
  data: {
    title?: string;
    notes?: string | null;
    priority?: string;
    dueDate?: string | null;
    projectId?: string | null;
  }
) {
  await prisma.task.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
      ...(data.priority !== undefined ? { priority: data.priority } : {}),
      ...(data.projectId !== undefined ? { projectId: data.projectId || null } : {}),
      ...(data.dueDate !== undefined
        ? { dueDate: data.dueDate ? new Date(data.dueDate) : null }
        : {}),
    },
  });
  revalidateAll();
}

export async function deleteTask(id: string) {
  await prisma.task.delete({ where: { id } });
  revalidateAll();
}

export async function createProject(input: { name: string; color: string }) {
  const name = input.name?.trim();
  if (!name) return;
  await prisma.project.create({ data: { name, color: input.color || "teal" } });
  revalidateAll();
}

export async function updateProject(
  id: string,
  data: { name?: string; color?: string }
) {
  await prisma.project.update({ where: { id }, data });
  revalidateAll();
}

export async function deleteProject(id: string) {
  await prisma.project.delete({ where: { id } });
  revalidateAll();
}
