"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, Mono } from "@/components/ui/card";

export function TelegramConnect({
  linked,
  username,
}: {
  linked: boolean;
  username: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [waiting, setWaiting] = useState(false);

  async function connect() {
    setBusy(true);
    const res = await fetch("/api/telegram/link", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (data.deepLink) window.open(data.deepLink, "_blank", "noopener");
    setBusy(false);
    setWaiting(true);
    pollUntilLinked(0);
  }

  // Auto-confirm: process updates (no-op in webhook mode) + check status,
  // every 3s for ~2 min, so the card flips without a manual refresh.
  function pollUntilLinked(attempt: number) {
    if (attempt > 40) {
      setWaiting(false);
      return;
    }
    setTimeout(async () => {
      await fetch("/api/telegram/poll", { method: "POST" }).catch(() => {});
      const s = await fetch("/api/telegram/link")
        .then((r) => r.json())
        .catch(() => null);
      if (s?.linked) {
        setWaiting(false);
        router.refresh();
        return;
      }
      pollUntilLinked(attempt + 1);
    }, 3000);
  }

  async function unlink() {
    setBusy(true);
    await fetch("/api/telegram/link", { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  return (
    <Card>
      <Mono>Telegram</Mono>
      {linked ? (
        <>
          <p className="mt-2 text-ink">
            Connected{username ? ` as @${username}` : ""} ✓ — the bot nags you
            here.
          </p>
          <div className="mt-3">
            <Button variant="secondary" onClick={unlink} disabled={busy}>
              Disconnect
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="mt-2 text-ink-muted">
            Connect Telegram so the bot can remind and nag you.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <Button onClick={connect} disabled={busy || waiting}>
              {waiting ? "Waiting for Start…" : "Connect Telegram"}
            </Button>
            {waiting && (
              <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-ink-muted">
                <span className="relative flex h-2 w-2">
                  <span className="ping-ring absolute inline-flex h-full w-full rounded-full bg-accent" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                </span>
                press Start in Telegram
              </span>
            )}
          </div>
        </>
      )}
    </Card>
  );
}
