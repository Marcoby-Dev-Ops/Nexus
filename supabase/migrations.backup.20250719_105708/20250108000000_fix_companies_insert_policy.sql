-- Fix Companies Table INSERT Policy
-- Allows users to create companies during onboarding

-- Create companies table if it doesn't exist
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

-- Enable RLS on companies table
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can create companies during onboarding" ON public.companies;

-- Add INSERT policy for companies table
CREATE POLICY "Users can create companies during onboarding" ON public.companies
    FOR INSERT WITH CHECK (
        -- Allow authenticated users to create companies
        -- This is needed for the onboarding flow
        auth.uid() IS NOT NULL
    );

-- Add a comment for documentation
COMMENT ON POLICY "Users can create companies during onboarding" ON public.companies IS 
'Allows authenticated users to create companies during the onboarding process'; 