import { botToken } from "./config";

const API = "https://api.telegram.org/bot";

// --- Minimal Bot API types (only what we use) ---
export type TgUser = {
  id: number;
  is_bot: boolean;
  first_name: string;
  username?: string;
};

export type TgChat = { id: number; type: string };

export type TgMessage = {
  message_id: number;
  from?: TgUser;
  chat: TgChat;
  text?: string;
};

export type TgCallbackQuery = {
  id: string;
  from: TgUser;
  message?: TgMessage;
  data?: string;
};

export type TgUpdate = {
  update_id: number;
  message?: TgMessage;
  callback_query?: TgCallbackQuery;
};

export type InlineKeyboard = {
  inline_keyboard: { text: string; callback_data: string }[][];
};

type SendOptions = {
  parseMode?: "HTML" | "Markdown" | "MarkdownV2";
  replyToMessageId?: number;
  replyMarkup?: InlineKeyboard;
};

async function call<T>(method: string, body?: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${API}${botToken()}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json()) as
    | { ok: true; result: T }
    | { ok: false; description: string; error_code: number };
  if (!data.ok) {
    throw new Error(`Telegram ${method} failed: ${data.description}`);
  }
  return data.result;
}

export const getMe = () => call<TgUser>("getMe");

export const sendMessage = (
  chatId: string | number,
  text: string,
  opts: SendOptions = {},
) =>
  call<TgMessage>("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: opts.parseMode ?? "HTML",
    ...(opts.replyToMessageId
      ? { reply_parameters: { message_id: opts.replyToMessageId } }
      : {}),
    ...(opts.replyMarkup ? { reply_markup: opts.replyMarkup } : {}),
  });

export const setWebhook = (url: string, secretToken: string) =>
  call<boolean>("setWebhook", {
    url,
    secret_token: secretToken,
    allowed_updates: ["message", "callback_query"],
  });

export const deleteWebhook = () => call<boolean>("deleteWebhook", {});

export const getWebhookInfo = () => call<{ url: string }>("getWebhookInfo");

export const getUpdates = (offset?: number) =>
  call<TgUpdate[]>("getUpdates", {
    ...(offset !== undefined ? { offset } : {}),
    timeout: 0,
    allowed_updates: ["message", "callback_query"],
  });

export const answerCallbackQuery = (id: string, text?: string) =>
  call<boolean>("answerCallbackQuery", {
    callback_query_id: id,
    ...(text ? { text } : {}),
  });
