"use client";

import Link from "next/link";
import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { getTelegramBotUrl } from "@/lib/telegram-url";
import { useReducedMotion } from "../hooks/useReducedMotion";

export function TelegramCTA({ authed }: { authed: boolean }) {
  const reducedMotion = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20%" });
  const botUrl = getTelegramBotUrl();
  const href = authed ? "/dashboard" : "/login";

  return (
    <section
      ref={ref}
      className="flex min-h-[80svh] flex-col items-center justify-center px-6 py-24 text-center md:px-12"
      aria-label="Get started"
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted">
        Start here
      </p>
      <h2 className="mt-6 max-w-lg font-[family-name:var(--font-display)] text-4xl leading-tight text-ink md:text-5xl">
        {authed ? "Your tasks are waiting." : "Start in under a minute."}
      </h2>
      <p className="mt-4 max-w-md text-lg text-ink-muted">
        Sign in with Google, add a task, connect Telegram — the bot takes it
        from there.
      </p>

      <div className="relative mt-12">
        <Link
          href={href}
          className="group relative inline-block font-[family-name:var(--font-display)] text-2xl text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-paper md:text-3xl"
        >
          {authed ? "Open dashboard" : "Get started"}
          <motion.span
            className="absolute -bottom-1 left-0 h-px bg-accent"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: inView || reducedMotion ? 1 : 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{ originX: 0, width: "100%" }}
          />
        </Link>
      </div>

      {botUrl && (
        <p className="mt-8 max-w-sm text-sm text-ink-muted">
          or{" "}
          <a
            href={botUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            open the bot directly
          </a>{" "}
          — per-account linking happens after you sign in.
        </p>
      )}
    </section>
  );
}
