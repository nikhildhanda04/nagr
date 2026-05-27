import { cn } from "@/lib/cn";

type SectionLabelProps = {
  children: React.ReactNode;
  active?: boolean;
  className?: string;
};

export function SectionLabel({
  children,
  active = false,
  className,
}: SectionLabelProps) {
  return (
    <span
      className={cn(
        "font-mono text-[11px] uppercase tracking-[0.2em] transition-colors duration-300",
        active ? "text-ink" : "text-ink-muted/60",
        className,
      )}
    >
      {children}
    </span>
  );
}
