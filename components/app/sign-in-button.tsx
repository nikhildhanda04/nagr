"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function SignInButton({ callbackURL = "/dashboard" }: { callbackURL?: string }) {
  const [pending, setPending] = useState(false);
  return (
    <Button
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await authClient.signIn.social({ provider: "google", callbackURL });
      }}
    >
      {pending ? "Redirecting…" : "Continue with Google"}
    </Button>
  );
}
