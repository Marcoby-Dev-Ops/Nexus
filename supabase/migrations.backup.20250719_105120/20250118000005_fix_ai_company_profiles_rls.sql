-- Fix RLS policies for ai_company_profiles table
-- Addresses 403 Forbidden error when inserting into ai_company_profiles

-- First, drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Users can view own company profile" ON public.ai_company_profiles;
DROP POLICY IF EXISTS "Users can manage own company profile" ON public.ai_company_profiles;
DROP POLICY IF EXISTS "Users can update own company profile" ON public.ai_company_profiles;
DROP POLICY IF EXISTS "Service role can manage all company profiles" ON public.ai_company_profiles;

-- Create simpler, working RLS policies for ai_company_profiles
CREATE POLICY "Users can view own company profile" ON public.ai_company_profiles
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM public.user_profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own company profile" ON public.ai_company_profiles
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        company_id IN (
            SELECT company_id FROM public.user_profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update own company profile" ON public.ai_company_profiles
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM public.user_profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own company profile" ON public.ai_company_profiles
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM public.user_profiles 
            WHERE id = auth.uid()
        )
    );

-- Service role policy for system operations
CREATE POLICY "Service role can manage all company profiles" ON public.ai_company_profiles
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Grant necessary permissions
GRANT ALL ON public.ai_company_profiles TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.ai_company_profiles IS 'AI-enhanced company profiles with embeddings for RAG support';
COMMENT ON POLICY "Users can view own company profile" ON public.ai_company_profiles IS 'Users can view their own company profile';
COMMENT ON POLICY "Users can insert own company profile" ON public.ai_company_profiles IS 'Users can create their own company profile';
COMMENT ON POLICY "Users can update own company profile" ON public.ai_company_profiles IS 'Users can update their own company profile'; 