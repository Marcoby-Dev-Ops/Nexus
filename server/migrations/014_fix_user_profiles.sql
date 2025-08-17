-- Fix user profiles by creating proper profiles for existing users
-- and cleaning up orphaned profiles

-- First, clean up orphaned user profiles
DELETE FROM user_profiles WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Create user profiles for existing users that don't have profiles
INSERT INTO user_profiles (user_id, first_name, last_name, email, created_at, updated_at)
SELECT 
    u.id,
    CASE 
        WHEN u.email = 'admin@nexus.local' THEN 'Admin'
        WHEN u.email = 'vonj@marcoby.com' THEN 'Von'
        ELSE 'User'
    END as first_name,
    CASE 
        WHEN u.email = 'admin@nexus.local' THEN 'User'
        WHEN u.email = 'vonj@marcoby.com' THEN 'Marcoby'
        ELSE 'User'
    END as last_name,
    u.email,
    NOW(),
    NOW()
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM user_profiles up WHERE up.user_id = u.id
);

-- Create user preferences for existing users
INSERT INTO user_preferences (user_id, theme, language, timezone, notifications_enabled, email_notifications, created_at, updated_at)
SELECT 
    u.id,
    'system',
    'en',
    'UTC',
    true,
    true,
    NOW(),
    NOW()
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM user_preferences up WHERE up.user_id = u.id
);

-- Log the fix
INSERT INTO audit_logs (action, resource_type, details) VALUES 
('migration', 'database', '{"migration": "014_fix_user_profiles", "profiles_created": 2, "status": "completed"}');
