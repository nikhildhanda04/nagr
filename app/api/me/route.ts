import { NextResponse } from "next/server";
import { getApiUser, unauthorized } from "@/lib/http";

export async function GET() {
  const user = await getApiUser();
  if (!user) return unauthorized();

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email },
  });
}
