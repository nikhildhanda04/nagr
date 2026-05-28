"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Select, Label } from "@/components/ui/field";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";

export type NewTaskValues = {
  title: string;
  dueAt?: string;
  recurrence?: string;
  isPublic?: boolean;
  escalate?: boolean;
  kind?: "task" | "reminder";
};

export function AddTaskForm({ onAdd }: { onAdd: (v: NewTaskValues) => void }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [kind, setKind] = useState<"task" | "reminder">("task");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = String(fd.get("title") ?? "").trim();
    if (!title) return;
    onAdd({
      title,
      kind,
      dueAt: String(fd.get("dueAt") ?? "") || undefined,
      recurrence: String(fd.get("recurrence") ?? "none"),
      isPublic: fd.get("isPublic") === "on",
      escalate: fd.get("escalate") === "on",
    });
    formRef.current?.reset();
    setShowOptions(false);
    setKind("task");
  }

  const isReminder = kind === "reminder";

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="rounded-2xl border border-ink/10 bg-white/50 p-3 shadow-sm"
    >
      <div className="mb-2 inline-flex rounded-full border border-ink/15 p-0.5 font-mono text-[10px] uppercase tracking-wider">
        {(["task", "reminder"] as const).map((k) => (
          <button
            type="button"
            key={k}
            onClick={() => setKind(k)}
            className={cn(
              "rounded-full px-3 py-1 transition",
              kind === k ? "bg-ink text-paper" : "text-ink-muted hover:text-ink",
            )}
          >
            {k}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <input
          name="title"
          placeholder={isReminder ? "Remind me to…" : "Add a task…"}
          autoComplete="off"
          required
          onInvalid={(e) => e.currentTarget.setCustomValidity("Add a name")}
          onInput={(e) => e.currentTarget.setCustomValidity("")}
          className="flex-1 bg-transparent px-2 py-1.5 text-ink placeholder:text-ink-muted/50 focus:outline-none"
        />
        <Tooltip label={isReminder ? "When & repeat" : "Due, repeat, public, escalate"}>
          <button
            type="button"
            onClick={() => setShowOptions((o) => !o)}
            className="font-mono text-[10px] uppercase tracking-wider text-ink-muted hover:text-ink"
          >
            options
          </button>
        </Tooltip>
        <Button type="submit">Add</Button>
      </div>

      {showOptions && (
        <div className="mt-3 grid gap-3 border-t border-ink/10 pt-3 sm:grid-cols-2">
          <label className="block">
            <Label>{isReminder ? "When" : "Due"}</Label>
            <Input name="dueAt" type="datetime-local" className="[color-scheme:light]" />
          </label>
          <label className="block">
            <Label>Repeat</Label>
            <Select name="recurrence" defaultValue="none">
              <option value="none">No repeat</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </Select>
          </label>
          {!isReminder && (
            <>
              <label className="flex items-center gap-2 text-sm text-ink">
                <input type="checkbox" name="isPublic" className="accent-accent" />
                Public — shame me to friends if I miss it
              </label>
              <label className="flex items-center gap-2 text-sm text-ink">
                <input type="checkbox" name="escalate" className="accent-accent" />
                Escalate — nag harder the longer it&apos;s overdue
              </label>
            </>
          )}
        </div>
      )}
    </form>
  );
}
