import type { Task } from "@/db/schema";

export type GroupedTasks = {
  overdue: Task[];
  today: Task[];
  upcoming: Task[];
  someday: Task[];
  failed: Task[];
  done: Task[];
};

export function groupTasks(tasks: Task[], now: Date = new Date()): GroupedTasks {
  const startOfTomorrow = new Date(now);
  startOfTomorrow.setHours(0, 0, 0, 0);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const g: GroupedTasks = {
    overdue: [],
    today: [],
    upcoming: [],
    someday: [],
    failed: [],
    done: [],
  };

  for (const t of tasks) {
    if (t.status === "failed") g.failed.push(t);
    else if (t.status === "done") g.done.push(t);
    else if (!t.dueAt) g.someday.push(t);
    else if (new Date(t.dueAt) < now) g.overdue.push(t);
    else if (new Date(t.dueAt) < startOfTomorrow) g.today.push(t);
    else g.upcoming.push(t);
  }

  g.done.sort(
    (a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0),
  );
  return g;
}

export function formatDue(d: Date | null): string {
  if (!d) return "";
  return new Date(d).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Glanceable relative due label, e.g. "in 2h", "3d overdue", "due now". */
export function relativeDue(
  d: Date,
  now: Date = new Date(),
): { label: string; overdue: boolean; soon: boolean } {
  const ms = new Date(d).getTime() - now.getTime();
  const overdue = ms < 0;
  const abs = Math.abs(ms);
  const mins = Math.round(abs / 60_000);
  const hrs = Math.round(abs / 3_600_000);
  const days = Math.round(abs / 86_400_000);

  let core: string;
  if (abs < 60_000) core = "now";
  else if (mins < 60) core = `${mins}m`;
  else if (hrs < 24) core = `${hrs}h`;
  else if (days < 7) core = `${days}d`;
  else
    core = new Date(d).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });

  const label =
    abs < 60_000 ? "due now" : overdue ? `${core} overdue` : `in ${core}`;
  return { label, overdue, soon: !overdue && abs < 2 * 3_600_000 };
}

/** Human "Xm Ys" countdown for a future instant; "now" if past. */
export function countdown(target: Date, now: Date = new Date()): string {
  const ms = new Date(target).getTime() - now.getTime();
  if (ms <= 0) return "now";
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}
