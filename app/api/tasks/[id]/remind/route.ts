import { NextResponse } from "next/server";
import { getApiUser, unauthorized, notFound } from "@/lib/http";
import { getTask } from "@/lib/tasks";
import { sendTaskReminder } from "@/lib/telegram/reminders";

type Ctx = { params: Promise<{ id: string }> };

// Manually fire a reminder for one task (the recurring nag worker is Phase 3).
export async function POST(_req: Request, ctx: Ctx) {
  const user = await getApiUser();
  if (!user) return unauthorized();

  const { id } = await ctx.params;
  const task = await getTask(user.id, id);
  if (!task) return notFound();

  const result = await sendTaskReminder(user.id, task);
  return NextResponse.json(result, { status: result.sent ? 200 : 409 });
}
