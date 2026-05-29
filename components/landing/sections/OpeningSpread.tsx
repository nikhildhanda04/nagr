"use client";

import { motion } from "motion/react";
import { useReducedMotion } from "../hooks/useReducedMotion";

const headlineLines = [
  "The todo list",
  "that reaches you.",
];

const lineVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.15 + i * 0.12,
      duration: 0.65,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

export function OpeningSpread() {
  const reducedMotion = useReducedMotion();

  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden px-6 py-24 md:px-12 lg:px-20">
      <div
        className="pointer-events-none absolute left-[12%] top-0 h-px w-px overflow-hidden md:left-[18%]"
        aria-hidden
      >
        <div
          className={`h-[120vh] w-px bg-ink/15 ${reducedMotion ? "" : "due-line-animate"}`}
        />
      </div>

      <div className="mx-auto grid w-full max-w-6xl gap-12 md:grid-cols-[1.4fr_0.6fr] md:items-end">
        <div className="relative">
          <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.25em] text-ink-muted">
            nagr
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-[clamp(2.75rem,8vw,5.5rem)] font-medium leading-[1.05] tracking-tight text-ink">
            {headlineLines.map((line, i) => (
              <motion.span
                key={line}
                className="block"
                custom={i}
                initial={reducedMotion ? "visible" : "hidden"}
                animate="visible"
                variants={lineVariants}
              >
                {line}
              </motion.span>
            ))}
          </h1>
        </div>

        <motion.blockquote
          className="border-l border-ink/20 pl-6 text-lg leading-relaxed text-ink-muted md:text-xl"
          initial={reducedMotion ? false : { opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.55, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          Reminders that don&apos;t stay on the page—they follow you into
          Telegram when something&apos;s due.
        </motion.blockquote>
      </div>
    </section>
  );
}
