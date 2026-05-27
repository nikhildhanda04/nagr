import { pgTable, text, timestamp, pgEnum, bigint } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const telegramLinkStatus = pgEnum("telegram_link_status", [
  "pending",
  "linked",
]);

// One Telegram link per user (central app bot). `chatId` is where we DM that
// user; null until they consume the deep-link `/start <token>`.
export const telegramLink = pgTable("telegram_link", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  chatId: text("chat_id"),
  telegramUserId: text("telegram_user_id"),
  username: text("username"),
  // Random one-time token for the deep link; cleared once linked.
  linkToken: text("link_token").unique(),
  status: telegramLinkStatus("status").notNull().default("pending"),
  linkedAt: timestamp("linked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type TelegramLink = typeof telegramLink.$inferSelect;

// Singleton row holding the getUpdates cursor for polling mode (local dev).
export const telegramState = pgTable("telegram_state", {
  id: text("id").primaryKey().default("singleton"),
  lastUpdateId: bigint("last_update_id", { mode: "number" }).notNull().default(0),
});
