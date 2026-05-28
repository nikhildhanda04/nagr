"use client";

import { useEffect, useState } from "react";
import { countdown } from "@/lib/group-tasks";
import { Tooltip } from "@/components/ui/tooltip";

type Nag = { id: string; title: string; nextNagAt: Date };

export function NaggingStrip({ tasks }: { tasks: Nag[] }) {
  const [, tick] = useState(0);

  // Re-render every second so the countdowns stay live.
  useEffect(() => {
    if (tasks.length === 0) return;
    const i = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(i);
  }, [tasks.length]);

  if (tasks.length === 0) return null;

  return (
    <div className="mt-4 rounded-2xl border border-accent-warm/30 bg-accent-warm/5 p-4">
      <div className="flex items-center gap-2">
        <Tooltip label="The bot is pinging these now">
          <span className="relative flex h-2 w-2">
            <span className="ping-ring absolute inline-flex h-full w-full rounded-full bg-accent-warm" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-warm" />
          </span>
        </Tooltip>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent-warm">
          Nagging now · {tasks.length}
        </p>
      </div>
      <ul className="mt-3 space-y-1.5">
        {tasks.map((t) => {
          const due = new Date(t.nextNagAt).getTime() - Date.now();
          return (
            <li key={t.id} className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate text-[15px] text-ink">{t.title}</span>
              <span className="shrink-0 font-mono text-[11px] text-ink-muted">
                {due <= 0 ? "pinging…" : `next ping ${countdown(t.nextNagAt)}`}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
