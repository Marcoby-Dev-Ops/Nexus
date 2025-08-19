-- Migration: Update user_onboarding_phases table to use VARCHAR(255) for user_id
-- This migration updates the user_onboarding_phases table to use Authentik user IDs directly

-- Drop existing foreign key constraint
ALTER TABLE user_onboarding_phases DROP CONSTRAINT IF EXISTS user_onboarding_phases_user_id_fkey;

-- Update user_id column to VARCHAR(255)
ALTER TABLE user_onboarding_phases ALTER COLUMN user_id TYPE VARCHAR(255);

-- Add comment to document the change
COMMENT ON COLUMN user_onboarding_phases.user_id IS 'Authentik user ID';

-- Log the migration
INSERT INTO audit_logs (action, resource_type, details) VALUES 
('migration', 'database', '{"migration": "042_update_onboarding_phases_user_id", "status": "completed"}');
