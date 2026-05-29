"use client";

import { motion, useTransform } from "motion/react";
import { ChatBubble } from "../ui/ChatBubble";
import { useSectionScroll } from "../hooks/useSectionScroll";
import { useReducedMotion } from "../hooks/useReducedMotion";

export function ContrastFold() {
  const reducedMotion = useReducedMotion();
  const { ref, scrollYProgress } = useSectionScroll({
    offset: ["start start", "end end"],
  });

  const leftGray = useTransform(
    scrollYProgress,
    [0.2, 0.7],
    reducedMotion ? [0, 1] : [0, 1],
  );
  const leftOpacity = useTransform(
    scrollYProgress,
    [0.2, 0.7],
    reducedMotion ? [1, 0.55] : [1, 0.45],
  );
  const leftFilter = useTransform(leftGray, (g) => `grayscale(${g})`);

  return (
    <section
      ref={ref}
      className="relative"
      style={{ height: "min(200vh, 1800px)" }}
      aria-label="Contrast with silent apps"
    >
      <div className="sticky top-0 flex h-[100svh] items-center px-6 md:px-12 lg:px-20">
        <div className="mx-auto grid w-full max-w-6xl gap-0 md:grid-cols-2">
          <motion.div
            className="flex flex-col justify-center border-b border-ink/10 py-12 md:border-b-0 md:border-r md:py-0 md:pr-12"
            style={{
              filter: leftFilter,
              opacity: leftOpacity,
            }}
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted">
              Silent apps
            </p>
            <p className="mt-6 font-[family-name:var(--font-display)] text-2xl leading-snug text-ink md:text-3xl">
              They send a ping. You swipe it away. The task forgets you
              existed.
            </p>
            <div className="mt-8 max-w-xs opacity-50">
              <div className="rounded-lg border border-ink/10 bg-zinc-100 p-4 text-sm text-ink-muted">
                Task due · 3:00 PM
                <div className="mt-2 h-2 w-3/4 rounded bg-ink/10" />
              </div>
            </div>
          </motion.div>

          <div className="relative flex flex-col justify-center py-12 md:pl-12 md:py-0">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted">
              nagr
            </p>
            <p className="mt-6 font-[family-name:var(--font-display)] text-2xl leading-snug text-ink md:text-3xl">
              It waits in the chat you actually open—and keeps asking, politely,
              until you&apos;re done.
            </p>
            <div className="relative mt-8 max-w-xs">
              {!reducedMotion && (
                <span
                  className="ping-ring pointer-events-none absolute -inset-2 rounded-2xl border border-accent/30"
                  aria-hidden
                />
              )}
              <div className="relative rounded-2xl bg-white p-4 shadow-md">
                <ChatBubble variant="in">
                  Still waiting on <strong>Call dentist</strong>.
                </ChatBubble>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
