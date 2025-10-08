-- Migration: Add enrollment_flow_completed column to user_profiles
-- Date: 2025-10-07
-- Adds a boolean flag to track completion of the enrollment flow separately from signup and business profile completion.
-- Safe/Idempotent: Uses ADD COLUMN IF NOT EXISTS.

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS enrollment_flow_completed BOOLEAN DEFAULT false;

COMMENT ON COLUMN user_profiles.enrollment_flow_completed IS 'Indicates the user has completed the enrollment flow (post-signup enrichment).';
