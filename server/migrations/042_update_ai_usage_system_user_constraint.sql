-- Migration: Update AI Usage constraint to use system user instead of null
-- Description: Update existing constraint to require system user ID for system operations

-- Drop the existing constraint
ALTER TABLE ai_provider_usage DROP CONSTRAINT IF EXISTS check_user_id_valid;

-- Add updated constraint to ensure user_id is either the system user or a valid UUID
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

-- Update comment to reflect the new approach
COMMENT ON TABLE ai_provider_usage IS 'AI provider usage tracking. System operations use dedicated system user ID instead of null.';
