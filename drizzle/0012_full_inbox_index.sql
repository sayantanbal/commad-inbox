ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "full_index_completed_at" timestamp with time zone;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "inbox_index_total_threads" integer;
