import { requireUser } from "@/lib/dal";
import { AppHeader } from "@/components/app/app-header";
import { CommandPalette } from "@/components/app/command-palette";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  return (
    <div className="paper-grain min-h-full">
      {/* The landing's falling "due line" motif, carried into the app. */}
      <div
        aria-hidden
        className="pointer-events-none fixed left-[7%] top-0 z-0 h-px w-px overflow-hidden md:left-[10%]"
      >
        <div className="due-line-animate h-[120vh] w-px bg-ink/10" />
      </div>

      <AppHeader email={user.email} />
      <main className="relative z-10 mx-auto max-w-3xl px-5 py-8">{children}</main>
      <CommandPalette />
    </div>
  );
}
