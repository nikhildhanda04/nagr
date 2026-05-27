"use client";

import { useScroll, type UseScrollOptions } from "motion/react";
import { useRef } from "react";

type SectionScrollOptions = Omit<UseScrollOptions, "target">;

export function useSectionScroll(options?: SectionScrollOptions) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress, scrollY } = useScroll({
    target: ref,
    offset: options?.offset ?? ["start end", "end start"],
    ...options,
  });

  return { ref, scrollYProgress, scrollY };
}
