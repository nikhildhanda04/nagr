import { requireUser } from "@/lib/dal";
import { getWall } from "@/lib/shame";
import { Mono } from "@/components/ui/card";
import { formatDue } from "@/lib/group-tasks";

export default async function ShamePage() {
  const user = await requireUser();
  const wall = await getWall(user.id);

  return (
    <div>
      <Mono>Wall of Shame</Mono>
      <h1 className="mt-2 mb-6 font-[family-name:var(--font-display)] text-3xl text-ink">
        Failures
      </h1>

      {wall.length === 0 ? (
        <p className="text-ink-muted">
          No failures yet — you and your friends are clean. Keep it that way.
        </p>
      ) : (
        <ul className="space-y-2">
          {wall.map((w) => (
            <li
              key={w.id}
              className="rounded-xl border border-ink/10 bg-white/40 px-4 py-3"
            >
              <p className="text-[15px] text-ink">
                <span className="text-accent-warm">
                  🔴 {w.mine ? "You" : w.name}
                </span>{" "}
                failed: <span className="font-medium">{w.title}</span>
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-ink-muted/70">
                {formatDue(w.failedAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
