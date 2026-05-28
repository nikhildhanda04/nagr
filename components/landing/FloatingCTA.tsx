"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";

export function FloatingCTA({ authed }: { authed: boolean }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.85);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link
              href={authed ? "/dashboard" : "/login"}
              className="pointer-events-auto rounded-full bg-accent px-6 py-3 text-sm font-medium text-white shadow-lg shadow-accent/20 hover:opacity-90"
            >
              {authed ? "Open dashboard" : "Get started"} →
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
