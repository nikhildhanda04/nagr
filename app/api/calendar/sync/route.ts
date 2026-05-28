import { NextResponse } from "next/server";
import { getApiUser, unauthorized, route } from "@/lib/http";
import { syncUserCalendar } from "@/lib/google-calendar";

// Manual "Sync now". Returns 403 if the user hasn't granted Calendar access.
export const POST = route(async () => {
  const user = await getApiUser();
  if (!user) return unauthorized();

  const result = await syncUserCalendar(user.id);
  if (!result.ok) {
    const status = result.reason === "no_access" ? 403 : 400;
    return NextResponse.json({ error: result.reason }, { status });
  }
  return NextResponse.json(result);
});
