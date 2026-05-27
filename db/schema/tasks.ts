import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  uuid,
  integer,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const taskStatus = pgEnum("task_status", ["open", "done"]);

export const task = pgTable("task", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  notes: text("notes"),
  status: taskStatus("status").notNull().default("open"),
  // Nullable: a task may have no due time. timestamptz so we store an instant.
  dueAt: timestamp("due_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  // Nag loop (Phase 3). nextNagAt = when the next nag fires; null = not nagged.
  nagIntervalSec: integer("nag_interval_sec").notNull().default(900),
  nextNagAt: timestamp("next_nag_at", { withTimezone: true }),
  lastNagAt: timestamp("last_nag_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Task = typeof task.$inferSelect;
