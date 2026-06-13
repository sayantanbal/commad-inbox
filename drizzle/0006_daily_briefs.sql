CREATE TABLE IF NOT EXISTS "daily_briefs" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "brief" jsonb NOT NULL,
  "source_hash" text NOT NULL,
  "provider" text,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "daily_briefs_user_idx"
  ON "daily_briefs" ("user_id");
