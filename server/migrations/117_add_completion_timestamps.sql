-- 117_add_completion_timestamps.sql
-- Adds timestamp columns corresponding to completion flags and backfills existing true flags.

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS signup_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS enrollment_flow_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS business_profile_completed_at TIMESTAMPTZ;

-- Backfill: set timestamps to NOW() where flags already true but timestamp null
UPDATE user_profiles
SET signup_completed_at = COALESCE(signup_completed_at, NOW())
WHERE signup_completed = true AND signup_completed_at IS NULL;

UPDATE user_profiles
SET enrollment_flow_completed_at = COALESCE(enrollment_flow_completed_at, NOW())
WHERE enrollment_flow_completed = true AND enrollment_flow_completed_at IS NULL;

UPDATE user_profiles
SET business_profile_completed_at = COALESCE(business_profile_completed_at, NOW())
WHERE business_profile_completed = true AND business_profile_completed_at IS NULL;

COMMENT ON COLUMN user_profiles.signup_completed_at IS 'Timestamp when signup_completed first became true';
COMMENT ON COLUMN user_profiles.enrollment_flow_completed_at IS 'Timestamp when enrollment_flow_completed first became true';
COMMENT ON COLUMN user_profiles.business_profile_completed_at IS 'Timestamp when business_profile_completed first became true';
