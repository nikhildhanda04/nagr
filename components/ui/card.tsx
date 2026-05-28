import { cn } from "@/lib/cn";

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-ink/10 bg-white/50 p-5 shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Mono({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted",
        className,
      )}
    >
      {children}
    </p>
  );
}
