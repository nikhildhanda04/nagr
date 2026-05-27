import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  uuid,
  unique,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { task } from "./tasks";

export const friendshipStatus = pgEnum("friendship_status", [
  "pending",
  "accepted",
]);

// One row per pair (requester -> addressee). "My friends" = accepted rows where
// I'm on either side.
export const friendship = pgTable(
  "friendship",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requesterId: text("requester_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    addresseeId: text("addressee_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: friendshipStatus("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.requesterId, t.addresseeId)],
);

export type Friendship = typeof friendship.$inferSelect;

// Wall of Shame entry. Title is snapshotted at fail time so later task edits /
// deletes don't rewrite history. NOT a public feed — read scoped to self+friends.
export const shameEvent = pgTable("shame_event", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  taskId: uuid("task_id").references(() => task.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  failedAt: timestamp("failed_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ShameEvent = typeof shameEvent.$inferSelect;
