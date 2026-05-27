import { NextResponse } from "next/server";
import { getApiUser, unauthorized, notFound } from "@/lib/http";
import { removeFriend } from "@/lib/friends";

type Ctx = { params: Promise<{ id: string }> };

// Remove a friend, decline an incoming request, or cancel an outgoing one.
export async function DELETE(_req: Request, ctx: Ctx) {
  const user = await getApiUser();
  if (!user) return unauthorized();

  const { id } = await ctx.params;
  const ok = await removeFriend(user.id, id);
  if (!ok) return notFound();
  return NextResponse.json({ ok: true });
}
