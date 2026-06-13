ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "backfill_completed_at" timestamp with time zone;
