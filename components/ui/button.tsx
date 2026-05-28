import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition disabled:pointer-events-none disabled:opacity-50",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
        variant === "primary" && "bg-accent text-white hover:opacity-90",
        variant === "secondary" && "border border-ink/20 text-ink hover:bg-ink/5",
        variant === "ghost" && "text-ink-muted hover:text-ink",
        variant === "danger" &&
          "border border-accent-warm/40 text-accent-warm hover:bg-accent-warm/10",
        className,
      )}
      {...props}
    />
  );
}
