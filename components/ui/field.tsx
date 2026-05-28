import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const base =
  "w-full rounded-lg border border-ink/15 bg-white/60 px-3 py-2 text-ink placeholder:text-ink-muted/50 focus:border-accent focus:outline-none";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(base, className)} {...props} />;
}

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(base, "appearance-none", className)} {...props} />;
}

export function Label({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "mb-1.5 block font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}
