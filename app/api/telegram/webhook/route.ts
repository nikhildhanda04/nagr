import { webhookSecret } from "@/lib/telegram/config";
import { handleUpdate } from "@/lib/telegram/service";
import type { TgUpdate } from "@/lib/telegram/api";
import { db } from "@/db";
import { telegramProcessedUpdate } from "@/db/schema";

// Public route — Telegram calls it. Authenticity via the secret-token header.
export async function POST(req: Request) {
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (!secret || secret !== webhookSecret()) {
    return new Response("forbidden", { status: 403 });
  }

  const update = (await req.json().catch(() => null)) as TgUpdate | null;
  if (!update) return new Response("bad request", { status: 400 });

  // Dedup: Telegram redelivers updates that don't get a 200. Record the
  // update_id; if it's already there, we've handled it — skip.
  const inserted = await db
    .insert(telegramProcessedUpdate)
    .values({ updateId: update.update_id })
    .onConflictDoNothing()
    .returning({ updateId: telegramProcessedUpdate.updateId });
  if (inserted.length === 0) return new Response("OK");

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
