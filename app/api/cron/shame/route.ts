import { NextResponse } from "next/server";
import { runShamePass } from "@/lib/shame";
import { cronAuthorized, route } from "@/lib/http";

// Fail-detection + shame fan-out pass. Guard with CRON_SECRET.
const handle = route(async (req: Request) => {
  if (!cronAuthorized(req)) return new Response("forbidden", { status: 403 });
  const result = await runShamePass();
  return NextResponse.json(result);
});

export const GET = handle;
export const POST = handle;
