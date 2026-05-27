import { sendToUser } from "./service";

export type ReminderTask = { id: string; title: string; dueAt: Date | null };

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Send a nag for a task, with Done + snooze buttons. */
export async function sendTaskReminder(userId: string, task: ReminderTask) {
  const due = task.dueAt ? ` — due ${new Date(task.dueAt).toLocaleString()}` : "";
  return sendToUser(userId, `⏰ <b>${escapeHtml(task.title)}</b>${due}`, {
    replyMarkup: {
      inline_keyboard: [
        [
          { text: "✅ Done", callback_data: `done:${task.id}` },
          { text: "⏰ +10m", callback_data: `snooze:${task.id}:600` },
          { text: "💤 +1h", callback_data: `snooze:${task.id}:3600` },
        ],
      ],
    },
  });
}
