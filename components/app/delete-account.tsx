"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, Mono } from "@/components/ui/card";

export function DeleteAccount() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  async function del() {
    setPending(true);
    await fetch("/api/me", { method: "DELETE" });
    await authClient.signOut().catch(() => {});
    router.push("/");
    router.refresh();
  }

  return (
    <Card className="border-accent-warm/30">
      <Mono className="text-accent-warm">Danger zone</Mono>
      <p className="mt-2 text-ink-muted">
        Delete your account and all data — tasks, friends, Telegram link, shame
        history. This cannot be undone.
      </p>
      {confirming ? (
        <div className="mt-3 flex gap-3">
          <Button variant="danger" onClick={del} disabled={pending}>
            {pending ? "Deleting…" : "Yes, delete everything"}
          </Button>
          <Button variant="ghost" onClick={() => setConfirming(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <div className="mt-3">
          <Button variant="danger" onClick={() => setConfirming(true)}>
            Delete account
          </Button>
        </div>
      )}
    </Card>
  );
}
