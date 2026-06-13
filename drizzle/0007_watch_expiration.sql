ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "gmail_watch_expires_at" timestamp with time zone;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "calendar_watch_expires_at" timestamp with time zone;
