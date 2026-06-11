CREATE TYPE "public"."draft_tone" AS ENUM('professional', 'friendly', 'brief');--> statement-breakpoint
CREATE TYPE "public"."triage_lane" AS ENUM('reply', 'schedule', 'fyi', 'done');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."scheduled_send_status" AS ENUM('pending', 'sent', 'cancelled', 'failed');--> statement-breakpoint
CREATE TABLE "classifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"thread_id" text NOT NULL,
	"priority" "priority" NOT NULL,
	"lane" "triage_lane" NOT NULL,
	"subject" text NOT NULL,
	"sender" text NOT NULL,
	"snippet" text NOT NULL,
	"scheduling_intent" json,
	"classified_at" timestamp with time zone DEFAULT now() NOT NULL,
	"embedding" vector(768)
);
--> statement-breakpoint
CREATE TABLE "drafts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"thread_id" text,
	"content" text NOT NULL,
	"tone" "draft_tone",
	"approved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scheduled_sends" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"thread_id" text,
	"to" json NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"send_at" timestamp with time zone NOT NULL,
	"status" "scheduled_send_status" DEFAULT 'pending' NOT NULL,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "snoozes" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"thread_id" text NOT NULL,
	"snoozed_until" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"corsair_tenant_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "webhook_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"payload" json NOT NULL,
	"signature" text,
	"verified" boolean NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"error" text
);
--> statement-breakpoint
ALTER TABLE "classifications" ADD CONSTRAINT "classifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drafts" ADD CONSTRAINT "drafts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_sends" ADD CONSTRAINT "scheduled_sends_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "snoozes" ADD CONSTRAINT "snoozes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_logs" ADD CONSTRAINT "webhook_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "classifications_user_idx" ON "classifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "classifications_user_thread_idx" ON "classifications" USING btree ("user_id","thread_id");--> statement-breakpoint
CREATE INDEX "scheduled_sends_time_idx" ON "scheduled_sends" USING btree ("status","send_at");--> statement-breakpoint
CREATE INDEX "snoozes_user_time_idx" ON "snoozes" USING btree ("user_id","snoozed_until");