-- Remove redundant users table and consolidate to auth.users
-- This migration eliminates duplicate user data and simplifies the schema

-- Step 1: Update external_user_mappings foreign key to point to auth.users
-- First, drop the existing foreign key constraint
ALTER TABLE external_user_mappings DROP CONSTRAINT IF EXISTS external_user_mappings_internal_user_id_fkey;

-- Update the mapping to use auth.users IDs instead of users table IDs
-- Map the existing users to their auth.users equivalents
UPDATE external_user_mappings 
SET internal_user_id = '7915b0c7-3358-4e6b-a31c-70b0269ce8b2'  -- vonj@marcoby.com in auth.users
WHERE external_user_id = 'd2770389274aad9319e41dc713cb5c8206cc84f0cadf10e49c17dc329e66eec3';

-- Add new mapping for admin user if needed
INSERT INTO external_user_mappings (external_user_id, internal_user_id, provider, created_at, updated_at)
SELECT 
    'admin-external-id',  -- This will need to be updated with actual Authentik ID
    '550e8400-e29b-41d4-a716-446655440000',  -- admin@nexus.local in auth.users
    'authentik',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM external_user_mappings WHERE internal_user_id = '550e8400-e29b-41d4-a716-446655440000'
);

-- Step 2: Update user_profiles to use auth.users IDs
-- First, update the user profile for vonj@marcoby.com
UPDATE user_profiles 
SET user_id = '7915b0c7-3358-4e6b-a31c-70b0269ce8b2'  -- vonj@marcoby.com in auth.users
WHERE user_id = '8e662e14-df52-47f3-b1ae-d2314c65c9e0';  -- vonj@marcoby.com in users

-- Update the user profile for user@nexus.local
UPDATE user_profiles 
SET user_id = 'ddcc866f-33f8-4eee-91e9-b36a45fa4a8b'  -- user@nexus.local in auth.users
WHERE user_id = 'ddcc866f-33f8-4eee-91e9-b36a45fa4a8b';  -- user@nexus.local in users (same ID)

-- Step 3: Update user_preferences to use auth.users IDs
UPDATE user_preferences 
SET user_id = '7915b0c7-3358-4e6b-a31c-70b0269ce8b2'  -- vonj@marcoby.com in auth.users
WHERE user_id = '8e662e14-df52-47f3-b1ae-d2314c65c9e0';  -- vonj@marcoby.com in users

-- Step 4: Add foreign key constraint to auth.users
-- Note: We can't add a foreign key to auth.users directly, so we'll rely on application-level validation
-- The external_user_mappings table will serve as the bridge between Authentik and internal user IDs

-- Step 5: Drop the redundant users table and view
-- First drop the view if it exists
DROP VIEW IF EXISTS users;
-- Then drop the table if it exists
DROP TABLE IF EXISTS users CASCADE;

-- Step 6: Update any remaining references to use auth.users
-- Create a view to make auth.users accessible as 'users' for backward compatibility
CREATE OR REPLACE VIEW users AS 
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    updated_at,
    CASE 
        WHEN email = 'vonj@marcoby.com' THEN 'Von'
        WHEN email = 'admin@nexus.local' THEN 'Admin'
        WHEN email = 'user@nexus.local' THEN 'User'
        ELSE 'User'
    END as first_name,
    CASE 
        WHEN email = 'vonj@marcoby.com' THEN 'Jackson'
        WHEN email = 'admin@nexus.local' THEN 'User'
        WHEN email = 'user@nexus.local' THEN 'Nexus'
        ELSE 'User'
    END as last_name,
    'user' as role,
    true as is_active,
    CASE WHEN email_confirmed_at IS NOT NULL THEN true ELSE false END as email_verified
FROM auth.users;

-- Log the migration
INSERT INTO audit_logs (action, resource_type, details) VALUES 
('migration', 'database', '{"migration": "017_remove_redundant_users_table", "tables_removed": ["users"], "status": "completed", "users_consolidated": 3}');
