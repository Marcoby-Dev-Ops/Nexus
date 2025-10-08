-- Migration: Simplify User Management
-- Clean up legacy user mapping system and document current Authentik integration

-- Drop the legacy user mappings table (no longer needed with direct Authentik integration)
DROP TABLE IF EXISTS user_mappings CASCADE;

-- Drop the function that was used for mapping
DROP FUNCTION IF EXISTS get_or_create_user_mapping(VARCHAR, VARCHAR, VARCHAR);

-- Add a comment to document the simplified user management
COMMENT ON TABLE user_profiles IS 'User profiles table uses Authentik user_id as primary identifier';
COMMENT ON COLUMN user_profiles.user_id IS 'Authentik user ID - primary identifier for the user';
