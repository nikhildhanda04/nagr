import { webhookSecret } from "@/lib/telegram/config";
import { handleUpdate } from "@/lib/telegram/service";
import type { TgUpdate } from "@/lib/telegram/api";

// Public route — Telegram calls it. Authenticity via the secret-token header.
export async function POST(req: Request) {
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (!secret || secret !== webhookSecret()) {
    return new Response("forbidden", { status: 403 });
  }

  const update = (await req.json().catch(() => null)) as TgUpdate | null;
  if (!update) return new Response("bad request", { status: 400 });

  // Ack AFTER processing: on serverless the function can suspend once we
  // respond, which would kill an in-flight sendMessage. Telegram allows a few
  // seconds. Errors are swallowed so Telegram doesn't hammer retries.
  try {
    await handleUpdate(update);
  } catch (err) {
    console.error("telegram webhook error", err);
  }
  return new Response("OK");
}
