ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "calendar_watch_channel_id" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "calendar_watch_channel_token" text;
