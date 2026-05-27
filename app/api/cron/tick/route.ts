import { NextResponse } from "next/server";
import { runShamePass } from "@/lib/shame";
import { runNagPass } from "@/lib/nag";
import { runDigestPass } from "@/lib/digest";
import { pruneProcessedUpdates } from "@/lib/telegram/service";
import { cronAuthorized, route } from "@/lib/http";

// One scheduler tick = the whole worker. Shame first (fail+lock overdue public
// tasks past grace, which removes them from the open pool), then nag the rest.
// Guarded by CRON_SECRET. Vercel Cron hits this via GET; POST works for manual
// or external schedulers. This is the single endpoint a scheduler should call.
const handle = route(async (req: Request) => {
  if (!cronAuthorized(req)) return new Response("forbidden", { status: 403 });
  const shame = await runShamePass();
  const nag = await runNagPass();
  const digest = await runDigestPass();
  await pruneProcessedUpdates(); // keep the webhook-dedup table from growing forever
  return NextResponse.json({ shame, nag, digest });
});

export const GET = handle;
export const POST = handle;
