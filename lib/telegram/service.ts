import { eq, lt } from "drizzle-orm";
import { db } from "@/db";
import { telegramLink, telegramProcessedUpdate } from "@/db/schema";
import {
  createTask,
  getUserTasks,
  setTaskStatus,
  snoozeTask,
  skipTask,
} from "@/lib/tasks";
import {
  getMe,
  sendMessage,
  answerCallbackQuery,
  type TgUpdate,
  type TgMessage,
  type TgCallbackQuery,
  type InlineKeyboard,
} from "./api";
import { completeLink } from "./link";
import { escapeHtml } from "./format";

let cachedUsername: string | null = null;

export async function getBotUsername(): Promise<string> {
  const fromEnv = process.env.TELEGRAM_BOT_USERNAME;
  if (fromEnv) return fromEnv;
  if (cachedUsername) return cachedUsername;
  const me = await getMe();
  cachedUsername = me.username ?? "";
  return cachedUsername;
}

/** Entry point for both webhook and polling. */
export async function handleUpdate(update: TgUpdate): Promise<void> {
  if (update.message?.text) {
    await handleMessage(update.message);
  } else if (update.callback_query) {
    await handleCallback(update.callback_query);
  }
}

async function resolveUserId(chatId: string): Promise<string | null> {
  const [link] = await db
    .select()
    .from(telegramLink)
    .where(eq(telegramLink.chatId, chatId))
    .limit(1);
  return link && link.status === "linked" ? link.userId : null;
}

async function handleMessage(msg: TgMessage): Promise<void> {
  const text = (msg.text ?? "").trim();
  const chatId = String(msg.chat.id);

  // /start <token> works before the chat is linked.
  if (text.startsWith("/start")) {
    const token = text.split(/\s+/)[1];
    if (!token) {
      await sendMessage(
        chatId,
        "👋 Welcome to <b>nagr</b>. Open the app and tap “Connect Telegram” to link this chat.",
      );
      return;
    }
    const linked = await completeLink(token, chatId, msg.from);
    await sendMessage(
      chatId,
      linked
        ? "✅ <b>Linked!</b> I'll nag you here when tasks are due.\n\nTry /help"
        : "⚠️ That link is invalid or already used. Generate a fresh one in the app.",
    );
    return;
  }

  // Every other command needs a linked chat.
  const userId = await resolveUserId(chatId);
  if (!userId) {
    await sendMessage(
      chatId,
      "This chat isn't linked. Open nagr and tap “Connect Telegram”.",
    );
    return;
  }

  const cmd = text.split(/\s+/)[0].toLowerCase();
  const arg = text.slice(cmd.length).trim();

  switch (cmd) {
    case "/add":
      return cmdAdd(chatId, userId, arg);
    case "/list":
    case "/tasks":
      return cmdList(chatId, userId);
    case "/done":
      return cmdDone(chatId, userId, arg);
    case "/snooze":
      return cmdSnooze(chatId, userId, arg);
    case "/skip":
      return cmdSkip(chatId, userId, arg);
    case "/help":
      return cmdHelp(chatId);
    default:
      await sendMessage(chatId, "Unknown command. Try /help");
  }
}

async function openTasks(userId: string) {
  return (await getUserTasks(userId)).filter((t) => t.status === "open");
}

async function cmdAdd(chatId: string, userId: string, title: string) {
  if (!title) {
    await sendMessage(chatId, "Usage: <code>/add buy milk</code>");
    return;
  }
  const t = await createTask(userId, { title });
  await sendMessage(chatId, `✅ Added: <b>${escapeHtml(t.title)}</b>`);
}

async function cmdList(chatId: string, userId: string) {
  const tasks = await openTasks(userId);
  if (tasks.length === 0) {
    await sendMessage(chatId, "🎉 No open tasks.");
    return;
  }
  const lines = tasks.map((t, i) => {
    const due = t.dueAt ? ` — ${new Date(t.dueAt).toLocaleString()}` : "";
    return `${i + 1}. ${escapeHtml(t.title)}${due}`;
  });
  await sendMessage(
    chatId,
    `<b>Open tasks</b>\n${lines.join("\n")}\n\n<code>/done n</code> · <code>/snooze n [min]</code>`,
  );
}

async function cmdDone(chatId: string, userId: string, arg: string) {
  const tasks = await openTasks(userId);
  const n = Number(arg.split(/\s+/)[0]);
  const t = tasks[n - 1];
  if (!t) {
    await sendMessage(chatId, "Usage: <code>/done n</code> (see /list)");
    return;
  }
  await setTaskStatus(userId, t.id, true);
  await sendMessage(chatId, `✅ Done: <b>${escapeHtml(t.title)}</b>`);
}

async function cmdSnooze(chatId: string, userId: string, arg: string) {
  const [nStr, minStr] = arg.split(/\s+/);
  const tasks = await openTasks(userId);
  const t = tasks[Number(nStr) - 1];
  if (!t) {
    await sendMessage(chatId, "Usage: <code>/snooze n [minutes]</code> (see /list)");
    return;
  }
  const minutes = Number(minStr) > 0 ? Number(minStr) : 60;
  await snoozeTask(userId, t.id, minutes * 60);
  await sendMessage(chatId, `💤 Snoozed <b>${escapeHtml(t.title)}</b> ${minutes}m`);
}

async function cmdSkip(chatId: string, userId: string, arg: string) {
  const tasks = await openTasks(userId);
  const t = tasks[Number(arg.split(/\s+/)[0]) - 1];
  if (!t) {
    await sendMessage(chatId, "Usage: <code>/skip n</code> (see /list)");
    return;
  }
  const ok = await skipTask(userId, t.id);
  await sendMessage(
    chatId,
    ok
      ? `⏭ Skipped to next: <b>${escapeHtml(t.title)}</b>`
      : "That task isn't recurring.",
  );
}

async function cmdHelp(chatId: string) {
  await sendMessage(
    chatId,
    [
      "<b>nagr commands</b>",
      "<code>/add buy milk</code> — add a task",
      "<code>/list</code> — your open tasks",
      "<code>/done n</code> — complete task n",
      "<code>/snooze n [min]</code> — snooze task n",
      "<code>/skip n</code> — skip a recurring task to next",
    ].join("\n"),
  );
}

// Callback queries expire after a few minutes; answering an expired one errors.
// Never let that throw — it would crash the update loop / wedge the poll cursor.
async function safeAnswer(id: string, text?: string): Promise<void> {
  try {
    await answerCallbackQuery(id, text);
  } catch (err) {
    console.error("answerCallbackQuery failed (likely expired)", err);
  }
}

async function handleCallback(cq: TgCallbackQuery): Promise<void> {
  const chatId = cq.message?.chat.id;
  const data = cq.data ?? "";

  if (chatId === undefined) return safeAnswer(cq.id);

  const userId = await resolveUserId(String(chatId));
  if (!userId) return safeAnswer(cq.id, "This chat isn't linked.");

  if (data.startsWith("done:")) {
    const taskId = data.slice("done:".length);
    await setTaskStatus(userId, taskId, true); // ownership-scoped
    return safeAnswer(cq.id, "Marked done ✅");
  }

  if (data.startsWith("snooze:")) {
    const [, taskId, secStr] = data.split(":");
    const seconds = Number(secStr) || 600;
    await snoozeTask(userId, taskId, seconds);
    return safeAnswer(cq.id, `Snoozed ${Math.round(seconds / 60)}m 💤`);
  }

  return safeAnswer(cq.id);
}

/** Send a message to a user's linked chat. No-op result if not linked. */
export async function sendToUser(
  userId: string,
  text: string,
  opts: { replyMarkup?: InlineKeyboard } = {},
): Promise<{ sent: boolean; reason?: "not_linked" }> {
  const [link] = await db
    .select()
    .from(telegramLink)
    .where(eq(telegramLink.userId, userId))
    .limit(1);

  if (!link || link.status !== "linked" || !link.chatId) {
    return { sent: false, reason: "not_linked" };
  }
  await sendMessage(link.chatId, text, opts);
  return { sent: true };
}

/** Drop processed-update dedup rows older than `olderThanMs` (default 1 day). */
export async function pruneProcessedUpdates(
  olderThanMs = 24 * 60 * 60 * 1000,
): Promise<void> {
  await db
    .delete(telegramProcessedUpdate)
    .where(lt(telegramProcessedUpdate.processedAt, new Date(Date.now() - olderThanMs)));
}
