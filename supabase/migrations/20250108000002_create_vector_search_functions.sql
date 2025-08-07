-- Migration: Create Vector Search Functions
-- This migration creates the missing RPC functions required by the assistant edge function

-- Enable the vector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "public" VERSION '0.8.0';

-- ====================================================================
-- VECTOR SEARCH FUNCTIONS
-- ====================================================================

-- Function to match documents using vector similarity search
CREATE OR REPLACE FUNCTION match_documents(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 5
)
RETURNS TABLE (
    id uuid,
    content text,
    metadata jsonb,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.content,
        t.metadata,
        1 - (t.embedding <=> query_embedding) as similarity
    FROM thoughts t
    WHERE 1 - (t.embedding <=> query_embedding) > match_threshold
    ORDER BY t.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Function to decrypt API keys (if not exists)
CREATE OR REPLACE FUNCTION decrypt_api_key(key_id_to_decrypt uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    decrypted_key text;
BEGIN
    -- This is a placeholder function - in production, you'd want proper encryption
    -- For now, we'll return the OPENAI_API_KEY environment variable
    SELECT current_setting('app.openai_api_key', true) INTO decrypted_key;
    
    IF decrypted_key IS NULL THEN
        RAISE EXCEPTION 'OpenAI API key not configured';
    END IF;
    
    RETURN decrypted_key;
END;
$$;

-- ====================================================================
-- UPDATE DOCUMENTS TABLE FOR VECTOR SEARCH
-- ====================================================================

-- Add embedding column to documents table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documents' AND column_name = 'embedding'
    ) THEN
        ALTER TABLE public.documents ADD COLUMN embedding vector(1536);
    END IF;
END $$;

-- Enable RLS on documents table if not already enabled
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for documents (if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'documents' AND policyname = 'Users can view documents'
    ) THEN
        CREATE POLICY "Users can view documents" ON public.documents
            FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'documents' AND policyname = 'Users can insert documents'
    ) THEN
        CREATE POLICY "Users can insert documents" ON public.documents
            FOR INSERT WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'documents' AND policyname = 'Users can update documents'
    ) THEN
        CREATE POLICY "Users can update documents" ON public.documents
            FOR UPDATE USING (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'documents' AND policyname = 'Users can delete documents'
    ) THEN
        CREATE POLICY "Users can delete documents" ON public.documents
            FOR DELETE USING (true);
    END IF;
END $$;

-- Create indexes for vector search performance (only if embedding column exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documents' AND column_name = 'embedding'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_documents_embedding ON public.documents USING ivfflat (embedding vector_cosine_ops);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at);

-- Create trigger for updated_at if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_documents_updated_at'
    ) THEN
        CREATE TRIGGER update_documents_updated_at 
            BEFORE UPDATE ON public.documents 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ====================================================================
-- UPDATE THOUGHTS TABLE TO INCLUDE EMBEDDING
-- ====================================================================

-- Add embedding column to thoughts table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'thoughts' AND column_name = 'embedding'
    ) THEN
        ALTER TABLE public.thoughts ADD COLUMN embedding vector(1536);
        CREATE INDEX IF NOT EXISTS idx_thoughts_embedding ON public.thoughts USING ivfflat (embedding vector_cosine_ops);
    END IF;
END $$; 