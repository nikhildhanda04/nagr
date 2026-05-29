import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/dal";
import { SignInButton } from "@/components/app/sign-in-button";
import { Mono } from "@/components/ui/card";

export default async function LoginPage() {
  const session = await getSession();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center px-6 text-center">
      <Mono>nagr</Mono>
      <h1 className="mt-5 font-[family-name:var(--font-display)] text-4xl leading-tight text-ink">
        Sign in
      </h1>
      <p className="mt-3 max-w-xs text-ink-muted">
        Todos that nag you in Telegram until they&apos;re done.
      </p>
      <div className="mt-8">
        <SignInButton />
      </div>
      <p className="mt-10 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted/60">
        <Link href="/" className="hover:text-ink">
          ← Home
        </Link>
        <span className="mx-2">·</span>
        <Link href="/docs" className="hover:text-ink">
          How it works
        </Link>
      </p>
    </main>
  );
}
