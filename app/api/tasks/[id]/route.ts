import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiUser, unauthorized, badRequest, notFound, route } from "@/lib/http";
import { getTask, updateTask, setTaskStatus, deleteTask } from "@/lib/tasks";

type Ctx = { params: Promise<{ id: string }> };

export const GET = route(async (_req: Request, ctx: Ctx) => {
  const user = await getApiUser();
  if (!user) return unauthorized();

  const { id } = await ctx.params;
  const task = await getTask(user.id, id);
  if (!task) return notFound();
  return NextResponse.json({ task });
});

const patchSchema = z
  .object({
    title: z.string().trim().min(1).max(500).optional(),
    dueAt: z.coerce.date().nullable().optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
    nagIntervalSec: z.number().int().min(30).max(86400).optional(),
    isPublic: z.boolean().optional(),
    graceSec: z.number().int().min(0).max(86400).optional(),
    publicAlias: z.string().trim().max(200).nullable().optional(),
    escalate: z.boolean().optional(),
    recurrence: z.enum(["none", "daily", "weekly", "monthly"]).optional(),
    status: z.enum(["open", "done"]).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "No fields to update" });

export const PATCH = route(async (req: Request, ctx: Ctx) => {
  const user = await getApiUser();
  if (!user) return unauthorized();

  const { id } = await ctx.params;
  const existing = await getTask(user.id, id);
  if (!existing) return notFound();

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.flatten());

  const {
    status,
    title,
    dueAt,
    notes,
    nagIntervalSec,
    isPublic,
    graceSec,
    publicAlias,
    escalate,
    recurrence,
  } = parsed.data;

  if (status !== undefined) {
    await setTaskStatus(user.id, id, status === "done");
  }
  if (
    title !== undefined ||
    dueAt !== undefined ||
    notes !== undefined ||
    nagIntervalSec !== undefined ||
    isPublic !== undefined ||
    graceSec !== undefined ||
    publicAlias !== undefined ||
    escalate !== undefined ||
    recurrence !== undefined
  ) {
    await updateTask(user.id, id, {
      title,
      dueAt,
      notes,
      nagIntervalSec,
      isPublic,
      graceSec,
      publicAlias,
      escalate,
      recurrence,
    });
  }

  const task = await getTask(user.id, id);
  return NextResponse.json({ task });
});

export const DELETE = route(async (_req: Request, ctx: Ctx) => {
  const user = await getApiUser();
  if (!user) return unauthorized();

  const { id } = await ctx.params;
  const existing = await getTask(user.id, id);
  if (!existing) return notFound();

  await deleteTask(user.id, id);
  return NextResponse.json({ ok: true });
});
