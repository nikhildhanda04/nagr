import { NextResponse } from "next/server";
import { getApiUser, unauthorized, badRequest, route } from "@/lib/http";
import { skipTask } from "@/lib/tasks";

type Ctx = { params: Promise<{ id: string }> };

// Skip the current occurrence of a recurring task → roll it to the next one.
export const POST = route(async (_req: Request, ctx: Ctx) => {
  const user = await getApiUser();
  if (!user) return unauthorized();

  const { id } = await ctx.params;
  const ok = await skipTask(user.id, id);
  if (!ok) {
    return badRequest({ message: "Task is not recurring or has no due date." });
  }
  return NextResponse.json({ ok: true });
});
