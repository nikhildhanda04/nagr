"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import { useSectionScroll } from "../hooks/useSectionScroll";
import { useReducedMotion } from "../hooks/useReducedMotion";

const notes = [
  {
    side: "left" as const,
    text: "Notifications die in the shade of your lock screen.",
  },
  {
    side: "right" as const,
    text: "This one lives where you already reply.",
  },
  {
    side: "left" as const,
    text: "You don't open it—the reminder opens you.",
  },
  {
    side: "right" as const,
    text: "A tap on Done, right inside the thread.",
  },
];

function MarginNote({
  note,
  index,
  scrollYProgress,
  reducedMotion,
}: {
  note: (typeof notes)[number];
  index: number;
  scrollYProgress: MotionValue<number>;
  reducedMotion: boolean;
}) {
  const start = 0.1 + index * 0.18;
  const end = start + 0.25;

  const opacity = useTransform(
    scrollYProgress,
    [start, start + 0.12, end],
    reducedMotion ? [1, 1, 1] : [0, 1, 0.6],
  );
  const x = useTransform(
    scrollYProgress,
    [start, end],
    reducedMotion ? [0, 0] : note.side === "left" ? [-24, 0] : [24, 0],
  );

  return (
    <motion.figure
      className={`flex ${note.side === "left" ? "justify-start md:pr-[40%]" : "justify-end md:pl-[40%]"}`}
      style={{ opacity, x }}
    >
      <blockquote className="max-w-sm border-t border-ink/15 pt-4 text-xl leading-relaxed text-ink md:text-2xl">
        <span className="font-[family-name:var(--font-display)] italic">
          {note.text}
        </span>
      </blockquote>
    </motion.figure>
  );
}

export function MarginNotes() {
  const reducedMotion = useReducedMotion();
  const { ref, scrollYProgress } = useSectionScroll({
    offset: ["start end", "end start"],
  });

  return (
    <section
      ref={ref}
      className="relative min-h-[120vh] px-6 py-32 md:px-12 lg:px-20"
      aria-label="Why Telegram"
    >
      <div className="mx-auto max-w-6xl">
        <p className="mb-20 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted">
          Margin notes
        </p>

        <div className="relative mx-auto max-w-3xl space-y-32 md:max-w-5xl">
          {notes.map((note, i) => (
            <MarginNote
              key={note.text}
              note={note}
              index={i}
              scrollYProgress={scrollYProgress}
              reducedMotion={reducedMotion}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
