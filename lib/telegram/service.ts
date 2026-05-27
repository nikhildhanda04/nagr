import { eq } from "drizzle-orm";
import { db } from "@/db";
import { telegramLink } from "@/db/schema";
import { setTaskStatus } from "@/lib/tasks";
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

async function handleMessage(msg: TgMessage): Promise<void> {
  const text = (msg.text ?? "").trim();
  const chatId = String(msg.chat.id);

  if (text.startsWith("/start")) {
    const token = text.split(/\s+/)[1];
    if (!token) {
      await sendMessage(
        chatId,
        "👋 Welcome to <b>whatstodo</b>. Open the app and tap “Connect Telegram” to link this chat.",
      );
      return;
    }
    const linked = await completeLink(token, chatId, msg.from);
    await sendMessage(
      chatId,
      linked
        ? "✅ <b>Linked!</b> I'll nag you here when tasks are due."
        : "⚠️ That link is invalid or already used. Generate a fresh one in the app.",
    );
    return;
  }

  await sendMessage(
    chatId,
    "Add tasks in the whatstodo app — I'll remind you here. Commands coming soon.",
  );
}

async function handleCallback(cq: TgCallbackQuery): Promise<void> {
  const chatId = cq.message?.chat.id;
  const data = cq.data ?? "";

  if (chatId === undefined) {
    await answerCallbackQuery(cq.id);
    return;
  }

  const [link] = await db
    .select()
    .from(telegramLink)
    .where(eq(telegramLink.chatId, String(chatId)))
    .limit(1);

  if (!link || link.status !== "linked") {
    await answerCallbackQuery(cq.id, "This chat isn't linked.");
    return;
  }

  if (data.startsWith("done:")) {
    const taskId = data.slice("done:".length);
    await setTaskStatus(link.userId, taskId, true); // ownership-scoped
    await answerCallbackQuery(cq.id, "Marked done ✅");
    return;
  }

  await answerCallbackQuery(cq.id);
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
