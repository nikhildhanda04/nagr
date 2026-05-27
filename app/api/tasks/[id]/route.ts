import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiUser, unauthorized, badRequest, notFound } from "@/lib/http";
import { getTask, updateTask, setTaskStatus, deleteTask } from "@/lib/tasks";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const user = await getApiUser();
  if (!user) return unauthorized();

  const { id } = await ctx.params;
  const task = await getTask(user.id, id);
  if (!task) return notFound();
  return NextResponse.json({ task });
}

const patchSchema = z
  .object({
    title: z.string().trim().min(1).max(500).optional(),
    dueAt: z.coerce.date().nullable().optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
    nagIntervalSec: z.number().int().min(30).max(86400).optional(),
    status: z.enum(["open", "done"]).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "No fields to update" });

export async function PATCH(req: Request, ctx: Ctx) {
  const user = await getApiUser();
  if (!user) return unauthorized();

  const { id } = await ctx.params;
  const existing = await getTask(user.id, id);
  if (!existing) return notFound();

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.flatten());

  const { status, title, dueAt, notes, nagIntervalSec } = parsed.data;

  if (status !== undefined) {
    await setTaskStatus(user.id, id, status === "done");
  }
  if (
    title !== undefined ||
    dueAt !== undefined ||
    notes !== undefined ||
    nagIntervalSec !== undefined
  ) {
    await updateTask(user.id, id, { title, dueAt, notes, nagIntervalSec });
  }

  const task = await getTask(user.id, id);
  return NextResponse.json({ task });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const user = await getApiUser();
  if (!user) return unauthorized();

  const { id } = await ctx.params;
  const existing = await getTask(user.id, id);
  if (!existing) return notFound();

  await deleteTask(user.id, id);
  return NextResponse.json({ ok: true });
}
