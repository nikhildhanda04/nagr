CREATE TYPE "public"."task_recurrence" AS ENUM('none', 'daily', 'weekly', 'monthly');--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "morning_digest_hour" integer;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "night_digest_hour" integer;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "last_digest_key" text;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "escalate" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "snooze_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "recurrence" "task_recurrence" DEFAULT 'none' NOT NULL;