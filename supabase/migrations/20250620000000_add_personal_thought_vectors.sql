-- Add personal thought vector storage for Second Brain (Personal Memory) embeddings
-- Requires pgvector extension (enabled globally)

-- Safety: ensure extension
CREATE EXTENSION IF NOT EXISTS "vector";

-- Table to store embeddings of personal_thoughts content
CREATE TABLE IF NOT EXISTS public.ai_personal_thought_vectors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    thought_id UUID NOT NULL REFERENCES public.personal_thoughts(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    content_embedding VECTOR(1536) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Index for ANN search
CREATE INDEX IF NOT EXISTS idx_ai_personal_thought_vectors_embedding
    ON public.ai_personal_thought_vectors USING ivfflat (content_embedding vector_cosine_ops);

-- Trigger to keep updated_at (reuse global helper if exists)
CREATE TRIGGER update_ai_personal_thought_vectors_updated_at
    BEFORE UPDATE ON public.ai_personal_thought_vectors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.ai_personal_thought_vectors ENABLE ROW LEVEL SECURITY;

-- Policy: only owner (via personal_thoughts) or service_role can select
CREATE POLICY "Users can view own thought vectors" ON public.ai_personal_thought_vectors
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.personal_thoughts pt
            WHERE pt.id = thought_id AND pt.user_id = auth.uid()
        ) OR auth.jwt() ->> 'role' = 'service_role'
    );

-- Service role can insert/delete/update
CREATE POLICY "Service role can manage thought vectors" ON public.ai_personal_thought_vectors
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role'); 