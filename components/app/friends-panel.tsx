"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Mono } from "@/components/ui/card";

type Entry = { friendshipId: string; id: string; name: string; email: string };

const RESULT_MSG: Record<string, string> = {
  requested: "Request sent.",
  accepted: "You're now friends.",
  already_friends: "Already friends.",
  already_pending: "Request already pending.",
  self: "That's your own email.",
  not_found: "No whatstodo user with that email.",
};

export function FriendsPanel({
  friends,
  incoming,
  outgoing,
}: {
  friends: Entry[];
  incoming: Entry[];
  outgoing: Entry[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = String(new FormData(form).get("email") ?? "").trim();
    if (!email) return;
    start(async () => {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      setMsg(RESULT_MSG[data.result] ?? "Done.");
      form.reset();
      router.refresh();
    });
  }
  const accept = (id: string) =>
    start(async () => {
      await fetch(`/api/friends/${id}/accept`, { method: "POST" });
      router.refresh();
    });
  const remove = (id: string) =>
    start(async () => {
      await fetch(`/api/friends/${id}`, { method: "DELETE" });
      router.refresh();
    });

  return (
    <div className="space-y-8">
      <form onSubmit={add} className="rounded-2xl border border-ink/10 bg-white/50 p-3 shadow-sm">
        <div className="flex items-center gap-2">
          <input
            name="email"
            type="email"
            placeholder="friend@email.com"
            className="flex-1 bg-transparent px-2 py-1.5 text-ink placeholder:text-ink-muted/50 focus:outline-none"
          />
          <Button type="submit" disabled={pending}>
            Add friend
          </Button>
        </div>
        {msg && <p className="mt-2 px-2 text-sm text-ink-muted">{msg}</p>}
      </form>

      <Group title="Requests received" entries={incoming} empty="No pending requests.">
        {(e) => (
          <div className="flex gap-3">
            <button
              onClick={() => accept(e.friendshipId)}
              disabled={pending}
              className="font-mono text-[11px] uppercase tracking-wider text-accent hover:underline"
            >
              Accept
            </button>
            <button
              onClick={() => remove(e.friendshipId)}
              disabled={pending}
              className="font-mono text-[11px] uppercase tracking-wider text-ink-muted hover:text-ink"
            >
              Decline
            </button>
          </div>
        )}
      </Group>

      <Group title="Requests sent" entries={outgoing} empty="">
        {(e) => (
          <button
            onClick={() => remove(e.friendshipId)}
            disabled={pending}
            className="font-mono text-[11px] uppercase tracking-wider text-ink-muted hover:text-ink"
          >
            Cancel
          </button>
        )}
      </Group>

      <Group title="Friends" entries={friends} empty="No friends yet. Add one above.">
        {(e) => (
          <button
            onClick={() => remove(e.friendshipId)}
            disabled={pending}
            className="font-mono text-[11px] uppercase tracking-wider text-ink-muted hover:text-accent-warm"
          >
            Remove
          </button>
        )}
      </Group>
    </div>
  );
}

function Group({
  title,
  entries,
  empty,
  children,
}: {
  title: string;
  entries: Entry[];
  empty: string;
  children: (e: Entry) => React.ReactNode;
}) {
  if (entries.length === 0 && !empty) return null;
  return (
    <section>
      <Mono className="mb-2">
        {title} · {entries.length}
      </Mono>
      {entries.length === 0 ? (
        <p className="text-sm text-ink-muted">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {entries.map((e) => (
            <li
              key={e.friendshipId}
              className="flex items-center justify-between rounded-xl border border-ink/10 bg-white/40 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-[15px] text-ink">{e.name}</p>
                <p className="truncate font-mono text-[11px] text-ink-muted/70">
                  {e.email}
                </p>
              </div>
              {children(e)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
