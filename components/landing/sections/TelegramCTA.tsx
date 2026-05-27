"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { getTelegramBotUrl } from "@/lib/telegram-url";
import { useReducedMotion } from "../hooks/useReducedMotion";

export function TelegramCTA() {
  const reducedMotion = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20%" });
  const botUrl = getTelegramBotUrl();

  return (
    <section
      ref={ref}
      className="flex min-h-[80svh] flex-col items-center justify-center px-6 py-24 text-center md:px-12"
      aria-label="Get started on Telegram"
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted">
        Start here
      </p>
      <h2 className="mt-6 max-w-lg font-[family-name:var(--font-display)] text-4xl leading-tight text-ink md:text-5xl">
        Open Telegram. I&apos;ll meet you there.
      </h2>
      <p className="mt-4 max-w-md text-lg text-ink-muted">
        Link your chat, add a task, and let the bot nag you when it&apos;s due.
      </p>

      <div className="relative mt-12">
        {botUrl ? (
          <a
            href={botUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-block font-[family-name:var(--font-display)] text-2xl text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-paper md:text-3xl"
          >
            Open Telegram
            <motion.span
              className="absolute -bottom-1 left-0 h-px bg-accent"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: inView || reducedMotion ? 1 : 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              style={{ originX: 0, width: "100%" }}
            />
          </a>
        ) : (
          <p className="text-ink-muted">
            Set{" "}
            <code className="font-mono text-sm">NEXT_PUBLIC_TELEGRAM_BOT_USERNAME</code>{" "}
            to enable the link.
          </p>
        )}
      </div>

      <p className="mt-8 max-w-sm text-sm text-ink-muted">
        Per-account linking happens inside the app once you sign in. This link
        opens the public bot.
      </p>
    </section>
  );
}
