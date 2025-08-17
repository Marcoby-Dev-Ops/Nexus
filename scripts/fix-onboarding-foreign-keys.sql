-- Fix Onboarding Foreign Key Constraints
-- Run this SQL in your Supabase Dashboard SQL Editor

-- This script fixes the foreign key constraints for onboarding tables
-- to reference user_profiles instead of auth.users

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

-- Verify the changes
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_name IN ('user_onboarding_steps', 'user_onboarding_completions')
    AND tc.constraint_type = 'FOREIGN KEY';

-- Show the updated policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('user_onboarding_steps', 'user_onboarding_completions');
