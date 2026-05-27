import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiUser, unauthorized, badRequest, route } from "@/lib/http";
import {
  listFriends,
  listIncoming,
  listOutgoing,
  sendRequest,
} from "@/lib/friends";

export const GET = route(async () => {
  const user = await getApiUser();
  if (!user) return unauthorized();

  const [friends, incoming, outgoing] = await Promise.all([
    listFriends(user.id),
    listIncoming(user.id),
    listOutgoing(user.id),
  ]);
  return NextResponse.json({ friends, incoming, outgoing });
});

const requestSchema = z.object({ email: z.email() });

export const POST = route(async (req: Request) => {
  const user = await getApiUser();
  if (!user) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.flatten());

  const result = await sendRequest(user.id, parsed.data.email);
  const status = result === "not_found" ? 404 : result === "self" ? 400 : 200;
  return NextResponse.json({ result }, { status });
});
