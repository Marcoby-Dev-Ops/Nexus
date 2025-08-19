-- Fix Phase 1 Onboarding Data
-- This script updates the existing user profile with proper email and creates missing company record

-- Update user profile with proper email (replace with actual email)
UPDATE user_profiles 
SET email = 'von.jackson@marcoby.com'  -- Replace with actual email
WHERE user_id = 'd2770389274aad9319e41dc713cb5c8206cc84f0cadf10e49c17dc329e66eec3';

-- Create company record if it doesn't exist
INSERT INTO companies (name, industry, size, owner_id, created_at, updated_at)
SELECT 
    'Marcoby',
    'technology',
    '1-10',
    'd2770389274aad9319e41dc713cb5c8206cc84f0cadf10e49c17dc329e66eec3',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM companies 
    WHERE name = 'Marcoby' 
    AND owner_id = 'd2770389274aad9319e41dc713cb5c8206cc84f0cadf10e49c17dc329e66eec3'
);

-- Update user profile to link with company
UPDATE user_profiles 
SET company_id = (
    SELECT id FROM companies 
    WHERE name = 'Marcoby' 
    AND owner_id = 'd2770389274aad9319e41dc713cb5c8206cc84f0cadf10e49c17dc329e66eec3'
    LIMIT 1
)
WHERE user_id = 'd2770389274aad9319e41dc713cb5c8206cc84f0cadf10e49c17dc329e66eec3';

-- Verify the updates
SELECT 
    up.user_id,
    up.first_name,
    up.last_name,
    up.email,
    up.company_id,
    c.name as company_name,
    c.industry,
    c.size
FROM user_profiles up
LEFT JOIN companies c ON up.company_id = c.id
WHERE up.user_id = 'd2770389274aad9319e41dc713cb5c8206cc84f0cadf10e49c17dc329e66eec3';
