import Link from "next/link";

export function LandingHeader({ authed }: { authed: boolean }) {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-ink/10 bg-paper/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3 md:px-12">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-lg text-ink"
        >
          nagr
        </Link>
        <nav className="flex items-center gap-5">
          <Link
            href="/docs"
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted hover:text-ink"
          >
            Docs
          </Link>
          <Link
            href={authed ? "/dashboard" : "/login"}
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent hover:underline"
          >
            {authed ? "Dashboard" : "Sign in"} →
          </Link>
        </nav>
      </div>
    </header>
  );
}
