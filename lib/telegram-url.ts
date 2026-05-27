export function getTelegramBotUrl(): string | null {
  const full = process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL;
  if (full) return full;

  const username = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
  if (!username) return null;

  return `https://t.me/${username.replace(/^@/, "")}`;
}
