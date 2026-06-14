CREATE TYPE "public"."commitment_direction" AS ENUM('outbound', 'inbound');
CREATE TYPE "public"."commitment_status" AS ENUM('pending_confirm', 'open', 'fulfilled', 'dismissed');
CREATE TYPE "public"."contact_warmth" AS ENUM('cold', 'warm', 'active', 'new');
CREATE TYPE "public"."external_provider" AS ENUM('linear', 'notion', 'github');

CREATE TABLE "commitments" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "thread_id" text NOT NULL,
  "message_id" text NOT NULL,
  "direction" "commitment_direction" NOT NULL,
  "text" text NOT NULL,
  "due_date" timestamp with time zone,
  "counterparty_email" text NOT NULL,
  "status" "commitment_status" NOT NULL DEFAULT 'open',
  "confidence" real NOT NULL,
  "extracted_at" timestamp with time zone DEFAULT now() NOT NULL,
  "follow_up_draft_queued_at" timestamp with time zone
);

CREATE INDEX "commitments_user_status_idx" ON "commitments" ("user_id", "status");
CREATE INDEX "commitments_user_thread_idx" ON "commitments" ("user_id", "thread_id");

CREATE TABLE "contacts" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "email" text NOT NULL,
  "display_name" text NOT NULL DEFAULT '',
  "last_contact_at" timestamp with time zone NOT NULL,
  "avg_response_hours" real,
  "email_count_30d" integer NOT NULL DEFAULT 0,
  "warmth" "contact_warmth" NOT NULL DEFAULT 'new',
  "open_commitment_count" integer NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX "contacts_user_email_idx" ON "contacts" ("user_id", "email");
CREATE INDEX "contacts_user_warmth_idx" ON "contacts" ("user_id", "warmth");

CREATE TABLE "email_snippets" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "name" text NOT NULL,
  "body" text NOT NULL,
  "variables" json NOT NULL DEFAULT '[]',
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX "email_snippets_user_idx" ON "email_snippets" ("user_id");

CREATE TABLE "user_preferences" (
  "user_id" text PRIMARY KEY NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "batch_windows" json NOT NULL DEFAULT '["09:00","13:00","17:00"]',
  "focus_mode_enabled" boolean NOT NULL DEFAULT true,
  "auto_responder_template" text NOT NULL DEFAULT 'I check email at 9am, 1pm, and 5pm. I''ll get back to you soon.',
  "follow_up_days_default" integer NOT NULL DEFAULT 5,
  "timezone" text NOT NULL DEFAULT 'UTC',
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "external_connections" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "provider" "external_provider" NOT NULL,
  "access_token" text NOT NULL,
  "team_id" text,
  "default_project_id" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX "external_connections_user_provider_idx" ON "external_connections" ("user_id", "provider");

CREATE TABLE "thread_external_tasks" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "thread_id" text NOT NULL,
  "provider" "external_provider" NOT NULL,
  "external_task_id" text NOT NULL,
  "url" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX "thread_external_tasks_user_thread_idx" ON "thread_external_tasks" ("user_id", "thread_id");

CREATE TABLE "focus_auto_replies" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "sender_email" text NOT NULL,
  "sent_at" timestamp with time zone DEFAULT now() NOT NULL,
  "thread_id" text NOT NULL
);

CREATE INDEX "focus_auto_replies_user_sender_day_idx" ON "focus_auto_replies" ("user_id", "sender_email", "sent_at");

CREATE TABLE "meeting_briefs" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "attendee_email" text NOT NULL,
  "brief_date" text NOT NULL,
  "brief" json NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX "meeting_briefs_user_attendee_date_idx" ON "meeting_briefs" ("user_id", "attendee_email", "brief_date");
