import { and, eq, isNotNull, lte, inArray, desc } from "drizzle-orm";
import { db } from "@/db";
import { task, user, shameEvent } from "@/db/schema";
import { friendIds } from "./friends";
import { sendToUser } from "./telegram/service";
import { escapeHtml } from "./telegram/format";

export type ShameResult = { failed: number; blasted: number };

/**
 * Find public, still-open tasks whose grace window (dueAt + graceSec) has
 * elapsed: lock them as `failed`, record a Wall entry, and blast the owner's
 * opted-in friends on Telegram. Idempotent — the fail flips status off "open".
 */
export async function runShamePass(now: Date = new Date()): Promise<ShameResult> {
  const candidates = await db
    .select({
      id: task.id,
      userId: task.userId,
      title: task.title,
      publicAlias: task.publicAlias,
      dueAt: task.dueAt,
      graceSec: task.graceSec,
      ownerName: user.name,
    })
    .from(task)
    .innerJoin(user, eq(user.id, task.userId))
    .where(
      and(
        eq(task.isPublic, true),
        eq(task.status, "open"),
        isNotNull(task.dueAt),
        lte(task.dueAt, now),
      ),
    );

  let failed = 0;
  let blasted = 0;

  for (const c of candidates) {
    if (!c.dueAt) continue;
    const deadline = new Date(new Date(c.dueAt).getTime() + c.graceSec * 1000);
    if (deadline > now) continue; // still within grace — nags continue, no shame yet

    // Lock + stop nagging. Guard on status=open so concurrent passes don't double-fire.
    const locked = await db
      .update(task)
      .set({ status: "failed", shamedAt: now, nextNagAt: null, updatedAt: now })
      .where(and(eq(task.id, c.id), eq(task.status, "open")))
      .returning({ id: task.id });
    if (locked.length === 0) continue;

    failed++;
    const display = c.publicAlias?.trim() || c.title;
    await db
      .insert(shameEvent)
      .values({ userId: c.userId, taskId: c.id, title: display, failedAt: now });

    const ids = await friendIds(c.userId);
    if (ids.length === 0) continue;

    const recipients = await db
      .select({ id: user.id })
      .from(user)
      .where(and(inArray(user.id, ids), eq(user.receiveShame, true)));

    for (const r of recipients) {
      const res = await sendToUser(
        r.id,
        `🔴 <b>${escapeHtml(c.ownerName)}</b> failed: ${escapeHtml(display)}`,
      );
      if (res.sent) blasted++;
    }
  }

  return { failed, blasted };
}

export type WallEntry = {
  id: string;
  userId: string;
  name: string;
  title: string;
  failedAt: Date;
  mine: boolean;
};

/** Wall of Shame for self + friends — a capped list, newest first (not a feed). */
export async function getWall(userId: string, limit = 50): Promise<WallEntry[]> {
  const ids = [userId, ...(await friendIds(userId))];
  const rows = await db
    .select({
      id: shameEvent.id,
      userId: shameEvent.userId,
      title: shameEvent.title,
      failedAt: shameEvent.failedAt,
      name: user.name,
    })
    .from(shameEvent)
    .innerJoin(user, eq(user.id, shameEvent.userId))
    .where(inArray(shameEvent.userId, ids))
    .orderBy(desc(shameEvent.failedAt))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    name: r.name,
    title: r.title,
    failedAt: r.failedAt,
    mine: r.userId === userId,
  }));
}
