-- Migration Script: Set Company Ownership
-- This script sets the owner_id for existing companies based on user_profiles with role='owner'

-- First, let's see what companies don't have owners
SELECT 
    c.id as company_id,
    c.name as company_name,
    c.owner_id,
    up.id as user_id,
    up.email as user_email,
    up.role as user_role
FROM companies c
LEFT JOIN user_profiles up ON c.id = up.company_id AND up.role = 'owner'
WHERE c.owner_id IS NULL;

-- Update companies to set owner_id based on user_profiles with role='owner'
UPDATE companies 
SET owner_id = (
    SELECT up.id 
    FROM user_profiles up 
    WHERE up.company_id = companies.id 
    AND up.role = 'owner' 
    LIMIT 1
),
updated_at = NOW()
WHERE owner_id IS NULL 
AND EXISTS (
    SELECT 1 
    FROM user_profiles up 
    WHERE up.company_id = companies.id 
    AND up.role = 'owner'
);

-- For companies that still don't have owners, set the first user as owner
UPDATE companies 
SET owner_id = (
    SELECT up.id 
    FROM user_profiles up 
    WHERE up.company_id = companies.id 
    ORDER BY up.created_at ASC
    LIMIT 1
),
updated_at = NOW()
WHERE owner_id IS NULL 
AND EXISTS (
    SELECT 1 
    FROM user_profiles up 
    WHERE up.company_id = companies.id
);

-- Update user roles to ensure consistency
UPDATE user_profiles 
SET role = 'owner', updated_at = NOW()
WHERE id IN (
    SELECT owner_id 
    FROM companies 
    WHERE owner_id IS NOT NULL
);

-- Show final state
SELECT 
    c.id as company_id,
    c.name as company_name,
    c.owner_id,
    up.email as owner_email,
    up.role as owner_role
FROM companies c
LEFT JOIN user_profiles up ON c.owner_id = up.id
ORDER BY c.name; 