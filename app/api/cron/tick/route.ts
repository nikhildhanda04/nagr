import { NextResponse } from "next/server";
import { runShamePass } from "@/lib/shame";
import { runNagPass } from "@/lib/nag";
import { cronAuthorized } from "@/lib/http";

// One scheduler tick = the whole worker. Shame first (fail+lock overdue public
// tasks past grace, which removes them from the open pool), then nag the rest.
// Guarded by CRON_SECRET. Vercel Cron hits this via GET; POST works for manual
// or external schedulers. This is the single endpoint a scheduler should call.
async function handle(req: Request) {
  if (!cronAuthorized(req)) return new Response("forbidden", { status: 403 });

  const shame = await runShamePass();
  const nag = await runNagPass();
  return NextResponse.json({ shame, nag });
}

export const GET = handle;
export const POST = handle;
