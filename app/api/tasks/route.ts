import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiUser, unauthorized, badRequest } from "@/lib/http";
import { getUserTasks, createTask } from "@/lib/tasks";

export async function GET() {
  const user = await getApiUser();
  if (!user) return unauthorized();

  const tasks = await getUserTasks(user.id);
  return NextResponse.json({ tasks });
}

const createSchema = z.object({
  title: z.string().trim().min(1).max(500),
  dueAt: z.coerce.date().nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  nagIntervalSec: z.number().int().min(30).max(86400).optional(),
  isPublic: z.boolean().optional(),
  graceSec: z.number().int().min(0).max(86400).optional(),
  publicAlias: z.string().trim().max(200).nullable().optional(),
});

export async function POST(req: Request) {
  const user = await getApiUser();
  if (!user) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.flatten());

  const task = await createTask(user.id, {
    title: parsed.data.title,
    dueAt: parsed.data.dueAt ?? null,
    notes: parsed.data.notes ?? null,
    nagIntervalSec: parsed.data.nagIntervalSec,
    isPublic: parsed.data.isPublic,
    graceSec: parsed.data.graceSec,
    publicAlias: parsed.data.publicAlias,
  });
  return NextResponse.json({ task }, { status: 201 });
}
