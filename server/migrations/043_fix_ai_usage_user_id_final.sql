-- Migration: Fix AI Usage user_id to use Authentik user IDs
-- Description: Convert user_id to VARCHAR to match user_profiles.user_id (Authentik user ID)

-- Drop existing constraints and policies
DROP POLICY IF EXISTS "Users can view their own usage" ON ai_provider_usage;
DROP POLICY IF EXISTS "Users can insert their own usage" ON ai_provider_usage;
ALTER TABLE ai_provider_usage DROP CONSTRAINT IF EXISTS check_user_id_valid;
ALTER TABLE ai_provider_usage DROP CONSTRAINT IF EXISTS ai_provider_usage_user_id_fkey;

-- Convert user_id to VARCHAR(255) to match Authentik user ID format
ALTER TABLE ai_provider_usage ALTER COLUMN user_id TYPE VARCHAR(255) USING 
  CASE 
    WHEN user_id = '00000000-0000-0000-0000-000000000001' THEN '00000000-0000-0000-0000-000000000001'
    WHEN user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN user_id::text
    ELSE '00000000-0000-0000-0000-000000000001'  -- Default to system user for invalid UUIDs
  END;

-- Add constraint to ensure user_id is either system user or valid Authentik user ID
ALTER TABLE ai_provider_usage ADD CONSTRAINT check_user_id_valid 
  CHECK (
    user_id = '00000000-0000-0000-0000-000000000001' OR 
    user_id ~ '^[0-9a-f]{64}$' OR  -- Authentik user ID format (64 hex chars)
    user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'  -- Legacy UUID format
  );

-- Recreate RLS policies for user profile access
CREATE POLICY "Users can view their own usage" ON ai_provider_usage
    FOR SELECT USING (
        user_id = '00000000-0000-0000-0000-000000000001' OR 
        user_id = auth.uid()::text
    );
    
CREATE POLICY "Users can insert their own usage" ON ai_provider_usage
    FOR INSERT WITH CHECK (
        user_id = '00000000-0000-0000-0000-000000000001' OR 
        user_id = auth.uid()::text
    );

-- Update comment to reflect the correct approach
COMMENT ON TABLE ai_provider_usage IS 'AI provider usage tracking. Uses Authentik user IDs and system user ID.';
COMMENT ON COLUMN ai_provider_usage.user_id IS 'Authentik user ID or system user ID for system operations';
