-- Migration 021: Fix onboarding tables foreign key constraints
-- This migration fixes the foreign key constraints to reference user_profiles instead of auth.users

-- Drop existing foreign key constraints
ALTER TABLE user_onboarding_steps DROP CONSTRAINT IF EXISTS user_onboarding_steps_user_id_fkey;
ALTER TABLE user_onboarding_completions DROP CONSTRAINT IF EXISTS user_onboarding_completions_user_id_fkey;

-- Add new foreign key constraints referencing user_profiles
ALTER TABLE user_onboarding_steps 
ADD CONSTRAINT user_onboarding_steps_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE user_onboarding_completions 
ADD CONSTRAINT user_onboarding_completions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- Update RLS policies to use the correct user ID reference
DROP POLICY IF EXISTS "Users can manage their own onboarding steps" ON user_onboarding_steps;
DROP POLICY IF EXISTS "Users can manage their own onboarding completions" ON user_onboarding_completions;

-- Create new policies that work with the user_profiles reference
CREATE POLICY "Users can manage their own onboarding steps" 
ON user_onboarding_steps FOR ALL 
USING (user_id = get_current_user_id());

CREATE POLICY "Users can manage their own onboarding completions" 
ON user_onboarding_completions FOR ALL 
USING (user_id = get_current_user_id());

-- Log the migration
INSERT INTO audit_logs (action, resource_type, details) VALUES 
('migration', 'database', '{"migration": "021_fix_onboarding_foreign_keys", "status": "completed", "changes": ["fixed_foreign_keys", "updated_rls_policies"]}');
