import { db } from "@/db";
import { task, type Task } from "@/db/schema";
import { and, eq, asc } from "drizzle-orm";

export type NewTaskInput = {
  title: string;
  dueAt?: Date | null;
  notes?: string | null;
  nagIntervalSec?: number;
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
  const dueAt = input.dueAt ?? null;
  const [row] = await db
    .insert(task)
    .values({
      userId,
      title: input.title.trim(),
      dueAt,
      notes: input.notes ?? null,
      ...(input.nagIntervalSec ? { nagIntervalSec: input.nagIntervalSec } : {}),
      // First nag fires at the due time; no due date = never nagged.
      nextNagAt: dueAt,
    })
    .returning();
  return row;
}

export async function setTaskStatus(
  userId: string,
  id: string,
  done: boolean,
): Promise<void> {
  if (done) {
    await db
      .update(task)
      .set({
        status: "done",
        completedAt: new Date(),
        nextNagAt: null, // stop nagging
        updatedAt: new Date(),
      })
      .where(and(eq(task.id, id), eq(task.userId, userId)));
    return;
  }

  // Reopen: resume nagging from the due time (the nag pass handles overdue).
  const existing = await getTask(userId, id);
  await db
    .update(task)
    .set({
      status: "open",
      completedAt: null,
      nextNagAt: existing?.dueAt ?? null,
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
      ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
      ...(patch.nagIntervalSec !== undefined
        ? { nagIntervalSec: patch.nagIntervalSec }
        : {}),
      // Changing the due date reschedules the next nag to it.
      ...(patch.dueAt !== undefined
        ? { dueAt: patch.dueAt, nextNagAt: patch.dueAt }
        : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(task.id, id), eq(task.userId, userId)));
}

/** Push the next nag forward by `seconds` (task stays open). */
export async function snoozeTask(
  userId: string,
  id: string,
  seconds: number,
): Promise<void> {
  await db
    .update(task)
    .set({
      nextNagAt: new Date(Date.now() + seconds * 1000),
      updatedAt: new Date(),
    })
    .where(and(eq(task.id, id), eq(task.userId, userId)));
}

export async function deleteTask(userId: string, id: string): Promise<void> {
  await db.delete(task).where(and(eq(task.id, id), eq(task.userId, userId)));
}
