// Integration tests against the configured DATABASE_URL (Neon). Run: bun test
// Telegram sends are forced to fail locally (token cleared) so the cron passes
// are exercised for resilience WITHOUT sending real messages.
import { test, expect, afterAll } from "bun:test";
import { randomUUID } from "node:crypto";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { user, telegramLink } from "@/db/schema";
import {
  createTask,
  getTask,
  getUserTasks,
  setTaskStatus,
  snoozeTask,
  skipTask,
  deleteTask,
} from "@/lib/tasks";
import { handleUpdate } from "@/lib/telegram/service";
import {
  sendRequest,
  acceptRequest,
  removeFriend,
  friendIds,
  listFriends,
  listIncoming,
} from "@/lib/friends";
import { runShamePass, getWall } from "@/lib/shame";
import { runNagPass } from "@/lib/nag";

const userIds: string[] = [];
async function makeUser(name = "U"): Promise<{ id: string; email: string }> {
  const id = randomUUID();
  const email = `test_${id}@test.local`;
  await db.insert(user).values({
    id,
    name,
    email,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  userIds.push(id);
  return { id, email };
}
async function linkBogus(userId: string) {
  // chatId that will never accept a message; we also clear the token before
  // sending so nothing actually hits Telegram.
  await db.insert(telegramLink).values({
    userId,
    chatId: "1",
    status: "linked",
    linkedAt: new Date(),
  });
}
async function withSendsDisabled<T>(fn: () => Promise<T>): Promise<T> {
  const saved = process.env.TELEGRAM_BOT_TOKEN;
  delete process.env.TELEGRAM_BOT_TOKEN; // botToken() throws -> caught by resilience
  try {
    return await fn();
  } finally {
    if (saved !== undefined) process.env.TELEGRAM_BOT_TOKEN = saved;
  }
}

afterAll(async () => {
  if (userIds.length) await db.delete(user).where(inArray(user.id, userIds));
});

test("createTask schedules first nag at dueAt; done stops, reopen resumes", async () => {
  const u = await makeUser();
  const due = new Date(Date.now() + 3_600_000);
  const t = await createTask(u.id, { title: "x", dueAt: due });
  expect(Math.abs((t.nextNagAt?.getTime() ?? 0) - due.getTime())).toBeLessThan(1000);

  await setTaskStatus(u.id, t.id, true);
  let g = await getTask(u.id, t.id);
  expect(g?.status).toBe("done");
  expect(g?.nextNagAt).toBeNull();
  expect(g?.completedAt).not.toBeNull();

  await setTaskStatus(u.id, t.id, false);
  g = await getTask(u.id, t.id);
  expect(g?.status).toBe("open");
  expect(Math.abs((g?.nextNagAt?.getTime() ?? 0) - due.getTime())).toBeLessThan(1000);
});

test("snooze pushes nextNagAt into the future", async () => {
  const u = await makeUser();
  const t = await createTask(u.id, { title: "s", dueAt: new Date(Date.now() - 1000) });
  await snoozeTask(u.id, t.id, 600);
  const g = await getTask(u.id, t.id);
  expect((g?.nextNagAt?.getTime() ?? 0)).toBeGreaterThan(Date.now());
});

test("task access is ownership-scoped", async () => {
  const a = await makeUser();
  const b = await makeUser();
  const t = await createTask(a.id, { title: "a" });
  expect(await getTask(b.id, t.id)).toBeUndefined();
  await deleteTask(b.id, t.id); // no-op for non-owner
  expect(await getTask(a.id, t.id)).toBeDefined();
});

test("friends: request -> accept -> list -> remove", async () => {
  const a = await makeUser("A");
  const b = await makeUser("B");
  expect(await sendRequest(a.id, "missing@nowhere.test")).toBe("not_found");
  expect(await sendRequest(a.id, a.email)).toBe("self");
  expect(await sendRequest(a.id, b.email)).toBe("requested");
  expect(await sendRequest(a.id, b.email)).toBe("already_pending");

  const incoming = await listIncoming(b.id);
  expect(incoming.length).toBe(1);
  expect(await acceptRequest(b.id, incoming[0].friendshipId)).toBe(true);
  expect(await friendIds(a.id)).toContain(b.id);
  expect(await sendRequest(a.id, b.email)).toBe("already_friends");

  const f = (await listFriends(a.id)).find((x) => x.id === b.id)!;
  expect(f).toBeDefined();
  expect(await removeFriend(a.id, f.friendshipId)).toBe(true);
  expect(await friendIds(a.id)).not.toContain(b.id);
});

test("friends: reverse request auto-accepts; email is case-insensitive", async () => {
  const c = await makeUser("C");
  const d = await makeUser("D");
  await sendRequest(c.id, d.email); // c -> d pending
  expect(await sendRequest(d.id, c.email)).toBe("accepted"); // d sees it -> accept

  const e = await makeUser("E");
  const f = await makeUser("F");
  expect(await sendRequest(e.id, f.email.toUpperCase())).toBe("requested");
});

test("shame pass: fails public overdue task once, records Wall entry, survives send failure", async () => {
  const owner = await makeUser("Owner");
  const friend = await makeUser("Friend");
  await sendRequest(owner.id, friend.email);
  const inc = await listIncoming(friend.id);
  await acceptRequest(friend.id, inc[0].friendshipId);
  await linkBogus(friend.id);

  const t = await createTask(owner.id, {
    title: "real secret",
    publicAlias: "an alias",
    isPublic: true,
    graceSec: 0,
    dueAt: new Date(Date.now() - 1000),
  });

  const res = await withSendsDisabled(() => runShamePass());
  expect(res.failed).toBeGreaterThanOrEqual(1);

  const g = await getTask(owner.id, t.id);
  expect(g?.status).toBe("failed");
  expect(g?.shamedAt).not.toBeNull();

  const ownerWall = await getWall(owner.id);
  expect(ownerWall.some((w) => w.title === "an alias")).toBe(true); // alias, not real title
  const friendWall = await getWall(friend.id);
  expect(friendWall.some((w) => w.title === "an alias" && !w.mine)).toBe(true);

  // shame-once: a second pass must not re-fail / duplicate the Wall entry.
  const before = (await getWall(owner.id)).length;
  await withSendsDisabled(() => runShamePass());
  expect((await getWall(owner.id)).length).toBe(before);
});

test("nag pass bumps nextNagAt even when the send fails (resilience)", async () => {
  const u = await makeUser();
  await linkBogus(u.id);
  const t = await createTask(u.id, {
    title: "nag me",
    dueAt: new Date(Date.now() - 1000),
    nagIntervalSec: 900,
  });

  // Must not throw despite the send failing, and must bump the cursor forward.
  await withSendsDisabled(() => runNagPass());
  const g = await getTask(u.id, t.id);
  expect((g?.nextNagAt?.getTime() ?? 0)).toBeGreaterThan(Date.now());
});

test("in-chat commands: /add creates a task, /done completes it", async () => {
  const u = await makeUser();
  const chatId = `cmd_${u.id}`;
  await db
    .insert(telegramLink)
    .values({ userId: u.id, chatId, status: "linked", linkedAt: new Date() });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const msg = (id: number, text: string): any => ({
    update_id: id,
    message: { message_id: id, chat: { id: chatId, type: "private" }, text },
  });

  // Sends are disabled (token cleared) so the reply throws AFTER the DB write —
  // exactly what the webhook/poll callers swallow in prod.
  await withSendsDisabled(async () => {
    try {
      await handleUpdate(msg(1, "/add buy milk"));
    } catch {}
  });
  let open = (await getUserTasks(u.id)).filter((t) => t.status === "open");
  expect(open.some((t) => t.title === "buy milk")).toBe(true);

  await withSendsDisabled(async () => {
    try {
      await handleUpdate(msg(2, "/done 1"));
    } catch {}
  });
  open = (await getUserTasks(u.id)).filter((t) => t.status === "open");
  expect(open.some((t) => t.title === "buy milk")).toBe(false);
});

test("recurring: completing spawns the next occurrence", async () => {
  const u = await makeUser();
  const t = await createTask(u.id, {
    title: "daily standup",
    dueAt: new Date(Date.now() - 1000),
    recurrence: "daily",
  });
  await setTaskStatus(u.id, t.id, true);

  const all = await getUserTasks(u.id);
  expect(all.find((x) => x.id === t.id)?.status).toBe("done");
  const next = all.find((x) => x.id !== t.id && x.title === "daily standup");
  expect(next?.status).toBe("open");
  expect(next?.recurrence).toBe("daily");
  expect(next?.dueAt?.getTime() ?? 0).toBeGreaterThan(Date.now());
});

test("snooze increments the snooze counter", async () => {
  const u = await makeUser();
  const t = await createTask(u.id, { title: "s", dueAt: new Date(Date.now() - 1000) });
  await snoozeTask(u.id, t.id, 600);
  await snoozeTask(u.id, t.id, 600);
  expect((await getTask(u.id, t.id))?.snoozeCount).toBe(2);
});

test("skip rolls a recurring task forward; no-op on non-recurring", async () => {
  const u = await makeUser();
  const t = await createTask(u.id, {
    title: "weekly",
    dueAt: new Date(Date.now() - 1000),
    recurrence: "weekly",
  });
  expect(await skipTask(u.id, t.id)).toBe(true);
  const g = await getTask(u.id, t.id);
  expect(g?.status).toBe("open");
  expect(g?.dueAt?.getTime() ?? 0).toBeGreaterThan(Date.now());

  const once = await createTask(u.id, { title: "once", dueAt: new Date() });
  expect(await skipTask(u.id, once.id)).toBe(false);
});

test("escalation shrinks the nag interval when overdue", async () => {
  const u = await makeUser();
  await linkBogus(u.id);
  const t = await createTask(u.id, {
    title: "escalate me",
    dueAt: new Date(Date.now() - 4 * 3_600_000), // 4h overdue
    nagIntervalSec: 900,
    escalate: true,
  });
  await withSendsDisabled(() => runNagPass());
  const g = await getTask(u.id, t.id);
  const deltaSec = ((g?.nextNagAt?.getTime() ?? 0) - Date.now()) / 1000;
  expect(deltaSec).toBeGreaterThan(60); // not below the floor
  expect(deltaSec).toBeLessThan(900); // shrunk below the 900s base (4h → ~225s)
});
