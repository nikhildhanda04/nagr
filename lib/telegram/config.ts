export function botToken(): string {
  const t = process.env.TELEGRAM_BOT_TOKEN;
  if (!t) throw new Error("TELEGRAM_BOT_TOKEN is not set");
  return t;
}

export const webhookSecret = (): string =>
  process.env.TELEGRAM_WEBHOOK_SECRET ?? "";

export const webhookBaseUrl = (): string =>
  process.env.TELEGRAM_WEBHOOK_URL?.replace(/\/$/, "") ?? "";

/** Webhook mode when a public base URL is configured; otherwise polling. */
export const isWebhookMode = (): boolean => webhookBaseUrl().length > 0;

export const webhookEndpoint = (): string =>
  `${webhookBaseUrl()}/api/telegram/webhook`;
