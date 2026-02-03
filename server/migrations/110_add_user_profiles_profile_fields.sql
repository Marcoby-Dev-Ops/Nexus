-- Migration: Add missing profile fields to user_profiles for Authentik-based profile creation
--
-- Problem: Some deployments were initialized with the early 030 migration which created a minimal user_profiles
-- table (no phone/company_name/status/etc). The application UserProfileService expects these columns.
--
-- This migration is idempotent and safe to run on existing databases.

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS company_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS profile_completion_percentage INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50) DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS signup_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS business_profile_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- Ensure status constraint exists (skip if already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_profiles_status_check'
  ) THEN
    ALTER TABLE user_profiles
      ADD CONSTRAINT user_profiles_status_check
      CHECK (status IN ('active','inactive','pending','suspended'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_active_at ON user_profiles(last_active_at);
