CREATE TABLE "telegram_processed_update" (
	"update_id" bigint PRIMARY KEY NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "task_nag_idx" ON "task" USING btree ("status","next_nag_at");--> statement-breakpoint
CREATE INDEX "task_shame_idx" ON "task" USING btree ("is_public","status","due_at");--> statement-breakpoint
CREATE INDEX "task_user_idx" ON "task" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "telegram_link_chat_idx" ON "telegram_link" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "friendship_requester_idx" ON "friendship" USING btree ("requester_id");--> statement-breakpoint
CREATE INDEX "friendship_addressee_idx" ON "friendship" USING btree ("addressee_id");--> statement-breakpoint
CREATE INDEX "shame_event_user_idx" ON "shame_event" USING btree ("user_id","failed_at");