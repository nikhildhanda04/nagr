"use client";

import Link from "next/link";
import { SmoothScroll } from "./SmoothScroll";
import { LandingHeader } from "./LandingHeader";
import { FloatingCTA } from "./FloatingCTA";
import { OpeningSpread } from "./sections/OpeningSpread";
import { PinnedThread } from "./sections/PinnedThread";
import { ProductGlimpse } from "./sections/ProductGlimpse";
import { MarginNotes } from "./sections/MarginNotes";
import { DueTape } from "./sections/DueTape";
import { ContrastFold } from "./sections/ContrastFold";
import { ShameFold } from "./sections/ShameFold";
import { TelegramCTA } from "./sections/TelegramCTA";

export function LandingPage({ authed }: { authed: boolean }) {
  return (
    <SmoothScroll>
      <div className="paper-grain">
        <LandingHeader authed={authed} />
        <main>
          <OpeningSpread />
          <PinnedThread />
          <ProductGlimpse />
          <MarginNotes />
          <DueTape />
          <ContrastFold />
          <ShameFold />
          <TelegramCTA authed={authed} />
        </main>
        <footer className="border-t border-ink/10 px-6 py-8 md:px-12">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
            <span className="font-mono text-xs text-ink-muted">
              nagr · reminders in Telegram
            </span>
            <nav className="flex gap-5 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">
              <Link href="/docs" className="hover:text-ink">
                Docs
              </Link>
              <Link href={authed ? "/dashboard" : "/login"} className="hover:text-ink">
                {authed ? "Dashboard" : "Sign in"}
              </Link>
            </nav>
          </div>
        </footer>
        <FloatingCTA authed={authed} />
      </div>
    </SmoothScroll>
  );
}
