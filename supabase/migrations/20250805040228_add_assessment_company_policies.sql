-- Migration: Add company-based RLS policies for assessment tables
-- This migration adds the complex RLS policies that reference user_profiles.company_id
-- It runs after the company_id column is added to user_profiles

-- Drop the simple policies first
DROP POLICY IF EXISTS "Allow authenticated users to access assessment summary" ON public.assessment_summary;
DROP POLICY IF EXISTS "Allow authenticated users to access assessment category scores" ON public.assessment_category_score;
DROP POLICY IF EXISTS "Allow authenticated users to access assessment responses" ON public.assessment_response;

-- Create the comprehensive policies that include company-based access
CREATE POLICY "Company users can access assessment summary" ON public.assessment_summary
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.company_id = assessment_summary.company_id
            AND user_profiles.id = auth.uid()
        )
    );

CREATE POLICY "Company users can access assessment category scores" ON public.assessment_category_score
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.company_id = assessment_category_score.company_id
            AND user_profiles.id = auth.uid()
        )
    );

CREATE POLICY "Company users can access assessment responses" ON public.assessment_response
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.company_id = assessment_response.company_id
            AND user_profiles.id = auth.uid()
        )
    );

-- Add comments for documentation
COMMENT ON POLICY "Company users can access assessment summary" ON public.assessment_summary IS 
    'Users can access assessment summaries for their company';
COMMENT ON POLICY "Company users can access assessment category scores" ON public.assessment_category_score IS 
    'Users can access assessment category scores for their company';
COMMENT ON POLICY "Company users can access assessment responses" ON public.assessment_response IS 
    'Users can access assessment responses for their company'; 