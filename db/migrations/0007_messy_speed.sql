CREATE TYPE "public"."task_kind" AS ENUM('task', 'reminder');--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "kind" "task_kind" DEFAULT 'task' NOT NULL;