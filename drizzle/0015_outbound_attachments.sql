CREATE TYPE "outbound_attachment_source" AS ENUM ('upload', 'thread_forward');

CREATE TABLE "outbound_attachments" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "filename" text NOT NULL,
  "mime_type" text NOT NULL,
  "size_bytes" integer NOT NULL,
  "data" bytea NOT NULL,
  "source" "outbound_attachment_source" NOT NULL,
  "source_message_id" text,
  "source_attachment_id" text,
  "expires_at" timestamptz NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX "outbound_attachments_user_idx" ON "outbound_attachments" ("user_id");
CREATE INDEX "outbound_attachments_expires_idx" ON "outbound_attachments" ("expires_at");

ALTER TABLE "scheduled_sends" ADD COLUMN IF NOT EXISTS "attachment_ids" jsonb NOT NULL DEFAULT '[]'::jsonb;
