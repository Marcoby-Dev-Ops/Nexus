-- Migration: Add company-based RLS policies for companies
-- This migration adds the complex RLS policies that reference user_profiles.company_id
-- It runs after the company_id column is added to user_profiles

-- Drop the simple policies first
DROP POLICY IF EXISTS "Users can read own company" ON public.companies;
DROP POLICY IF EXISTS "Company owners can update company" ON public.companies;
DROP POLICY IF EXISTS "Company owners can insert companies" ON public.companies;

-- Create the comprehensive policies that include company-based access
CREATE POLICY "Users can read own company" ON public.companies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_profiles.company_id = companies.id 
            AND user_profiles.id = auth.uid()
        )
    );

CREATE POLICY "Company owners can update company" ON public.companies
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_profiles.company_id = companies.id 
            AND user_profiles.id = auth.uid()
            AND user_profiles.role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Company owners can insert companies" ON public.companies
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role IN ('owner', 'admin')
        )
    );

-- Add service role policy for admin access
CREATE POLICY "Service role can manage all companies" ON public.companies
    FOR ALL USING (auth.role() = 'service_role');

-- Add comment for documentation
COMMENT ON POLICY "Users can read own company" ON public.companies IS
    'Users can read companies they belong to';
COMMENT ON POLICY "Company owners can update company" ON public.companies IS
    'Company owners and admins can update their company';
COMMENT ON POLICY "Company owners can insert companies" ON public.companies IS
    'Company owners and admins can create new companies'; 