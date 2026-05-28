import { requireUser } from "@/lib/dal";
import { getUserTasks } from "@/lib/tasks";
import { TaskBoard } from "@/components/app/task-board";
import { NaggingStrip } from "@/components/app/nagging-strip";
import { Mono } from "@/components/ui/card";

export default async function DashboardPage() {
  const user = await requireUser();
  const tasks = await getUserTasks(user.id);
  const now = new Date();

  // Tasks the bot is actively nagging (open + overdue + scheduled).
  const nagging = tasks
    .filter(
      (t) =>
        t.status === "open" && t.nextNagAt && t.dueAt && new Date(t.dueAt) < now,
    )
    .map((t) => ({ id: t.id, title: t.title, nextNagAt: t.nextNagAt as Date }));

  // On-time completion rate over the last 7 days (no due date counts on-time).
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000);
  const doneThisWeek = tasks.filter(
    (t) => t.status === "done" && t.completedAt && new Date(t.completedAt) >= weekAgo,
  );
  const onTime = doneThisWeek.filter(
    (t) => !t.dueAt || (t.completedAt && new Date(t.completedAt) <= new Date(t.dueAt)),
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <Mono>Your tasks</Mono>
        {doneThisWeek.length > 0 && (
          <Mono className="text-ink-muted/60">
            on time {onTime.length}/{doneThisWeek.length} this week
          </Mono>
        )}
      </div>
      <NaggingStrip tasks={nagging} />
      <TaskBoard tasks={tasks} />
    </div>
  );
}
