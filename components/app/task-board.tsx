"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "motion/react";
import type { Task } from "@/db/schema";
import { groupTasks, type GroupedTasks } from "@/lib/group-tasks";
import { cn } from "@/lib/cn";
import { Mono } from "@/components/ui/card";
import { TaskItem } from "./task-item";
import { AddTaskForm, type NewTaskValues } from "./add-task-form";

export function TaskBoard({ tasks: server }: { tasks: Task[] }) {
  const router = useRouter();
  const [tasks, setTasks] = useState(server);
  const [, start] = useTransition();

  // Server is source of truth — reconcile after every router.refresh().
  useEffect(() => setTasks(server), [server]);

  const sync = (req: () => Promise<unknown>) =>
    start(async () => {
      await req();
      router.refresh();
    });

  function add(v: NewTaskValues) {
    const dueAt = v.dueAt ? new Date(v.dueAt) : null;
    const temp: Task = {
      id: `temp-${Date.now()}`,
      userId: "",
      title: v.title,
      notes: null,
      status: "open",
      dueAt,
      completedAt: null,
      nagIntervalSec: 900,
      nextNagAt: dueAt,
      lastNagAt: null,
      escalate: !!v.escalate,
      snoozeCount: 0,
      recurrence: (v.recurrence as Task["recurrence"]) ?? "none",
      kind: v.kind ?? "task",
      isPublic: !!v.isPublic,
      graceSec: 0,
      publicAlias: null,
      shamedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setTasks((t) => [...t, temp]); // appears instantly + animates in

    const body: Record<string, unknown> = { title: v.title };
    if (v.dueAt) body.dueAt = new Date(v.dueAt).toISOString();
    if (v.recurrence && v.recurrence !== "none") body.recurrence = v.recurrence;
    if (v.isPublic) body.isPublic = true;
    if (v.escalate) body.escalate = true;
    if (v.kind && v.kind !== "task") body.kind = v.kind;
    sync(() =>
      fetch("/api/tasks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
    );
  }

  const toggle = (task: Task) => {
    const next = task.status === "done" ? "open" : "done";
    setTasks((ts) =>
      ts.map((t) =>
        t.id === task.id
          ? { ...t, status: next, completedAt: next === "done" ? new Date() : null }
          : t,
      ),
    );
    sync(() =>
      fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: next }),
      }),
    );
  };
  const remove = (task: Task) => {
    setTasks((ts) => ts.filter((t) => t.id !== task.id)); // animates out
    sync(() => fetch(`/api/tasks/${task.id}`, { method: "DELETE" }));
  };
  const skip = (task: Task) =>
    sync(() => fetch(`/api/tasks/${task.id}/skip`, { method: "POST" }));
  const rename = (task: Task, title: string) => {
    setTasks((ts) => ts.map((t) => (t.id === task.id ? { ...t, title } : t)));
    sync(() =>
      fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title }),
      }),
    );
  };

  const g = groupTasks(tasks);
  const open =
    g.overdue.length + g.today.length + g.upcoming.length + g.someday.length;

  const handlers = { toggle, remove, skip, rename };

  return (
    <>
      <h1 className="mt-2 mb-6 font-[family-name:var(--font-display)] text-3xl text-ink">
        {open} open
      </h1>
      <AddTaskForm onAdd={add} />
      <div className="mt-8 space-y-7">
        <Section title="Overdue" tasks={g.overdue} tone="warm" {...handlers} />
        <Section title="Today" tasks={g.today} {...handlers} />
        <Section title="Upcoming" tasks={g.upcoming} {...handlers} />
        <Section title="Someday" tasks={g.someday} {...handlers} />
        <Section title="Failed" tasks={g.failed} tone="warm" {...handlers} />
        <Section title="Done" tasks={g.done} muted {...handlers} />
      </div>
      {tasks.length === 0 && (
        <p className="mt-12 text-center text-ink-muted">
          Nothing&apos;s chasing you. Yet. Add a task above.
        </p>
      )}
    </>
  );
}

function Section({
  title,
  tasks,
  tone,
  muted,
  toggle,
  remove,
  skip,
  rename,
}: {
  title: string;
  tasks: GroupedTasks[keyof GroupedTasks];
  tone?: "warm";
  muted?: boolean;
  toggle: (t: Task) => void;
  remove: (t: Task) => void;
  skip: (t: Task) => void;
  rename: (t: Task, title: string) => void;
}) {
  if (tasks.length === 0) return null;
  return (
    <section>
      <Mono
        className={cn(
          "mb-2",
          tone === "warm" && "text-accent-warm",
          muted && "text-ink-muted/50",
        )}
      >
        {title} · {tasks.length}
      </Mono>
      <ul className="space-y-2">
        <AnimatePresence initial={false}>
          {tasks.map((t) => (
            <TaskItem
              key={t.id}
              task={t}
              onToggle={() => toggle(t)}
              onDelete={() => remove(t)}
              onSkip={() => skip(t)}
              onRename={(title) => rename(t, title)}
            />
          ))}
        </AnimatePresence>
      </ul>
    </section>
  );
}
