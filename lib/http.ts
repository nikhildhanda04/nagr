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

/** True if the request carries the CRON_SECRET as a Bearer token. */
export function cronAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  return !!secret && req.headers.get("authorization") === `Bearer ${secret}`;
}

/** Wrap a route handler so any unhandled error returns a structured 500. */
export function route<A extends unknown[]>(
  handler: (...args: A) => Promise<Response>,
): (...args: A) => Promise<Response> {
  return async (...args: A) => {
    try {
      return await handler(...args);
    } catch (err) {
      console.error("unhandled route error", err);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 },
      );
    }
  };
}
