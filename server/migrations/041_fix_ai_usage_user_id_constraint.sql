-- Migration: Fix AI Usage user_id constraint for system operations
-- Description: Use system user for onboarding operations instead of null

-- First, create a system user for onboarding operations
INSERT INTO user_profiles (user_id, first_name, last_name, email, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'System',
  'Onboarding',
  'system.onboarding@nexus.local',
  NOW(),
  NOW()
) ON CONFLICT (user_id) DO NOTHING;

-- Keep user_id NOT NULL but allow the system user ID
-- Add a check constraint to ensure user_id is either the system user or a valid UUID
ALTER TABLE ai_provider_usage ADD CONSTRAINT check_user_id_valid 
  CHECK (
    user_id = '00000000-0000-0000-0000-000000000001'::uuid OR 
    user_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  );

-- Update RLS policies to handle system user for system operations
DROP POLICY IF EXISTS "Users can view their own usage" ON ai_provider_usage;
CREATE POLICY "Users can view their own usage" ON ai_provider_usage
    FOR SELECT USING (
        user_id = '00000000-0000-0000-0000-000000000001'::uuid OR 
        auth.uid()::text = user_id::text
    );
    
DROP POLICY IF EXISTS "Users can insert their own usage" ON ai_provider_usage;
CREATE POLICY "Users can insert their own usage" ON ai_provider_usage
    FOR INSERT WITH CHECK (
        user_id = '00000000-0000-0000-0000-000000000001'::uuid OR 
        auth.uid()::text = user_id::text
    );

-- Add comment to document the system user
COMMENT ON TABLE ai_provider_usage IS 'AI provider usage tracking. System operations use dedicated system user ID.';
