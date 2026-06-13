ALTER TABLE classifications ADD COLUMN IF NOT EXISTS embedding_provider text;

UPDATE classifications
SET embedding_provider = 'gemini'
WHERE embedding IS NOT NULL
  AND embedding_provider IS NULL;

CREATE INDEX IF NOT EXISTS classifications_user_provider_idx
  ON classifications (user_id, embedding_provider);
