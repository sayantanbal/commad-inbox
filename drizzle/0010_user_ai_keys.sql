CREATE TABLE IF NOT EXISTS "user_ai_keys" (
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "provider" text NOT NULL,
  "encrypted_key" text NOT NULL,
  "key_hint" text NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "user_ai_keys_pkey" PRIMARY KEY ("user_id", "provider")
);

CREATE INDEX IF NOT EXISTS "user_ai_keys_user_idx" ON "user_ai_keys" ("user_id");
