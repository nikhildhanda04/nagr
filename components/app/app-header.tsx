"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { SignOutButton } from "./sign-out-button";

const links = [
  { href: "/dashboard", label: "Tasks" },
  { href: "/calendar", label: "Calendar" },
  { href: "/friends", label: "Friends" },
  { href: "/shame", label: "Wall" },
  { href: "/settings", label: "Settings" },
  { href: "/docs", label: "Docs" },
];

export function AppHeader({ email }: { email: string }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <>
      {links.map((l) => {
        const active = pathname === l.href || pathname.startsWith(l.href + "/");
        return (
          <Link
            key={l.href}
            href={l.href}
            onClick={onClick}
            className={cn(
              "font-mono text-[11px] uppercase tracking-[0.18em] transition-colors",
              active ? "text-ink" : "text-ink-muted/70 hover:text-ink",
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/85 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-3">
        <Link
          href="/dashboard"
          className="font-[family-name:var(--font-display)] text-lg text-ink"
        >
          whatstodo
        </Link>

        <nav className="hidden items-center gap-4 sm:flex">
          <NavLinks />
        </nav>
        <div className="hidden items-center gap-3 sm:flex">
          <span className="max-w-[14ch] truncate font-mono text-[11px] text-ink-muted/60">
            {email}
          </span>
          <SignOutButton />
        </div>

        <button
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Menu"
          className="text-ink-muted hover:text-ink sm:hidden"
        >
          <span className="text-xl leading-none">{menuOpen ? "✕" : "☰"}</span>
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-ink/10 px-5 py-4 sm:hidden">
          <nav className="flex flex-col gap-3">
            <NavLinks onClick={() => setMenuOpen(false)} />
          </nav>
          <div className="mt-4 flex items-center justify-between border-t border-ink/10 pt-3">
            <span className="max-w-[20ch] truncate font-mono text-[11px] text-ink-muted/60">
              {email}
            </span>
            <SignOutButton />
          </div>
        </div>
      )}
    </header>
  );
}
