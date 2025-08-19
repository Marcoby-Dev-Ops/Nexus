-- Migration: Create missing user mappings for existing users

-- Create mappings for existing user profiles that don't have one
INSERT INTO user_mappings (external_user_id, internal_user_id, created_at, updated_at)
SELECT 
    up.user_id as external_user_id,
    up.user_id::uuid as internal_user_id,
    NOW() as created_at,
    NOW() as updated_at
FROM user_profiles up
LEFT JOIN user_mappings um ON up.user_id = um.external_user_id
WHERE um.external_user_id IS NULL
ON CONFLICT (external_user_id) DO NOTHING;
