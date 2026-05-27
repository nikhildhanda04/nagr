"use client";

import { SmoothScroll } from "./SmoothScroll";
import { OpeningSpread } from "./sections/OpeningSpread";
import { PinnedThread } from "./sections/PinnedThread";
import { MarginNotes } from "./sections/MarginNotes";
import { DueTape } from "./sections/DueTape";
import { ContrastFold } from "./sections/ContrastFold";
import { TelegramCTA } from "./sections/TelegramCTA";

export function LandingPage() {
  return (
    <SmoothScroll>
      <div className="paper-grain">
        <main>
          <OpeningSpread />
          <PinnedThread />
          <MarginNotes />
          <DueTape />
          <ContrastFold />
          <TelegramCTA />
        </main>
        <footer className="border-t border-ink/10 px-6 py-8 text-center font-mono text-xs text-ink-muted md:px-12">
          whatstodo · reminders in Telegram
        </footer>
      </div>
    </SmoothScroll>
  );
}
