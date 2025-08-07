-- Migration: Add company_id column to user_profiles table
-- This migration adds the missing company_id column that is referenced in later migrations

-- Add company_id column to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

-- Create the index that was failing
CREATE INDEX IF NOT EXISTS idx_user_profiles_company_id ON public.user_profiles(company_id);

-- Add comment for documentation
COMMENT ON COLUMN public.user_profiles.company_id IS 'Reference to the company this user belongs to'; 