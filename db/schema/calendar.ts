import {
  pgTable,
  text,
  timestamp,
  integer,
  uuid,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

// Read-only mirror of the user's Google Calendar events (synced window).
export const calendarEvent = pgTable(
  "calendar_event",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    externalId: text("external_id").notNull(),
    source: text("source").notNull().default("google"),
    title: text("title").notNull(),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }),
    leadMin: integer("lead_min").notNull().default(15),
    remindedAt: timestamp("reminded_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique().on(t.userId, t.externalId),
    index("calendar_event_user_start_idx").on(t.userId, t.startAt),
  ],
);

export type CalendarEvent = typeof calendarEvent.$inferSelect;
