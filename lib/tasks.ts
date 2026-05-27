import { db } from "@/db";
import { task, type Task } from "@/db/schema";
import { and, eq, asc, sql } from "drizzle-orm";

export type Recurrence = "none" | "daily" | "weekly" | "monthly";

export type NewTaskInput = {
  title: string;
  dueAt?: Date | null;
  notes?: string | null;
  nagIntervalSec?: number;
  isPublic?: boolean;
  graceSec?: number;
  publicAlias?: string | null;
  escalate?: boolean;
  recurrence?: Recurrence;
};

function addInterval(d: Date, recurrence: Recurrence): Date {
  const x = new Date(d);
  if (recurrence === "daily") x.setDate(x.getDate() + 1);
  else if (recurrence === "weekly") x.setDate(x.getDate() + 7);
  else if (recurrence === "monthly") x.setMonth(x.getMonth() + 1);
  return x;
}

/** Next occurrence strictly after `now` (skips past ones if completed late). */
function nextFutureOccurrence(from: Date, recurrence: Recurrence, now: Date): Date {
  let next = addInterval(from, recurrence);
  let guard = 0;
  while (next <= now && guard++ < 1000) next = addInterval(next, recurrence);
  return next;
}

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
      ...(input.isPublic !== undefined ? { isPublic: input.isPublic } : {}),
      ...(input.graceSec !== undefined ? { graceSec: input.graceSec } : {}),
      ...(input.publicAlias !== undefined
        ? { publicAlias: input.publicAlias }
        : {}),
      ...(input.escalate !== undefined ? { escalate: input.escalate } : {}),
      ...(input.recurrence !== undefined ? { recurrence: input.recurrence } : {}),
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
    const existing = await getTask(userId, id);
    await db
      .update(task)
      .set({
        status: "done",
        completedAt: new Date(),
        nextNagAt: null, // stop nagging
        updatedAt: new Date(),
      })
      .where(and(eq(task.id, id), eq(task.userId, userId)));

    // Recurring: spawn the next occurrence as a fresh open task.
    if (existing && existing.recurrence !== "none" && existing.dueAt) {
      const next = nextFutureOccurrence(
        existing.dueAt,
        existing.recurrence,
        new Date(),
      );
      await db.insert(task).values({
        userId,
        title: existing.title,
        notes: existing.notes,
        dueAt: next,
        nextNagAt: next,
        nagIntervalSec: existing.nagIntervalSec,
        escalate: existing.escalate,
        recurrence: existing.recurrence,
        isPublic: existing.isPublic,
        graceSec: existing.graceSec,
        publicAlias: existing.publicAlias,
      });
    }
    return;
  }

  // Reopen: resume nagging from the due time.
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

/** Skip the current occurrence of a recurring task — roll it to the next one. */
export async function skipTask(userId: string, id: string): Promise<boolean> {
  const t = await getTask(userId, id);
  if (!t || t.recurrence === "none" || !t.dueAt) return false;
  const next = nextFutureOccurrence(t.dueAt, t.recurrence, new Date());
  await db
    .update(task)
    .set({ dueAt: next, nextNagAt: next, snoozeCount: 0, updatedAt: new Date() })
    .where(and(eq(task.id, id), eq(task.userId, userId)));
  return true;
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
      ...(patch.isPublic !== undefined ? { isPublic: patch.isPublic } : {}),
      ...(patch.graceSec !== undefined ? { graceSec: patch.graceSec } : {}),
      ...(patch.publicAlias !== undefined
        ? { publicAlias: patch.publicAlias }
        : {}),
      ...(patch.escalate !== undefined ? { escalate: patch.escalate } : {}),
      ...(patch.recurrence !== undefined
        ? { recurrence: patch.recurrence }
        : {}),
      // Changing the due date reschedules the next nag to it.
      ...(patch.dueAt !== undefined
        ? { dueAt: patch.dueAt, nextNagAt: patch.dueAt }
        : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(task.id, id), eq(task.userId, userId)));
}

/** Push the next nag forward by `seconds` and bump the snooze counter. */
export async function snoozeTask(
  userId: string,
  id: string,
  seconds: number,
): Promise<void> {
  await db
    .update(task)
    .set({
      nextNagAt: new Date(Date.now() + seconds * 1000),
      snoozeCount: sql`${task.snoozeCount} + 1`,
      updatedAt: new Date(),
    })
    .where(and(eq(task.id, id), eq(task.userId, userId)));
}

export async function deleteTask(userId: string, id: string): Promise<void> {
  await db.delete(task).where(and(eq(task.id, id), eq(task.userId, userId)));
}
