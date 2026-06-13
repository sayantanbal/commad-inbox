CREATE TABLE IF NOT EXISTS "agent_conversations" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "title" text NOT NULL DEFAULT 'New chat',
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "agent_conversations_user_updated_idx"
  ON "agent_conversations" ("user_id", "updated_at" DESC);

CREATE TABLE IF NOT EXISTS "agent_messages" (
  "id" text PRIMARY KEY NOT NULL,
  "conversation_id" text NOT NULL REFERENCES "agent_conversations"("id") ON DELETE CASCADE,
  "role" text NOT NULL,
  "parts" jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "agent_messages_conversation_idx"
  ON "agent_messages" ("conversation_id", "created_at");

CREATE TABLE IF NOT EXISTS "thread_summaries" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "thread_id" text NOT NULL,
  "bullets" jsonb NOT NULL,
  "actions" jsonb NOT NULL,
  "message_count" integer NOT NULL,
  "provider" text,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "thread_summaries_user_thread_idx"
  ON "thread_summaries" ("user_id", "thread_id");
