import { db } from "@/db";
import { task, type Task } from "@/db/schema";
import { and, eq, asc } from "drizzle-orm";

export type NewTaskInput = {
  title: string;
  dueAt?: Date | null;
  notes?: string | null;
};

export async function getUserTasks(userId: string): Promise<Task[]> {
  return db
    .select()
    .from(task)
    .where(eq(task.userId, userId))
    .orderBy(asc(task.dueAt));
}

export async function getTask(
  userId: string,
  id: string,
): Promise<Task | undefined> {
  const [row] = await db
    .select()
    .from(task)
    .where(and(eq(task.id, id), eq(task.userId, userId)))
    .limit(1);
  return row;
}

export async function createTask(
  userId: string,
  input: NewTaskInput,
): Promise<Task> {
  const [row] = await db
    .insert(task)
    .values({
      userId,
      title: input.title.trim(),
      dueAt: input.dueAt ?? null,
      notes: input.notes ?? null,
    })
    .returning();
  return row;
}

export async function setTaskStatus(
  userId: string,
  id: string,
  done: boolean,
): Promise<void> {
  await db
    .update(task)
    .set({
      status: done ? "done" : "open",
      completedAt: done ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(and(eq(task.id, id), eq(task.userId, userId)));
}

export async function updateTask(
  userId: string,
  id: string,
  patch: Partial<NewTaskInput>,
): Promise<void> {
  await db
    .update(task)
    .set({
      ...(patch.title !== undefined ? { title: patch.title.trim() } : {}),
      ...(patch.dueAt !== undefined ? { dueAt: patch.dueAt } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(task.id, id), eq(task.userId, userId)));
}

export async function deleteTask(userId: string, id: string): Promise<void> {
  await db.delete(task).where(and(eq(task.id, id), eq(task.userId, userId)));
}
