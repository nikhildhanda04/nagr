import { NextResponse } from "next/server";
import { getApiUser, unauthorized, route } from "@/lib/http";
import { getWall } from "@/lib/shame";

// Wall of Shame: capped list of self + friends' fails (not an infinite feed).
export const GET = route(async () => {
  const user = await getApiUser();
  if (!user) return unauthorized();

  const wall = await getWall(user.id);
  return NextResponse.json({ wall });
});
