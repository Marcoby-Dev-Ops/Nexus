-- Migration: Fix companies table RLS infinite recursion during onboarding
-- This migration fixes the infinite recursion issue that occurs when creating companies during onboarding

-- Drop existing problematic policies
DROP POLICY IF EXISTS "companies_select_policy" ON public.companies;
DROP POLICY IF EXISTS "companies_insert_policy" ON public.companies;
DROP POLICY IF EXISTS "companies_update_policy" ON public.companies;
DROP POLICY IF EXISTS "companies_delete_policy" ON public.companies;

-- Create simplified policies that work during onboarding
-- SELECT: Users can read companies they own, created, or belong to
CREATE POLICY "companies_select_policy" ON public.companies
    FOR SELECT USING (
        auth.uid() = owner_id OR 
        auth.uid() = created_by OR
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_profiles.company_id = companies.id 
            AND user_profiles.id = auth.uid()
        )
    );

-- INSERT: Authenticated users can create companies (needed for onboarding)
CREATE POLICY "companies_insert_policy" ON public.companies
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- UPDATE: Users can update companies they own or created
CREATE POLICY "companies_update_policy" ON public.companies
    FOR UPDATE USING (
        auth.uid() = owner_id OR 
        auth.uid() = created_by
    );

-- DELETE: Users can delete companies they own or created
CREATE POLICY "companies_delete_policy" ON public.companies
    FOR DELETE USING (
        auth.uid() = owner_id OR 
        auth.uid() = created_by
    );

-- Keep the service role policy
-- (This should already exist, but let's make sure)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'companies' 
        AND policyname = 'companies_service_role'
    ) THEN
        CREATE POLICY "companies_service_role" ON public.companies
            FOR ALL USING (auth.role() = 'service_role');
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON POLICY "companies_select_policy" ON public.companies IS
    'Users can read companies they own, created, or belong to';
COMMENT ON POLICY "companies_insert_policy" ON public.companies IS
    'Authenticated users can create companies (needed for onboarding)';
COMMENT ON POLICY "companies_update_policy" ON public.companies IS
    'Users can update companies they own or created';
COMMENT ON POLICY "companies_delete_policy" ON public.companies IS
    'Users can delete companies they own or created'; 