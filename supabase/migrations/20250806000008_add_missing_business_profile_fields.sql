-- Add missing onboarding fields to business_profiles table
-- These fields are required by the complete-onboarding Edge Function

-- Add company_id field to business_profiles
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Add business_challenges field to business_profiles
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS business_challenges TEXT[] DEFAULT '{}';

-- Add selected_integrations field to business_profiles
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS selected_integrations TEXT[] DEFAULT '{}';

-- Add selected_use_cases field to business_profiles
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS selected_use_cases TEXT[] DEFAULT '{}';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_profiles_company_id ON public.business_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_business_profiles_business_challenges_gin ON public.business_profiles USING gin(business_challenges);
CREATE INDEX IF NOT EXISTS idx_business_profiles_selected_integrations_gin ON public.business_profiles USING gin(selected_integrations);
CREATE INDEX IF NOT EXISTS idx_business_profiles_selected_use_cases_gin ON public.business_profiles USING gin(selected_use_cases); 