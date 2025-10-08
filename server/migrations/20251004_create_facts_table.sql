-- Migration: Create facts table for semantic memory with pgvector
-- Date: 2025-10-04

CREATE TABLE IF NOT EXISTS facts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NULL,
  user_id uuid NULL,
  kind text NOT NULL,
  key text NOT NULL,
  value text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  importance numeric DEFAULT 5,
  access_count integer DEFAULT 0,
  last_accessed timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  embedding vector(1536) -- requires pgvector extension
);

-- GIN index for metadata lookups
CREATE INDEX IF NOT EXISTS facts_metadata_idx ON facts USING gin (metadata jsonb_path_ops);

-- Full text index on value for hybrid search
CREATE INDEX IF NOT EXISTS facts_value_fts_idx ON facts USING gin (to_tsvector('english', value));

-- pgvector index (ivfflat) - requires reindexing after inserts
-- Make sure pgvector extension is installed in the DB image
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'facts_embedding_idx') THEN
    EXECUTE 'CREATE INDEX facts_embedding_idx ON facts USING ivfflat (embedding vector_cosine_ops)';
  END IF;
EXCEPTION WHEN others THEN
  -- Ignore index creation errors if ivfflat not available in this environment
  RAISE NOTICE 'Could not create ivfflat index for facts.embedding: %', SQLERRM;
END$$;

-- Trigger to update updated_at on row changes
CREATE OR REPLACE FUNCTION facts_update_timestamp() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_facts_update_timestamp
BEFORE UPDATE ON facts
FOR EACH ROW
EXECUTE PROCEDURE facts_update_timestamp();

-- match_facts RPC: accepts an embedded query or raw query text and returns top K matches
-- This function expects the caller to pass an embedding (vector) and match_count
-- But we also provide a wrapper that can accept a text query and call server-side embedding service if available

-- Basic function that finds nearest facts using cosine similarity
CREATE OR REPLACE FUNCTION match_facts(query_embedding vector(1536), match_count int DEFAULT 10)
RETURNS TABLE(id uuid, org_id uuid, user_id uuid, kind text, key text, value text, metadata jsonb, importance numeric, access_count integer, last_accessed timestamptz, score float) AS $$
BEGIN
  RETURN QUERY
  SELECT f.id, f.org_id, f.user_id, f.kind, f.key, f.value, f.metadata, f.importance, f.access_count, f.last_accessed,
    1 - (f.embedding <=> query_embedding) AS score
  FROM facts f
  WHERE f.embedding IS NOT NULL
  ORDER BY f.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;
