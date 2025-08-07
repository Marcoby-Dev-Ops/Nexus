-- Fix RLS policies for onboarding tables
-- This migration adds more permissive policies and service role access

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage their own onboarding steps" ON user_onboarding_steps;
DROP POLICY IF EXISTS "Users can manage their own onboarding completions" ON user_onboarding_completions;

-- Create more permissive policies for onboarding tables
CREATE POLICY "Enable all access for authenticated users on onboarding steps" 
ON user_onboarding_steps FOR ALL 
USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users on onboarding completions" 
ON user_onboarding_completions FOR ALL 
USING (auth.role() = 'authenticated');

-- Add service role policies for backend operations
CREATE POLICY "Service role can manage onboarding steps" 
ON user_onboarding_steps FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage onboarding completions" 
ON user_onboarding_completions FOR ALL 
USING (auth.role() = 'service_role');

-- Grant necessary permissions to the service role
GRANT ALL ON user_onboarding_steps TO service_role;
GRANT ALL ON user_onboarding_completions TO service_role;

-- Grant necessary permissions to authenticated users
GRANT ALL ON user_onboarding_steps TO authenticated;
GRANT ALL ON user_onboarding_completions TO authenticated; 