import { NextResponse } from "next/server";
import { getApiUser, unauthorized, route } from "@/lib/http";
import {
  isWebhookMode,
  webhookEndpoint,
  webhookSecret,
} from "@/lib/telegram/config";
import { setWebhook, deleteWebhook, getWebhookInfo } from "@/lib/telegram/api";

// Register the webhook from TELEGRAM_WEBHOOK_URL (or remove it if unset).
export const POST = route(async () => {
  const user = await getApiUser();
  if (!user) return unauthorized();

  if (!isWebhookMode()) {
    await deleteWebhook();
    return NextResponse.json({ mode: "polling", deleted: true });
  }
  await setWebhook(webhookEndpoint(), webhookSecret());
  const info = await getWebhookInfo();
  return NextResponse.json({ mode: "webhook", url: info.url });
});

export const DELETE = route(async () => {
  const user = await getApiUser();
  if (!user) return unauthorized();

  await deleteWebhook();
  return NextResponse.json({ ok: true });
});
