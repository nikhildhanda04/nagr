"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";

const rows: { title: string; due: string; done?: boolean }[] = [
  { title: "Renew passport", due: "in 2h" },
  { title: "Water the plants", due: "in 1d" },
  { title: "Submit expenses", due: "done", done: true },
];

export function ProductGlimpse() {
  const reducedMotion = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });

  return (
    <section ref={ref} className="px-6 py-24 md:px-12 lg:px-20" aria-label="The app">
      <div className="mx-auto max-w-5xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted">
          The app
        </p>
        <h2 className="mt-3 max-w-xl font-[family-name:var(--font-display)] text-3xl leading-tight text-ink md:text-4xl">
          A quiet list on the web. A loud bot in your pocket.
        </h2>

        <motion.div
          className="mt-10 overflow-hidden rounded-2xl border border-ink/15 bg-white/70 shadow-xl"
          initial={reducedMotion ? false : { opacity: 0, y: 24 }}
          animate={inView || reducedMotion ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-center gap-1.5 border-b border-ink/10 px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
            <span className="ml-3 font-mono text-[11px] text-ink-muted/60">
              nagr / dashboard
            </span>
          </div>

          <div className="p-5">
            <div className="rounded-xl border border-accent-warm/30 bg-accent-warm/5 p-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="ping-ring absolute inline-flex h-full w-full rounded-full bg-accent-warm" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-warm" />
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent-warm">
                  Nagging now · 2
                </span>
              </div>
              <div className="mt-2 flex justify-between text-sm text-ink">
                <span>Call dentist</span>
                <span className="font-mono text-[11px] text-ink-muted">next ping 4m 12s</span>
              </div>
              <div className="mt-1 flex justify-between text-sm text-ink">
                <span>Send invoice to Acme</span>
                <span className="font-mono text-[11px] text-ink-muted">pinging…</span>
              </div>
            </div>

            <ul className="mt-4 space-y-2">
              {rows.map((r) => (
                <li
                  key={r.title}
                  className="flex items-center gap-3 rounded-xl border border-ink/10 bg-white/60 px-4 py-3"
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full border text-[11px] ${
                      r.done
                        ? "border-accent bg-accent text-white"
                        : "border-ink/30"
                    }`}
                  >
                    {r.done ? "✓" : ""}
                  </span>
                  <span
                    className={`flex-1 text-[15px] ${r.done ? "text-ink-muted line-through" : "text-ink"}`}
                  >
                    {r.title}
                  </span>
                  {!r.done && (
                    <span className="font-mono text-[10px] uppercase tracking-wider text-ink-muted/70">
                      {r.due}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
