"use client";

import {
  motion,
  useMotionValueEvent,
  useTransform,
  AnimatePresence,
} from "motion/react";
import { useState } from "react";
import { ChatBubble } from "../ui/ChatBubble";
import { SectionLabel } from "../ui/SectionLabel";
import { useSectionScroll } from "../hooks/useSectionScroll";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { cn } from "@/lib/cn";

const chapters = ["Added", "Due", "Nag", "Done"] as const;

function getChapter(progress: number): (typeof chapters)[number] {
  if (progress < 0.2) return "Added";
  if (progress < 0.45) return "Due";
  if (progress < 0.75) return "Nag";
  return "Done";
}

function ChatThread({
  progress,
  reducedMotion,
  stacked,
}: {
  progress: number;
  reducedMotion: boolean;
  stacked?: boolean;
}) {
  const showTask = stacked || progress > 0.05;
  const showDue = stacked || progress > 0.2;
  const showReminder1 = stacked || progress > 0.35;
  const showReminder2 = stacked || progress > 0.55;
  const showDone = stacked || progress > 0.78;
  const highlightDue = stacked || (progress > 0.2 && progress < 0.45);
  const highlightButton = stacked || (progress > 0.7 && progress < 0.85);

  const fade = (visible: boolean) =>
    reducedMotion
      ? { opacity: visible ? 1 : 0.25 }
      : { opacity: visible ? 1 : 0, y: visible ? 0 : 12 };

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-[var(--rule)] bg-white/60 p-4 shadow-sm backdrop-blur-sm md:p-5",
        stacked && "gap-4",
      )}
    >
      <AnimatePresence mode="sync">
        {showTask && (
          <motion.div key="task" initial={false} animate={fade(true)}>
            <ChatBubble variant="out">
              <span className="font-medium">Call dentist</span>
              <span className="mt-1 block text-sm text-ink-muted">
                Added yesterday
              </span>
            </ChatBubble>
          </motion.div>
        )}

        {showDue && (
          <motion.div
            key="due"
            initial={false}
            animate={fade(true)}
            className={cn(highlightDue && "ring-2 ring-accent-warm/30 rounded-2xl")}
          >
            <ChatBubble variant="system">
              <span className="font-mono text-xs">Due today · 3:00 PM</span>
            </ChatBubble>
          </motion.div>
        )}

        {showReminder1 && (
          <motion.div key="r1" initial={false} animate={fade(true)}>
            <ChatBubble variant="in">
              Gentle nudge: <em>Call dentist</em> is due now.
            </ChatBubble>
          </motion.div>
        )}

        {showReminder2 && (
          <motion.div key="r2" initial={false} animate={fade(true)}>
            <ChatBubble variant="in">
              Still waiting on <strong>Call dentist</strong>. Tap Done when
              you&apos;re finished.
            </ChatBubble>
          </motion.div>
        )}

        {showDone && (
          <motion.div key="done" initial={false} animate={fade(true)}>
            <ChatBubble variant="in">
              <span
                className={cn(
                  "inline-block rounded-lg border border-accent/40 bg-accent/10 px-3 py-1 text-sm font-medium text-accent",
                  highlightButton && "ring-2 ring-accent/50",
                )}
              >
                Done
              </span>
              <span className="mt-2 block text-sm text-ink-muted">
                Marked complete ✓
              </span>
            </ChatBubble>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function PinnedThread() {
  const reducedMotion = useReducedMotion();
  const { ref, scrollYProgress } = useSectionScroll({
    offset: ["start start", "end end"],
  });
  const [progress, setProgress] = useState(reducedMotion ? 1 : 0);
  const chapter = getChapter(progress);

  const labelOpacity = useTransform(scrollYProgress, [0, 1], [0.4, 1]);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (!reducedMotion) setProgress(v);
  });

  return (
    <>
      {/* Desktop: pinned scroll-scrub */}
      <section
        ref={ref}
        className="relative hidden md:block"
        style={{ height: "min(320vh, 2800px)" }}
        aria-label="How reminders work in Telegram"
      >
        <div className="sticky top-0 flex h-[100svh] items-center">
          <div className="mx-auto grid w-full max-w-6xl grid-cols-[0.35fr_1fr] gap-8 px-12 lg:px-20">
            <div className="flex flex-col justify-center gap-6 pt-12">
              {chapters.map((c) => (
                <SectionLabel key={c} active={chapter === c}>
                  {c}
                </SectionLabel>
              ))}
            </div>

            <motion.div
              className="flex items-center justify-center"
              style={{ opacity: reducedMotion ? 1 : labelOpacity }}
            >
              <div className="w-full max-w-md">
                <p className="mb-4 text-center font-mono text-xs text-ink-muted">
                  Telegram · nagr bot
                </p>
                <ChatThread progress={progress} reducedMotion={reducedMotion} />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mobile: shorter stack */}
      <section
        className="px-6 py-20 md:hidden"
        aria-label="How reminders work in Telegram"
      >
        <div className="mb-8 flex flex-wrap gap-4">
          {chapters.map((c) => (
            <SectionLabel key={c} active>
              {c}
            </SectionLabel>
          ))}
        </div>
        <p className="mb-4 text-center font-mono text-xs text-ink-muted">
          Telegram · nagr bot
        </p>
        <ChatThread
          progress={1}
          reducedMotion={reducedMotion}
          stacked
        />
      </section>
    </>
  );
}
