-- HNSW index for semantic search (requires vector extension + classifications table)
CREATE INDEX IF NOT EXISTS embedding_idx
  ON classifications
  USING hnsw (embedding vector_cosine_ops)
  WHERE embedding IS NOT NULL;
