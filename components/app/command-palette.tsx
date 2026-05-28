"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const NAV: [string, string][] = [
  ["/dashboard", "Tasks"],
  ["/friends", "Friends"],
  ["/shame", "Wall"],
  ["/settings", "Settings"],
  ["/docs", "Docs"],
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [, start] = useTransition();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  if (!open) return null;

  const nav = NAV.filter(([, l]) => l.toLowerCase().includes(q.toLowerCase()));
  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };
  const addTask = () => {
    const title = q.trim();
    if (!title) return;
    start(async () => {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title }),
      });
      setOpen(false);
      router.push("/dashboard");
      router.refresh();
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink/30 px-4 pt-[18vh]"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-ink/15 bg-paper shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (q.trim()) addTask();
              else if (nav[0]) go(nav[0][0]);
            }
          }}
          placeholder="Add a task, or jump to…"
          className="w-full border-b border-ink/10 bg-transparent px-4 py-3 text-ink placeholder:text-ink-muted/50 focus:outline-none"
        />
        <ul className="max-h-72 overflow-auto p-2">
          {q.trim() && (
            <li>
              <button
                onClick={addTask}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-ink hover:bg-ink/5"
              >
                <span>Add task: “{q.trim()}”</span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                  enter
                </span>
              </button>
            </li>
          )}
          {nav.map(([href, label]) => (
            <li key={href}>
              <button
                onClick={() => go(href)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-ink hover:bg-ink/5"
              >
                <span>{label}</span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-ink-muted/50">
                  {href}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
