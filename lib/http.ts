import { NextResponse } from "next/server";
import { getSession } from "@/lib/dal";

/** Returns the authed user, or null. For API routes (no redirect). */
export async function getApiUser() {
  const session = await getSession();
  return session?.user ?? null;
}

export const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export const badRequest = (details?: unknown) =>
  NextResponse.json({ error: "Bad Request", details }, { status: 400 });

export const notFound = () =>
  NextResponse.json({ error: "Not Found" }, { status: 404 });
