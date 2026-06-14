ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "working_days_structured" json;
ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "working_days_text_override" text;
ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "working_days_source" text DEFAULT 'wizard';
ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "onboarding_completed_at" timestamptz;

CREATE TABLE IF NOT EXISTS "app_contacts" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "email" text NOT NULL,
  "display_name" text,
  "source" text NOT NULL DEFAULT 'manual',
  "status" text NOT NULL DEFAULT 'active',
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "app_contacts_user_email_idx" ON "app_contacts" ("user_id", "email");
CREATE INDEX IF NOT EXISTS "app_contacts_user_idx" ON "app_contacts" ("user_id");

CREATE TABLE IF NOT EXISTS "contact_dismissals" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "email" text NOT NULL,
  "dismissed_at" timestamptz DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "contact_dismissals_user_email_idx" ON "contact_dismissals" ("user_id", "email");
