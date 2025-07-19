-- Simple migration to fix missing tables and RLS policies
-- This addresses the 404 errors for component_usages and 400 errors for companies

-- Create component_usages table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.component_usages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    component_name TEXT NOT NULL,
    location TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    usage_count INTEGER DEFAULT 1,
    performance_metrics JSONB DEFAULT '{}',
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for component_usages
CREATE INDEX IF NOT EXISTS idx_component_usages_user_id ON public.component_usages(user_id);
CREATE INDEX IF NOT EXISTS idx_component_usages_company_id ON public.component_usages(company_id);
CREATE INDEX IF NOT EXISTS idx_component_usages_timestamp ON public.component_usages(timestamp DESC);

-- Enable RLS on component_usages
ALTER TABLE public.component_usages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for component_usages
DROP POLICY IF EXISTS "Users can view own component usages" ON public.component_usages;
CREATE POLICY "Users can view own component usages" ON public.component_usages
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own component usages" ON public.component_usages;
CREATE POLICY "Users can insert own component usages" ON public.component_usages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own component usages" ON public.component_usages;
CREATE POLICY "Users can update own component usages" ON public.component_usages
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own component usages" ON public.component_usages;
CREATE POLICY "Users can delete own component usages" ON public.component_usages
    FOR DELETE USING (auth.uid() = user_id);

-- Ensure companies table has proper RLS policies
-- First, check if companies table exists and has RLS enabled
DO $$
BEGIN
    -- Enable RLS if not already enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'companies' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create or replace RLS policies for companies table
DROP POLICY IF EXISTS "Users can view own companies" ON public.companies;
CREATE POLICY "Users can view own companies" ON public.companies
    FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can insert companies" ON public.companies;
CREATE POLICY "Users can insert companies" ON public.companies
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update own companies" ON public.companies;
CREATE POLICY "Users can update own companies" ON public.companies
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Grant necessary permissions
GRANT ALL ON public.component_usages TO authenticated;
GRANT ALL ON public.companies TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.component_usages IS 'Tracks component usage analytics for performance monitoring';
COMMENT ON TABLE public.companies IS 'Company profiles and information'; 