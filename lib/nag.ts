import { and, eq, lte, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { task, telegramLink, user } from "@/db/schema";
import { sendTaskReminder } from "./telegram/reminders";
import { nextFutureOccurrence } from "@/lib/tasks";

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

// Escalation ladder: the longer a task is overdue, the shorter the interval.
function effectiveIntervalSec(
  base: number,
  escalate: boolean,
  dueAt: Date | null,
  now: Date,
): number {
  if (!escalate || !dueAt) return base;
  const hoursOverdue = (now.getTime() - new Date(dueAt).getTime()) / 3_600_000;
  const factor = hoursOverdue >= 3 ? 0.25 : hoursOverdue >= 1 ? 0.5 : 1;
  return Math.max(60, Math.floor(base * factor));
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
      kind: task.kind,
      recurrence: task.recurrence,
      nagIntervalSec: task.nagIntervalSec,
      escalate: task.escalate,
      snoozeCount: task.snoozeCount,
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
        snoozeCount: r.snoozeCount,
      });
      if (res.sent) sent++;
    } catch (err) {
      console.error("nag send failed for task", r.id, err);
    }
    // Reschedule. Reminders fire once (or roll to the next occurrence if
    // recurring); tasks keep nagging on the (escalating) interval.
    let nextNagAt: Date | null;
    let newDueAt: Date | undefined;
    if (r.kind === "reminder") {
      if (r.recurrence !== "none" && r.dueAt) {
        newDueAt = nextFutureOccurrence(r.dueAt, r.recurrence, now);
        nextNagAt = newDueAt;
      } else {
        nextNagAt = null; // one-shot reminder — done pinging
      }
    } else {
      const intervalSec = effectiveIntervalSec(r.nagIntervalSec, r.escalate, r.dueAt, now);
      nextNagAt = new Date(now.getTime() + intervalSec * 1000);
    }
    await db
      .update(task)
      .set({
        lastNagAt: now,
        nextNagAt,
        ...(newDueAt ? { dueAt: newDueAt } : {}),
        updatedAt: now,
      })
      .where(eq(task.id, r.id));
  }

  return { scanned: rows.length, sent, skippedQuiet };
}
