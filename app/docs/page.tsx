import Link from "next/link";
import type { Metadata } from "next";
import { getSession } from "@/lib/dal";

export const metadata: Metadata = {
  title: "How nagr works",
  description:
    "Sign in, connect Telegram, and let the bot nag you — and shame you to friends — until your tasks are done.",
};

function Cmd({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-ink/5 px-1.5 py-0.5 font-mono text-[0.85em] text-ink">
      {children}
    </code>
  );
}

function Section({
  id,
  label,
  title,
  children,
}: {
  id: string;
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-ink/10 pt-10">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted">
        {label}
      </p>
      <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl text-ink md:text-3xl">
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-[17px] leading-relaxed text-ink/90">
        {children}
      </div>
    </section>
  );
}

const toc = [
  ["what", "What it is"],
  ["signin", "Sign in"],
  ["telegram", "Connect Telegram"],
  ["tasks", "Adding tasks"],
  ["nagging", "How nagging works"],
  ["recurring", "Recurring tasks"],
  ["digest", "Daily digest"],
  ["shame", "Friends & Shame Mode"],
  ["commands", "Telegram commands"],
  ["account", "Your account"],
];

export default async function DocsPage() {
  const session = await getSession();
  const authed = !!session?.user;
  const cta = authed
    ? { href: "/dashboard", label: "Dashboard →" }
    : { href: "/login", label: "Sign in →" };

  return (
    <div className="paper-grain min-h-svh">
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/85 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3">
          <Link
            href={authed ? "/dashboard" : "/"}
            className="font-[family-name:var(--font-display)] text-lg text-ink"
          >
            nagr
          </Link>
          <Link
            href={cta.href}
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent hover:underline"
          >
            {cta.label}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted">
          Documentation
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl leading-tight text-ink md:text-5xl">
          How nagr works
        </h1>
        <p className="mt-4 max-w-prose text-lg text-ink-muted">
          A to-do list that won&apos;t let you off the hook. It reminds you in
          Telegram, nags until you&apos;re done, and — if you choose — shames you
          to your friends when you fail.
        </p>

        <nav className="mt-8 flex flex-wrap gap-x-4 gap-y-2">
          {toc.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted/70 hover:text-ink"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="mt-12 space-y-12">
          <Section id="what" label="Overview" title="What it is">
            <p>
              nagr links your task list to a Telegram bot. Every task can
              have a due time. When it&apos;s due, the bot messages you — and
              keeps messaging on a schedule until you mark it done or snooze it.
              Make a task <strong>public</strong> and your friends get notified
              if you miss it.
            </p>
          </Section>

          <Section id="signin" label="Step 1" title="Sign in">
            <p>
              Sign in with Google — no passwords. Head to{" "}
              <Link href="/login" className="text-accent hover:underline">
                the sign-in page
              </Link>{" "}
              and continue with your Google account. That&apos;s your nagr
              identity; friends add you by this email.
            </p>
          </Section>

          <Section id="telegram" label="Step 2" title="Connect Telegram">
            <p>
              Open <strong>Settings → Telegram → Connect Telegram</strong>. That
              opens a chat with the bot — press <Cmd>Start</Cmd> and your account
              is linked. From then on, reminders and nags arrive in that chat.
            </p>
            <p className="text-ink-muted">
              You can disconnect any time from Settings; reconnecting just takes
              another <Cmd>Start</Cmd>.
            </p>
          </Section>

          <Section id="tasks" label="Step 3" title="Adding tasks">
            <p>
              Add a task from the{" "}
              <Link href="/dashboard" className="text-accent hover:underline">
                dashboard
              </Link>{" "}
              — just a title is enough. Tap <strong>options</strong> to set a due
              time, make it repeat, mark it public, or turn on escalation. You can
              also add tasks straight from Telegram with <Cmd>/add buy milk</Cmd>.
            </p>
            <p>
              Tasks group themselves: <strong>Overdue</strong>,{" "}
              <strong>Today</strong>, <strong>Upcoming</strong>,{" "}
              <strong>Someday</strong> (no due date), plus <strong>Failed</strong>{" "}
              and <strong>Done</strong>.
            </p>
          </Section>

          <Section id="nagging" label="The hook" title="How nagging works">
            <p>
              When a task&apos;s due time passes and it&apos;s still open, the bot
              sends a reminder with <Cmd>✅ Done</Cmd>, <Cmd>⏰ +10m</Cmd>, and{" "}
              <Cmd>💤 +1h</Cmd> buttons. It repeats every{" "}
              <strong>15 minutes</strong> by default until you act.
            </p>
            <ul className="ml-5 list-disc space-y-1.5 text-ink/90">
              <li>
                <strong>Snooze</strong> pushes the next nag out; every snooze is
                counted and shown back to you (&quot;snoozed 3×&quot;).
              </li>
              <li>
                <strong>Escalation</strong> (opt-in per task) shortens the
                interval the longer you ignore it.
              </li>
              <li>
                <strong>Quiet hours</strong> (Settings) hold nags overnight so the
                bot doesn&apos;t wake you.
              </li>
            </ul>
          </Section>

          <Section id="recurring" label="Repeat" title="Recurring tasks">
            <p>
              Set a task to repeat daily, weekly, or monthly. Completing it spawns
              the next occurrence automatically. Not feeling today&apos;s? Use{" "}
              <strong>skip</strong> on the dashboard or <Cmd>/skip n</Cmd> in
              Telegram to roll it forward to the next one.
            </p>
          </Section>

          <Section id="digest" label="Summaries" title="Daily digest">
            <p>
              Optionally get a <strong>morning</strong> and/or{" "}
              <strong>evening</strong> digest — a quick summary of what&apos;s
              open and overdue, delivered in Telegram at the hour you pick (in
              your timezone). Configure it in Settings.
            </p>
          </Section>

          <Section id="shame" label="Accountability" title="Friends & Shame Mode">
            <p>
              Add friends by their sign-in email on the{" "}
              <Link href="/friends" className="text-accent hover:underline">
                Friends
              </Link>{" "}
              page. Then mark a task <strong>public</strong>: if you miss it (past
              its due time plus a grace period), the bot{" "}
              <strong>blasts your friends</strong> on Telegram and posts it to the{" "}
              <Link href="/shame" className="text-accent hover:underline">
                Wall of Shame
              </Link>
              .
            </p>
            <ul className="ml-5 list-disc space-y-1.5 text-ink/90">
              <li>Only tasks you explicitly mark public can ever shame you.</li>
              <li>
                Use a <strong>public alias</strong> to hide the real title on the
                wall.
              </li>
              <li>
                You can opt out of receiving friends&apos; blasts in Settings.
              </li>
              <li>A failed task is locked — it shames once, not repeatedly.</li>
            </ul>
          </Section>

          <Section id="commands" label="Reference" title="Telegram commands">
            <ul className="space-y-2">
              <li>
                <Cmd>/add buy milk</Cmd> — add a task
              </li>
              <li>
                <Cmd>/list</Cmd> — your open tasks, numbered
              </li>
              <li>
                <Cmd>/done n</Cmd> — complete task number n
              </li>
              <li>
                <Cmd>/snooze n [min]</Cmd> — snooze task n (default 60m)
              </li>
              <li>
                <Cmd>/skip n</Cmd> — skip a recurring task to its next occurrence
              </li>
              <li>
                <Cmd>/help</Cmd> — show the command list
              </li>
            </ul>
            <p className="text-ink-muted">
              Reminder buttons (<Cmd>Done</Cmd>, <Cmd>+10m</Cmd>, <Cmd>+1h</Cmd>)
              do the same without typing.
            </p>
          </Section>

          <Section id="account" label="Privacy" title="Your account">
            <p>
              Your data is yours. From Settings you can disconnect Telegram or{" "}
              <strong>delete your account</strong> entirely — that removes your
              tasks, friendships, Telegram link, and shame history in one go.
            </p>
          </Section>
        </div>

        <div className="mt-16 border-t border-ink/10 pt-8 text-center">
          <Link
            href={cta.href}
            className="font-[family-name:var(--font-display)] text-2xl text-accent hover:underline"
          >
            {authed ? "Go to your dashboard →" : "Get started →"}
          </Link>
        </div>
      </main>

      <footer className="border-t border-ink/10 px-6 py-8 text-center font-mono text-xs text-ink-muted">
        nagr · reminders in Telegram
      </footer>
    </div>
  );
}
