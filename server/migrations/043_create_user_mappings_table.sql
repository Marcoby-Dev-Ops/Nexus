-- Migration: Create user_mappings table
-- This table maps external user IDs (from Authentik) to internal user IDs

-- Create user_mappings table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_mappings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    external_user_id character varying NOT NULL UNIQUE,
    internal_user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT NOW(),
    updated_at timestamp with time zone DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_mappings_external_user_id ON user_mappings(external_user_id);
CREATE INDEX IF NOT EXISTS idx_user_mappings_internal_user_id ON user_mappings(internal_user_id);

-- Copy data from backup if it exists
INSERT INTO user_mappings (external_user_id, internal_user_id, created_at, updated_at)
SELECT 
    external_user_id, 
    internal_user_id,
    created_at, 
    NOW()
FROM user_mappings_backup
WHERE external_user_id IS NOT NULL AND internal_user_id IS NOT NULL
ON CONFLICT (external_user_id) DO NOTHING;
