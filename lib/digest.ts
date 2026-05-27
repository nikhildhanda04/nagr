import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { task, telegramLink, user, type Task } from "@/db/schema";
import { sendToUser } from "./telegram/service";
import { escapeHtml } from "./telegram/format";

function hourInTz(tz: string | null, now: Date): number {
  const h = new Intl.DateTimeFormat("en-US", {
    timeZone: tz ?? "UTC",
    hour12: false,
    hour: "2-digit",
  })
    .formatToParts(now)
    .find((p) => p.type === "hour")?.value;
  return Number(h ?? "0") % 24;
}

function localDate(tz: string | null, now: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz ?? "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function buildDigest(
  slot: "morning" | "night",
  openCount: number,
  overdue: Task[],
): string {
  const head =
    slot === "morning"
      ? "🌅 <b>Good morning</b>"
      : "🌙 <b>Evening check-in</b>";
  const summary = `${openCount} open · ${overdue.length} overdue`;
  const list = overdue
    .slice(0, 5)
    .map((t) => `• ${escapeHtml(t.title)}`)
    .join("\n");
  return `${head}\n${summary}${list ? `\n\n<b>Overdue</b>\n${list}` : ""}`;
}

export type DigestResult = { sent: number };

/**
 * Send each linked user their morning/night digest when the local hour matches
 * their configured digest hour, at most once per slot per local day.
 */
export async function runDigestPass(now: Date = new Date()): Promise<DigestResult> {
  const rows = await db
    .select({
      id: user.id,
      tz: user.timezone,
      morningHour: user.morningDigestHour,
      nightHour: user.nightDigestHour,
      lastKey: user.lastDigestKey,
    })
    .from(user)
    .innerJoin(
      telegramLink,
      and(eq(telegramLink.userId, user.id), eq(telegramLink.status, "linked")),
    );

  let sent = 0;
  for (const u of rows) {
    if (u.morningHour == null && u.nightHour == null) continue;
    const hour = hourInTz(u.tz, now);
    const slot: "morning" | "night" | null =
      u.morningHour != null && hour === u.morningHour
        ? "morning"
        : u.nightHour != null && hour === u.nightHour
          ? "night"
          : null;
    if (!slot) continue;

    const key = `${localDate(u.tz, now)}:${slot}`;
    if (u.lastKey === key) continue; // already sent this slot today

    const open = await db
      .select()
      .from(task)
      .where(and(eq(task.userId, u.id), eq(task.status, "open")));
    const overdue = open.filter((t) => t.dueAt && new Date(t.dueAt) < now);

    try {
      const res = await sendToUser(u.id, buildDigest(slot, open.length, overdue));
      if (res.sent) sent++;
    } catch (err) {
      console.error("digest send failed for user", u.id, err);
    }
    // Mark sent regardless so a failed send doesn't retry every minute.
    await db.update(user).set({ lastDigestKey: key }).where(eq(user.id, u.id));
  }

  return { sent };
}
