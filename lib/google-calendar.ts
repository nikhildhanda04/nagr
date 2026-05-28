import { and, eq, gt, gte, isNull, lte, notInArray } from "drizzle-orm";
import { db } from "@/db";
import { account, user, calendarEvent, telegramLink } from "@/db/schema";
import { sendToUser } from "./telegram/service";
import { escapeHtml } from "./telegram/format";

const SYNC_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
const SYNC_THROTTLE_MS = 10 * 60 * 1000;

/** A valid Google access token for the user, refreshing if expired. */
async function googleAccessToken(userId: string): Promise<string | null> {
  const [acc] = await db
    .select()
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, "google")))
    .limit(1);
  if (!acc) return null;

  const stillValid =
    acc.accessToken &&
    acc.accessTokenExpiresAt &&
    new Date(acc.accessTokenExpiresAt).getTime() > Date.now() + 60_000;
  if (stillValid) return acc.accessToken;
  if (!acc.refreshToken) return acc.accessToken ?? null;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      refresh_token: acc.refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) return null;

  await db
    .update(account)
    .set({
      accessToken: data.access_token,
      accessTokenExpiresAt: new Date(Date.now() + (data.expires_in ?? 3600) * 1000),
      updatedAt: new Date(),
    })
    .where(eq(account.id, acc.id));
  return data.access_token;
}

type GEvent = {
  id: string;
  summary?: string;
  status?: string;
  start?: { dateTime?: string };
  end?: { dateTime?: string };
};

export type SyncResult =
  | { ok: true; count: number }
  | { ok: false; reason: "no_account" | "no_access" | "error" };

/** Pull the user's upcoming timed events into calendar_event (window refresh). */
export async function syncUserCalendar(
  userId: string,
  now: Date = new Date(),
): Promise<SyncResult> {
  const token = await googleAccessToken(userId);
  if (!token) return { ok: false, reason: "no_account" };

  const timeMax = new Date(now.getTime() + SYNC_WINDOW_MS);
  const params = new URLSearchParams({
    timeMin: now.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "100",
  });
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { authorization: `Bearer ${token}` } },
  );
  if (res.status === 401 || res.status === 403) return { ok: false, reason: "no_access" };
  if (!res.ok) return { ok: false, reason: "error" };

  const data = (await res.json()) as { items?: GEvent[] };
  // Timed, non-cancelled events only (skip all-day for reminder purposes).
  const events = (data.items ?? []).filter(
    (e) => e.status !== "cancelled" && e.start?.dateTime,
  );

  for (const e of events) {
    await db
      .insert(calendarEvent)
      .values({
        userId,
        externalId: e.id,
        source: "google",
        title: e.summary ?? "(no title)",
        startAt: new Date(e.start!.dateTime!),
        endAt: e.end?.dateTime ? new Date(e.end.dateTime) : null,
      })
      .onConflictDoUpdate({
        target: [calendarEvent.userId, calendarEvent.externalId],
        // Preserve remindedAt so we don't re-ping on every sync.
        set: {
          title: e.summary ?? "(no title)",
          startAt: new Date(e.start!.dateTime!),
          endAt: e.end?.dateTime ? new Date(e.end.dateTime) : null,
          updatedAt: new Date(),
        },
      });
  }

  // Drop events in the window that Google no longer returns (cancellations).
  const keep = events.map((e) => e.id);
  await db
    .delete(calendarEvent)
    .where(
      and(
        eq(calendarEvent.userId, userId),
        eq(calendarEvent.source, "google"),
        gte(calendarEvent.startAt, now),
        lte(calendarEvent.startAt, timeMax),
        notInArray(calendarEvent.externalId, keep),
      ),
    );

  await db
    .update(user)
    .set({ lastCalendarSyncAt: now })
    .where(eq(user.id, userId));
  return { ok: true, count: events.length };
}

/** Sync all opted-in users (throttled), for the cron tick. */
export async function runCalendarSync(now: Date = new Date()) {
  const users = await db
    .select({ id: user.id, last: user.lastCalendarSyncAt })
    .from(user)
    .where(eq(user.googleCalendarSync, true));

  let synced = 0;
  for (const u of users) {
    if (u.last && now.getTime() - new Date(u.last).getTime() < SYNC_THROTTLE_MS)
      continue;
    try {
      const r = await syncUserCalendar(u.id, now);
      if (r.ok) synced++;
    } catch (err) {
      console.error("calendar sync failed for", u.id, err);
    }
  }
  return { synced };
}

/** Ping linked users `leadMin` before each event starts (once per event). */
export async function runEventReminders(now: Date = new Date()) {
  const rows = await db
    .select({
      id: calendarEvent.id,
      userId: calendarEvent.userId,
      title: calendarEvent.title,
      startAt: calendarEvent.startAt,
      leadMin: calendarEvent.leadMin,
    })
    .from(calendarEvent)
    .innerJoin(
      telegramLink,
      and(
        eq(telegramLink.userId, calendarEvent.userId),
        eq(telegramLink.status, "linked"),
      ),
    )
    .where(
      and(
        isNull(calendarEvent.remindedAt),
        gt(calendarEvent.startAt, now),
        lte(calendarEvent.startAt, new Date(now.getTime() + 2 * 60 * 60 * 1000)),
      ),
    );

  let sent = 0;
  for (const r of rows) {
    const lead = new Date(new Date(r.startAt).getTime() - r.leadMin * 60_000);
    if (lead > now) continue; // not yet within the lead window
    const mins = Math.max(1, Math.round((new Date(r.startAt).getTime() - now.getTime()) / 60_000));
    try {
      await sendToUser(r.userId, `📅 <b>${escapeHtml(r.title)}</b> starts in ~${mins}m`);
      sent++;
    } catch (err) {
      console.error("event reminder failed for", r.id, err);
    }
    await db
      .update(calendarEvent)
      .set({ remindedAt: now })
      .where(eq(calendarEvent.id, r.id));
  }
  return { sent };
}
