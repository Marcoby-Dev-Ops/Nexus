-- Create AI Embedding Cache table for deduplicating OpenAI embedding calls
-- Pillar 9 – Cost Discipline
-- Provides a simple checksum-based cache so that duplicate texts
-- do not trigger new embedding requests.

-- Ensure pgvector extension is available (noop if already installed)
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS public.ai_embedding_cache (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  checksum TEXT UNIQUE NOT NULL,
  content TEXT,
  embedding VECTOR(1536) NOT NULL
);

-- Performance index for quick lookup by checksum
CREATE INDEX IF NOT EXISTS idx_ai_embedding_cache_checksum ON public.ai_embedding_cache (checksum);

-- Row-Level Security: locked down, only service role may access
ALTER TABLE public.ai_embedding_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage ai_embedding_cache" ON public.ai_embedding_cache
  FOR ALL USING (true) WITH CHECK (true); 