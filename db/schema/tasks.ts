import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  uuid,
  integer,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const taskStatus = pgEnum("task_status", ["open", "done", "failed"]);

export const taskRecurrence = pgEnum("task_recurrence", [
  "none",
  "daily",
  "weekly",
  "monthly",
]);

// task = nag until done; reminder = ping once at its time (no relentless nag).
export const taskKind = pgEnum("task_kind", ["task", "reminder"]);

export const task = pgTable("task", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  notes: text("notes"),
  kind: taskKind("kind").notNull().default("task"),
  status: taskStatus("status").notNull().default("open"),
  // Nullable: a task may have no due time. timestamptz so we store an instant.
  dueAt: timestamp("due_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  // Nag loop (Phase 3). nextNagAt = when the next nag fires; null = not nagged.
  nagIntervalSec: integer("nag_interval_sec").notNull().default(900),
  nextNagAt: timestamp("next_nag_at", { withTimezone: true }),
  lastNagAt: timestamp("last_nag_at", { withTimezone: true }),
  // Escalation: when true, the effective nag interval shrinks the longer it's
  // overdue. snoozeCount surfaces "snoozed N×" guilt.
  escalate: boolean("escalate").notNull().default(false),
  snoozeCount: integer("snooze_count").notNull().default(0),
  // Recurrence: completing a recurring task spawns the next occurrence.
  recurrence: taskRecurrence("recurrence").notNull().default("none"),
  // Shame Mode (Phase 4). isPublic = consent to be shamed for this task.
  // Fail = open past dueAt + graceSec. publicAlias hides the real title publicly.
  isPublic: boolean("is_public").notNull().default(false),
  graceSec: integer("grace_sec").notNull().default(0),
  publicAlias: text("public_alias"),
  shamedAt: timestamp("shamed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("task_nag_idx").on(t.status, t.nextNagAt), // nag scan
  index("task_shame_idx").on(t.isPublic, t.status, t.dueAt), // shame scan
  index("task_user_idx").on(t.userId), // per-user listing
]);

export type Task = typeof task.$inferSelect;
