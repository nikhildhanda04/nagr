import { NextResponse } from "next/server";
import { runNagPass } from "@/lib/nag";
import { cronAuthorized, route } from "@/lib/http";

// Runs one nag pass. Guard with CRON_SECRET (Vercel Cron sends it as a Bearer
// token via GET; POST works too for manual/external schedulers).
const handle = route(async (req: Request) => {
  if (!cronAuthorized(req)) return new Response("forbidden", { status: 403 });
  const result = await runNagPass();
  return NextResponse.json(result);
});

export const GET = handle;
export const POST = handle;
