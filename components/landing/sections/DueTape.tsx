"use client";

import { motion, useTransform } from "motion/react";
import { useSectionScroll } from "../hooks/useSectionScroll";
import { useReducedMotion } from "../hooks/useReducedMotion";

const tapeItems = [
  { title: "Renew passport", date: "Mar 12" },
  { title: "Send invoice to Acme", date: "Mar 12" },
  { title: "Call dentist", date: "Mar 12" },
  { title: "Buy birthday gift", date: "Mar 13" },
  { title: "Review pull request", date: "Mar 13" },
  { title: "Water the plants", date: "Mar 14" },
  { title: "Submit expenses", date: "Mar 14" },
  { title: "Book flights", date: "Mar 15" },
  { title: "Reply to landlord", date: "Mar 15" },
  { title: "Dentist follow-up", date: "Mar 16" },
];

function TapeContent() {
  return (
    <>
      {tapeItems.map((item) => (
        <li
          key={`${item.title}-${item.date}`}
          className="flex shrink-0 items-baseline gap-6 border-r border-ink/10 pr-10 last:border-r-0"
        >
          <span className="whitespace-nowrap font-[family-name:var(--font-display)] text-2xl text-ink md:text-3xl">
            {item.title}
          </span>
          <span className="font-mono text-sm text-ink-muted">{item.date}</span>
        </li>
      ))}
    </>
  );
}

export function DueTape() {
  const reducedMotion = useReducedMotion();
  const { ref, scrollYProgress } = useSectionScroll({
    offset: ["start end", "end start"],
  });

  const x = useTransform(
    scrollYProgress,
    [0, 1],
    reducedMotion ? ["0%", "0%"] : ["2%", "-55%"],
  );

  return (
    <section
      ref={ref}
      className="relative min-h-[100vh] overflow-hidden py-24"
      aria-label="Upcoming tasks"
    >
      <div className="mb-12 px-6 md:px-12 lg:px-20">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted">
          Due tape
        </p>
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl text-ink md:text-4xl">
          Everything marching toward now.
        </h2>
      </div>

      <div className="border-y border-ink/10 bg-white/40 py-6">
        <motion.ul
          className="flex w-max gap-0 px-6 md:px-12"
          style={{ x }}
        >
          <TapeContent />
          <TapeContent />
        </motion.ul>
      </div>

      <p className="mt-8 px-6 text-sm text-ink-muted md:px-12 lg:px-20">
        Scroll pulls the strip—when a date arrives, you hear about it in
        Telegram.
      </p>
    </section>
  );
}
