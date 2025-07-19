-- Migration: Create ai_company_profiles for richer company overview data and embeddings
-- Pillar: 1,3  (Product, Architecture)

-- Safety first: ensure pgvector extension is available
CREATE EXTENSION IF NOT EXISTS "vector";

-- 1. Table Definition
CREATE TABLE IF NOT EXISTS public.ai_company_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Foreign key to base companies table (non-ai_ table, but allowed reference)
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,

    -- Branding / Bio fields
    tagline TEXT,
    motto TEXT,
    mission_statement TEXT,
    vision_statement TEXT,
    about_md TEXT,                 -- Long-form markdown description
    logo_path TEXT,                -- Storage path or public URL
    brand_colors JSONB DEFAULT '{}'::jsonb,

    -- RAG support
    content_embedding VECTOR(1536) -- Nullable; populated by edge function or background job
);

-- Enforce one-to-one relationship between company and profile
ALTER TABLE public.ai_company_profiles
    ADD CONSTRAINT uq_ai_company_profiles_company UNIQUE (company_id);

-- Auto-maintain updated_at column
CREATE TRIGGER update_ai_company_profiles_updated_at
    BEFORE UPDATE ON public.ai_company_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Optional: index for ANN search over embeddings
CREATE INDEX IF NOT EXISTS idx_ai_company_profiles_embedding
    ON public.ai_company_profiles USING ivfflat (content_embedding vector_cosine_ops);

-- 2. Row Level Security
ALTER TABLE public.ai_company_profiles ENABLE ROW LEVEL SECURITY;

-- Users may read their own company's profile
CREATE POLICY "Users can view own company profile" ON public.ai_company_profiles
    FOR SELECT USING (
        company_id = private.get_company_id_from_user_id(auth.uid())
    );

-- Users may create/update their own company profile
CREATE POLICY "Users can manage own company profile" ON public.ai_company_profiles
    FOR INSERT WITH CHECK (
        company_id = private.get_company_id_from_user_id(auth.uid())
    );

CREATE POLICY "Users can update own company profile" ON public.ai_company_profiles
    FOR UPDATE USING (
        company_id = private.get_company_id_from_user_id(auth.uid())
    );

-- Service role catch-all (optional, but keeps parity with other ai_ tables)
CREATE POLICY "Service role can manage all company profiles" ON public.ai_company_profiles
    FOR ALL USING ( auth.jwt() ->> 'role' = 'service_role' ); 