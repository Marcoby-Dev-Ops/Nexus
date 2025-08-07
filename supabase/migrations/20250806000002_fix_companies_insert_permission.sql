-- Migration: Fix companies table INSERT permission during onboarding
-- This migration ensures that authenticated users can create companies during onboarding

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "companies_insert_policy" ON public.companies;

-- Create a more permissive INSERT policy for onboarding
CREATE POLICY "companies_insert_policy" ON public.companies
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' OR 
        auth.role() = 'service_role'
    );

-- Also ensure the service role policy exists and is correct
DROP POLICY IF EXISTS "companies_service_role" ON public.companies;
CREATE POLICY "companies_service_role" ON public.companies
    FOR ALL USING (auth.role() = 'service_role');

-- Add comment for documentation
COMMENT ON POLICY "companies_insert_policy" ON public.companies IS
    'Authenticated users and service roles can create companies (needed for onboarding)';
COMMENT ON POLICY "companies_service_role" ON public.companies IS
    'Service role has full access to companies table'; 