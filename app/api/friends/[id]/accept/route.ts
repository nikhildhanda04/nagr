import { NextResponse } from "next/server";
import { getApiUser, unauthorized, notFound, route } from "@/lib/http";
import { acceptRequest } from "@/lib/friends";

type Ctx = { params: Promise<{ id: string }> };

export const POST = route(async (_req: Request, ctx: Ctx) => {
  const user = await getApiUser();
  if (!user) return unauthorized();

  const { id } = await ctx.params;
  const ok = await acceptRequest(user.id, id);
  if (!ok) return notFound();
  return NextResponse.json({ ok: true });
});
