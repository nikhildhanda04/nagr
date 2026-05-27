import { NextResponse } from "next/server";
import { runNagPass } from "@/lib/nag";

// Runs one nag pass. Guard with CRON_SECRET (Vercel Cron sends it as a Bearer
// token via GET; POST works too for manual/external schedulers).
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

async function handle(req: Request) {
  if (!authorized(req)) return new Response("forbidden", { status: 403 });
  const result = await runNagPass();
  return NextResponse.json(result);
}

export const GET = handle;
export const POST = handle;
