import { NextResponse } from "next/server";
import { runShamePass } from "@/lib/shame";
import { cronAuthorized } from "@/lib/http";

// Fail-detection + shame fan-out pass. Guard with CRON_SECRET.
async function handle(req: Request) {
  if (!cronAuthorized(req)) return new Response("forbidden", { status: 403 });
  const result = await runShamePass();
  return NextResponse.json(result);
}

export const GET = handle;
export const POST = handle;
