"use client";

import { useState } from "react";
import { motion } from "motion/react";
import type { Task } from "@/db/schema";
import { cn } from "@/lib/cn";
import { relativeDue } from "@/lib/group-tasks";
import { Tooltip } from "@/components/ui/tooltip";

export function TaskItem({
  task,
  onToggle,
  onDelete,
  onSkip,
  onRename,
}: {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
  onSkip: () => void;
  onRename: (title: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const done = task.status === "done";
  const failed = task.status === "failed";
  const rel = task.dueAt ? relativeDue(task.dueAt) : null;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginTop: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="group flex items-start gap-3 overflow-hidden rounded-xl border border-ink/10 bg-white/40 px-4 py-3"
    >
      <Tooltip
        className="mt-0.5 shrink-0"
        label={failed ? "Failed — locked" : done ? "Mark as open" : "Mark as done"}
      >
        <button
          onClick={onToggle}
          disabled={failed}
          aria-label={done ? "Mark open" : "Mark done"}
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-full border text-[11px] transition active:scale-90",
            done
              ? "border-accent bg-accent text-white"
              : failed
                ? "border-accent-warm/50 text-accent-warm"
                : "border-ink/30 hover:border-accent",
          )}
        >
          {done ? "✓" : failed ? "✕" : ""}
        </button>
      </Tooltip>

      <div className="min-w-0 flex-1">
        {editing ? (
          <input
            autoFocus
            defaultValue={task.title}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v && v !== task.title) onRename(v);
              setEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              if (e.key === "Escape") setEditing(false);
            }}
            className="w-full border-b border-accent bg-transparent text-[15px] text-ink focus:outline-none"
          />
        ) : (
          <p
            onClick={() => !done && !failed && setEditing(true)}
            className={cn(
              "text-[15px] leading-snug text-ink",
              !done && !failed && "cursor-text",
              done && "text-ink-muted line-through",
              failed && "text-accent-warm",
            )}
          >
            {task.title}
          </p>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-wider text-ink-muted/70">
          {rel && (
            <span className={cn(rel.overdue && "text-accent-warm", rel.soon && "text-ink")}>
              {rel.label}
            </span>
          )}
          {task.kind === "reminder" && (
            <span className="text-accent">🔔 reminder</span>
          )}
          {task.recurrence !== "none" && <span>↻ {task.recurrence}</span>}
          {task.isPublic && <span className="text-accent">public</span>}
          {task.escalate && <span>escalating</span>}
          {task.snoozeCount > 0 && <span>snoozed {task.snoozeCount}×</span>}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
        {task.recurrence !== "none" && !done && !failed && (
          <Tooltip label="Skip to next occurrence">
            <button
              onClick={onSkip}
              className="font-mono text-[10px] uppercase tracking-wider text-ink-muted hover:text-ink"
            >
              skip
            </button>
          </Tooltip>
        )}
        <Tooltip label="Delete">
          <button
            onClick={onDelete}
            aria-label="Delete task"
            className="text-ink-muted/60 hover:text-accent-warm"
          >
            ✕
          </button>
        </Tooltip>
      </div>
    </motion.li>
  );
}
