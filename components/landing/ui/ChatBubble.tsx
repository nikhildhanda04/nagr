import { cn } from "@/lib/cn";

type ChatBubbleProps = {
  children: React.ReactNode;
  variant?: "in" | "out" | "system";
  className?: string;
};

export function ChatBubble({
  children,
  variant = "in",
  className,
}: ChatBubbleProps) {
  return (
    <div
      className={cn(
        "max-w-[85%] rounded-2xl px-4 py-2.5 text-[15px] leading-snug shadow-sm",
        variant === "in" && "ml-auto bg-bubble-in text-ink",
        variant === "out" && "mr-auto bg-bubble-out text-ink border border-[var(--rule)]",
        variant === "system" &&
          "mx-auto max-w-full bg-transparent text-center text-sm text-ink-muted shadow-none",
        className,
      )}
    >
      {children}
    </div>
  );
}
