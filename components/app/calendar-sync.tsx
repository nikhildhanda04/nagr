"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, Mono } from "@/components/ui/card";

export function CalendarSync({
  enabled,
  lastSyncAt,
}: {
  enabled: boolean;
  lastSyncAt: string | null;
}) {
  const router = useRouter();
  const [on, setOn] = useState(enabled);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  async function syncNow() {
    setMsg(null);
    const res = await fetch("/api/calendar/sync", { method: "POST" });
    if (res.ok) {
      const d = await res.json();
      setMsg(`Synced ${d.count} event${d.count === 1 ? "" : "s"}.`);
    } else if (res.status === 403) {
      setMsg("Calendar access not granted — sign out and back in to allow it.");
    } else {
      setMsg("Sync failed. Try again.");
    }
    router.refresh();
  }

  function toggle(next: boolean) {
    setOn(next);
    start(async () => {
      await fetch("/api/me", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ googleCalendarSync: next }),
      });
      if (next) await syncNow();
      else router.refresh();
    });
  }

  return (
    <Card>
      <Mono>Google Calendar</Mono>
      <label className="mt-3 flex items-start gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={on}
          onChange={(e) => toggle(e.target.checked)}
          className="mt-1 accent-accent"
        />
        Sync my Google Calendar — events appear in your calendar and ping you
        before they start.
      </label>
      {on && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => start(syncNow)}
            disabled={pending}
          >
            Sync now
          </Button>
          {lastSyncAt && (
            <span className="font-mono text-[11px] text-ink-muted">
              last synced {new Date(lastSyncAt).toLocaleString()}
            </span>
          )}
        </div>
      )}
      {msg && <p className="mt-2 text-sm text-ink-muted">{msg}</p>}
      <p className="mt-2 text-xs text-ink-muted">
        Read-only — we never change your calendar.
      </p>
    </Card>
  );
}
