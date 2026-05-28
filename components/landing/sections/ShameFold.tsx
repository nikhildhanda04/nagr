"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { ChatBubble } from "../ui/ChatBubble";
import { useReducedMotion } from "../hooks/useReducedMotion";

export function ShameFold() {
  const reducedMotion = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });

  return (
    <section
      ref={ref}
      className="px-6 py-28 md:px-12 lg:px-20"
      aria-label="Shame mode"
    >
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-2 md:items-center">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent-warm">
            Shame mode
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl leading-tight text-ink md:text-4xl">
            Make a task public. Miss it, and your friends find out.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ink-muted">
            Some things need stakes. Mark a task public, add a few friends, and
            if you blow past the deadline the bot tells them — and pins it to
            your Wall of Shame.
          </p>
          <ul className="mt-6 space-y-2 font-mono text-[11px] uppercase tracking-wider text-ink-muted">
            <li>· You opt in, one task at a time</li>
            <li>· One miss, one blast — never spam</li>
            <li>· Comebacks welcome</li>
          </ul>
        </div>

        <motion.div
          className="space-y-3"
          initial={reducedMotion ? false : { opacity: 0, x: 20 }}
          animate={inView || reducedMotion ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-center font-mono text-xs text-ink-muted">
            Telegram · to your friends
          </p>
          <ChatBubble variant="in">
            <span className="text-accent-warm">
              🔴 <strong>Nikhil</strong> failed: Gym at 6pm
            </span>
          </ChatBubble>
          <div className="rounded-2xl border border-ink/10 bg-white/60 p-4 shadow-sm">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent-warm">
              Wall of Shame
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-ink">
              <li>🔴 <strong>Nikhil</strong> failed: Gym at 6pm</li>
              <li>🔴 <strong>Ada</strong> failed: Ship the deck</li>
              <li>🔴 <strong>You</strong> failed: Call mom</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
