CREATE TYPE "public"."telegram_link_status" AS ENUM('pending', 'linked');--> statement-breakpoint
CREATE TABLE "telegram_link" (
	"user_id" text PRIMARY KEY NOT NULL,
	"chat_id" text,
	"telegram_user_id" text,
	"username" text,
	"link_token" text,
	"status" "telegram_link_status" DEFAULT 'pending' NOT NULL,
	"linked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "telegram_link_link_token_unique" UNIQUE("link_token")
);
--> statement-breakpoint
CREATE TABLE "telegram_state" (
	"id" text PRIMARY KEY DEFAULT 'singleton' NOT NULL,
	"last_update_id" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "telegram_link" ADD CONSTRAINT "telegram_link_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;