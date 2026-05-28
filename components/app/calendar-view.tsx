"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Task, CalendarEvent } from "@/db/schema";
import { cn } from "@/lib/cn";
import { Mono } from "@/components/ui/card";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const sameDay = (a: Date, b: Date) => dayKey(a) === dayKey(b);
const timeOf = (d: Date) =>
  d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

type Item =
  | { id: string; title: string; at: Date; type: "task"; task: Task }
  | { id: string; title: string; at: Date; type: "event" };

type Tone = "reminder" | "overdue" | "done" | "task" | "event";
function toneOf(it: Item, now: Date): Tone {
  if (it.type === "event") return "event";
  const t = it.task;
  if (t.status === "failed") return "overdue";
  if (t.status === "done") return "done";
  if (t.kind === "reminder") return "reminder";
  if (t.dueAt && new Date(t.dueAt) < now) return "overdue";
  return "task";
}
const dotClass: Record<Tone, string> = {
  reminder: "bg-accent",
  overdue: "bg-accent-warm",
  done: "bg-ink/25",
  task: "bg-ink",
  event: "border border-ink/50 bg-transparent",
};

export function CalendarView({
  tasks: serverTasks,
  events,
}: {
  tasks: Task[];
  events: CalendarEvent[];
}) {
  const router = useRouter();
  const [tasks, setTasks] = useState(serverTasks);
  const [, start] = useTransition();
  useEffect(() => setTasks(serverTasks), [serverTasks]);

  const now = new Date();
  const [viewMonth, setViewMonth] = useState(
    () => new Date(now.getFullYear(), now.getMonth(), 1),
  );
  const [selected, setSelected] = useState<Date | null>(null);

  const byDay = useMemo(() => {
    const items: Item[] = [];
    for (const t of tasks)
      if (t.dueAt)
        items.push({ id: t.id, title: t.title, at: new Date(t.dueAt), type: "task", task: t });
    for (const e of events)
      items.push({ id: e.id, title: e.title, at: new Date(e.startAt), type: "event" });

    const map = new Map<string, Item[]>();
    for (const it of items) {
      const k = dayKey(it.at);
      (map.get(k) ?? map.set(k, []).get(k)!).push(it);
    }
    for (const list of map.values())
      list.sort((a, b) => a.at.getTime() - b.at.getTime());
    return map;
  }, [tasks, events]);

  const gridStart = new Date(viewMonth);
  gridStart.setDate(1 - viewMonth.getDay());
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });

  const shiftMonth = (delta: number) =>
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + delta, 1));

  const toggle = (t: Task) => {
    const next = t.status === "done" ? "open" : "done";
    setTasks((ts) => ts.map((x) => (x.id === t.id ? { ...x, status: next } : x)));
    start(async () => {
      await fetch(`/api/tasks/${t.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      router.refresh();
    });
  };

  const selectedItems = selected ? (byDay.get(dayKey(selected)) ?? []) : [];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-ink">
          {MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
        </h2>
        <div className="flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-ink-muted">
          <button onClick={() => shiftMonth(-1)} className="px-2 py-1 hover:text-ink" aria-label="Previous month">←</button>
          <button
            onClick={() => {
              setViewMonth(new Date(now.getFullYear(), now.getMonth(), 1));
              setSelected(null);
            }}
            className="px-2 py-1 hover:text-ink"
          >
            Today
          </button>
          <button onClick={() => shiftMonth(1)} className="px-2 py-1 hover:text-ink" aria-label="Next month">→</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-2xl border border-ink/10 bg-ink/10">
        {WEEKDAYS.map((w, i) => (
          <div key={i} className="bg-paper py-2 text-center font-mono text-[10px] uppercase tracking-wider text-ink-muted/60">
            {w}
          </div>
        ))}
        {cells.map((d) => {
          const items = byDay.get(dayKey(d)) ?? [];
          const inMonth = d.getMonth() === viewMonth.getMonth();
          const isToday = sameDay(d, now);
          const isSel = selected && sameDay(d, selected);
          return (
            <button
              key={d.toISOString()}
              onClick={() => setSelected(d)}
              className={cn(
                "min-h-[76px] bg-paper p-1.5 text-left align-top transition hover:bg-ink/[0.03]",
                !inMonth && "opacity-40",
                isSel && "ring-1 ring-inset ring-accent",
              )}
            >
              <span
                className={cn(
                  "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs",
                  isToday ? "bg-accent text-white" : "text-ink",
                )}
              >
                {d.getDate()}
              </span>
              <div className="mt-1 space-y-0.5">
                {items.slice(0, 3).map((it) => (
                  <div key={it.id} className="flex items-center gap-1">
                    <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotClass[toneOf(it, now)])} />
                    <span
                      className={cn(
                        "truncate text-[11px] text-ink",
                        it.type === "task" && it.task.status === "done" && "text-ink-muted line-through",
                      )}
                    >
                      {it.title}
                    </span>
                  </div>
                ))}
                {items.length > 3 && (
                  <span className="font-mono text-[10px] text-ink-muted/60">
                    +{items.length - 3} more
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-4 font-mono text-[10px] uppercase tracking-wider text-ink-muted/70">
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-ink" /> task</span>
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> reminder</span>
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-accent-warm" /> overdue</span>
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full border border-ink/50" /> event</span>
      </div>

      {selected && (
        <div className="mt-6">
          <Mono>
            {selected.toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </Mono>
          {selectedItems.length === 0 ? (
            <p className="mt-2 text-sm text-ink-muted">Nothing scheduled.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {selectedItems.map((it) => (
                <li
                  key={it.id}
                  className="flex items-center gap-3 rounded-xl border border-ink/10 bg-white/40 px-4 py-2.5"
                >
                  {it.type === "task" ? (
                    <button
                      onClick={() => toggle(it.task)}
                      disabled={it.task.status === "failed"}
                      aria-label="Toggle done"
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] active:scale-90",
                        it.task.status === "done"
                          ? "border-accent bg-accent text-white"
                          : "border-ink/30 hover:border-accent",
                      )}
                    >
                      {it.task.status === "done" ? "✓" : ""}
                    </button>
                  ) : (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center text-[11px]">
                      📅
                    </span>
                  )}
                  <span
                    className={cn(
                      "flex-1 text-[15px] text-ink",
                      it.type === "task" && it.task.status === "done" && "text-ink-muted line-through",
                    )}
                  >
                    {it.title}
                  </span>
                  <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-ink-muted/70">
                    {it.type === "task" && it.task.kind === "reminder" && "🔔 "}
                    {timeOf(it.at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
