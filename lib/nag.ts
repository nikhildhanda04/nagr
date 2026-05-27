import { and, eq, lte, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { task, telegramLink, user } from "@/db/schema";
import { sendTaskReminder } from "./telegram/reminders";

/** Current minute-of-day (0-1439) in the given IANA timezone. */
function minutesInTz(tz: string | null, now: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz ?? "UTC",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(now);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? "0") % 24;
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return h * 60 + m;
}

function inQuietHours(
  start: number | null,
  end: number | null,
  mins: number,
): boolean {
  if (start == null || end == null || start === end) return false;
  // Handles windows that wrap past midnight (e.g. 22:00 -> 08:00).
  return start < end ? mins >= start && mins < end : mins >= start || mins < end;
}

export type NagResult = { scanned: number; sent: number; skippedQuiet: number };

/**
 * One nag pass: find open, overdue (nextNagAt <= now) tasks whose owner has a
 * linked Telegram, send a reminder (unless in quiet hours), bump nextNagAt.
 */
export async function runNagPass(now: Date = new Date()): Promise<NagResult> {
  const rows = await db
    .select({
      id: task.id,
      userId: task.userId,
      title: task.title,
      dueAt: task.dueAt,
      nagIntervalSec: task.nagIntervalSec,
      tz: user.timezone,
      qStart: user.quietHoursStart,
      qEnd: user.quietHoursEnd,
    })
    .from(task)
    .innerJoin(telegramLink, eq(telegramLink.userId, task.userId))
    .innerJoin(user, eq(user.id, task.userId))
    .where(
      and(
        eq(task.status, "open"),
        isNotNull(task.nextNagAt),
        lte(task.nextNagAt, now),
        eq(telegramLink.status, "linked"),
      ),
    );

  let sent = 0;
  let skippedQuiet = 0;

  for (const r of rows) {
    if (inQuietHours(r.qStart, r.qEnd, minutesInTz(r.tz, now))) {
      skippedQuiet++;
      continue; // don't bump nextNagAt → resumes after quiet hours
    }
    // Per-task isolation: a single failed send (e.g. user blocked the bot)
    // must not abort the whole pass or starve other users.
    try {
      const res = await sendTaskReminder(r.userId, {
        id: r.id,
        title: r.title,
        dueAt: r.dueAt,
      });
      if (res.sent) sent++;
    } catch (err) {
      console.error("nag send failed for task", r.id, err);
    }
    // Bump regardless of send outcome so a persistently-failing send can't
    // wedge the loop or re-fire every tick.
    await db
      .update(task)
      .set({
        lastNagAt: now,
        nextNagAt: new Date(now.getTime() + r.nagIntervalSec * 1000),
        updatedAt: now,
      })
      .where(eq(task.id, r.id));
  }

  return { scanned: rows.length, sent, skippedQuiet };
}
