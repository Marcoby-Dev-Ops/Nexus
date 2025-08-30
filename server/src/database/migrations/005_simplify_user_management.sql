-- Migration: Simplify User Management
-- Remove external user mapping table and use Authentik user IDs directly

-- First, we need to migrate existing data if any exists
-- Create a temporary table to store the mapping data
CREATE TEMP TABLE temp_user_mappings AS
SELECT 
    eum.external_user_id,
    eum.internal_user_id,
    u.email,
    u.first_name,
    u.last_name,
    u.role,
    u.is_active,
    u.email_verified,
    u.created_at,
    u.updated_at
FROM external_user_mappings eum
JOIN users u ON eum.internal_user_id = u.id;

-- Drop the external user mappings table
DROP TABLE IF EXISTS external_user_mappings CASCADE;

-- Drop the function that was used for mapping
DROP FUNCTION IF EXISTS get_or_create_user_mapping(VARCHAR, VARCHAR, VARCHAR);

-- Modify the users table to use Authentik user ID directly
-- First, add the external_user_id column
ALTER TABLE users ADD COLUMN IF NOT EXISTS external_user_id VARCHAR(255);

-- Update existing users with their external IDs from the temp table
UPDATE users 
SET external_user_id = temp.external_user_id
FROM temp_user_mappings temp
WHERE users.id = temp.internal_user_id;

-- Make external_user_id the primary identifier
ALTER TABLE users ALTER COLUMN external_user_id SET NOT NULL;
ALTER TABLE users ADD CONSTRAINT users_external_user_id_unique UNIQUE (external_user_id);

-- Create index on external_user_id for performance
CREATE INDEX IF NOT EXISTS idx_users_external_user_id ON users(external_user_id);

-- Update user_profiles table to reference external_user_id instead of internal UUID
-- First, add the external_user_id column to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS external_user_id VARCHAR(255);

-- Update user_profiles with external_user_id from users table
UPDATE user_profiles 
SET external_user_id = u.external_user_id
FROM users u
WHERE user_profiles.user_id = u.id;

-- Make external_user_id the primary reference in user_profiles
ALTER TABLE user_profiles ALTER COLUMN external_user_id SET NOT NULL;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_external_user_id_unique UNIQUE (external_user_id);

-- Create index on external_user_id in user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_external_user_id ON user_profiles(external_user_id);

-- Update the foreign key constraint to reference external_user_id
-- First, drop the existing foreign key
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey;

-- Add new foreign key constraint using external_user_id
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_external_user_id_fkey 
FOREIGN KEY (external_user_id) REFERENCES users(external_user_id) ON DELETE CASCADE;

-- Update user_sessions table similarly
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS external_user_id VARCHAR(255);

-- Update user_sessions with external_user_id from users table
UPDATE user_sessions 
SET external_user_id = u.external_user_id
FROM users u
WHERE user_sessions.user_id = u.id;

-- Make external_user_id the primary reference in user_sessions
ALTER TABLE user_sessions ALTER COLUMN external_user_id SET NOT NULL;

-- Create index on external_user_id in user_sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_external_user_id ON user_sessions(external_user_id);

-- Update the foreign key constraint for user_sessions
ALTER TABLE user_sessions DROP CONSTRAINT IF EXISTS user_sessions_user_id_fkey;

-- Add new foreign key constraint using external_user_id
ALTER TABLE user_sessions 
ADD CONSTRAINT user_sessions_external_user_id_fkey 
FOREIGN KEY (external_user_id) REFERENCES users(external_user_id) ON DELETE CASCADE;

-- Clean up: Drop the old UUID columns that are no longer needed
-- Note: We'll keep them for now in case there are other references, but they're no longer the primary key
-- ALTER TABLE users DROP COLUMN id;
-- ALTER TABLE user_profiles DROP COLUMN user_id;
-- ALTER TABLE user_sessions DROP COLUMN user_id;

-- Update any other tables that reference user_id to use external_user_id
-- This would need to be done for any other tables that have foreign keys to users.id

-- Clean up temp table
DROP TABLE temp_user_mappings;

-- Add a comment to document the change
COMMENT ON TABLE users IS 'Users table now uses Authentik external_user_id as primary identifier';
COMMENT ON COLUMN users.external_user_id IS 'Authentik user ID - primary identifier for the user';
COMMENT ON COLUMN users.id IS 'Legacy UUID - kept for backward compatibility but no longer primary key';
