"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await authClient.signOut();
        router.push("/login");
        router.refresh();
      }}
      className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted hover:text-ink"
    >
      Sign out
    </button>
  );
}
