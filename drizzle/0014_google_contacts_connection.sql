CREATE TABLE IF NOT EXISTS "google_contacts_connections" (
  "user_id" text PRIMARY KEY NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "encrypted_refresh_token" text NOT NULL,
  "last_synced_at" timestamp with time zone,
  "connected_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
