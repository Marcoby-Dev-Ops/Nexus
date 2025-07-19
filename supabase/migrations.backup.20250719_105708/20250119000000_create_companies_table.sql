-- Create companies table for local development
-- This fixes the missing companies table issue

CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    industry TEXT,
    size TEXT,
    website TEXT,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view companies" ON public.companies;
DROP POLICY IF EXISTS "Users can create companies during onboarding" ON public.companies;
DROP POLICY IF EXISTS "Users can update own companies" ON public.companies;
DROP POLICY IF EXISTS "Users can delete own companies" ON public.companies;

-- Create basic policies
CREATE POLICY "Users can view companies" ON public.companies
    FOR SELECT USING (true);

CREATE POLICY "Users can create companies during onboarding" ON public.companies
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own companies" ON public.companies
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete own companies" ON public.companies
    FOR DELETE USING (auth.uid() IS NOT NULL); 