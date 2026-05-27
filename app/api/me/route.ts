import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getApiUser, unauthorized, badRequest } from "@/lib/http";
import { db } from "@/db";
import { user as userTable } from "@/db/schema";

export async function GET() {
  const user = await getApiUser();
  if (!user) return unauthorized();

  // Settings live in columns Better Auth's session doesn't carry — read them.
  const [settings] = await db
    .select({
      timezone: userTable.timezone,
      quietHoursStart: userTable.quietHoursStart,
      quietHoursEnd: userTable.quietHoursEnd,
      receiveShame: userTable.receiveShame,
    })
    .from(userTable)
    .where(eq(userTable.id, user.id))
    .limit(1);

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, ...settings },
  });
}

const patchSchema = z
  .object({
    timezone: z.string().max(64).nullable().optional(),
    quietHoursStart: z.number().int().min(0).max(1439).nullable().optional(),
    quietHoursEnd: z.number().int().min(0).max(1439).nullable().optional(),
    receiveShame: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "No fields to update" });

export async function PATCH(req: Request) {
  const user = await getApiUser();
  if (!user) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.flatten());

  await db
    .update(userTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(userTable.id, user.id));
  return NextResponse.json({ ok: true });
}
