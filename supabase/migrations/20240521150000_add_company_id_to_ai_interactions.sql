ALTER TABLE public.ai_interactions
ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Create an index on the new company_id column for performance
CREATE INDEX IF NOT EXISTS idx_ai_interactions_company_id ON public.ai_interactions(company_id);

-- Update RLS policies to include company_id checks
-- First, drop the old policies
DROP POLICY "Users can view own AI interactions" ON public.ai_interactions;
DROP POLICY "Users can insert own AI interactions" ON public.ai_interactions;

-- Recreate policies with company membership check
CREATE POLICY "Users can view own AI interactions" ON public.ai_interactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI interactions" ON public.ai_interactions
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid() AND user_profiles.company_id = ai_interactions.company_id
        )
    ); 