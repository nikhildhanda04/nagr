ALTER TABLE "user" ADD COLUMN "quiet_hours_start" integer;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "quiet_hours_end" integer;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "nag_interval_sec" integer DEFAULT 900 NOT NULL;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "next_nag_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "last_nag_at" timestamp with time zone;