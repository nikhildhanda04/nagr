import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getApiUser, unauthorized } from "@/lib/http";
import { isWebhookMode } from "@/lib/telegram/config";
import { getUpdates, getWebhookInfo } from "@/lib/telegram/api";
import { handleUpdate } from "@/lib/telegram/service";
import { db } from "@/db";
import { telegramState } from "@/db/schema";

// On-demand polling for local dev (no public webhook). Mutually exclusive with
// webhook mode — Telegram blocks getUpdates while a webhook is set.
export async function POST() {
  const user = await getApiUser();
  if (!user) return unauthorized();

  if (isWebhookMode()) {
    return NextResponse.json({ skipped: true, reason: "webhook_mode" });
  }
  const info = await getWebhookInfo();
  if (info.url) {
    return NextResponse.json({ skipped: true, reason: "webhook_active", url: info.url });
  }

  const [state] = await db
    .select()
    .from(telegramState)
    .where(eq(telegramState.id, "singleton"))
    .limit(1);

  const offset = state ? state.lastUpdateId + 1 : undefined;
  const updates = await getUpdates(offset);

  let maxId = state?.lastUpdateId ?? 0;
  for (const u of updates) {
    await handleUpdate(u);
    if (u.update_id > maxId) maxId = u.update_id;
  }

  if (updates.length > 0) {
    await db
      .insert(telegramState)
      .values({ id: "singleton", lastUpdateId: maxId })
      .onConflictDoUpdate({
        target: telegramState.id,
        set: { lastUpdateId: maxId },
      });
  }

  return NextResponse.json({ processed: updates.length, lastUpdateId: maxId });
}
