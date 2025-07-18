-- Fix Companies Table INSERT Policy
-- Allows users to create companies during onboarding

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