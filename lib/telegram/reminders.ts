import type { Task } from "@/db/schema";
import { sendToUser } from "./service";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Send a single reminder for a task, with a [Done] button. */
export async function sendTaskReminder(userId: string, task: Task) {
  const due = task.dueAt ? ` — due ${new Date(task.dueAt).toLocaleString()}` : "";
  return sendToUser(userId, `⏰ <b>${escapeHtml(task.title)}</b>${due}`, {
    replyMarkup: {
      inline_keyboard: [[{ text: "✅ Done", callback_data: `done:${task.id}` }]],
    },
  });
}
