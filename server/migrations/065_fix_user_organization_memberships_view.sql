-- Migration: Fix ambiguous column reference in user_organization_memberships view
-- This fixes the "column reference 'user_id' is ambiguous" error

-- Drop the problematic view
DROP VIEW IF EXISTS user_organization_memberships;

-- Recreate the view with explicit table aliases to avoid column ambiguity
-- Using created_at instead of joined_at since that's what actually exists
CREATE VIEW user_organization_memberships AS
SELECT 
    uo.user_id,
    uo.org_id,
    uo.role,
    uo.permissions,
    uo.is_primary,
    uo.created_at as membership_created_at,
    o.name as organization_name,
    o.slug as organization_slug,
    o.description as organization_description,
    o.created_at as organization_created_at,
    o.updated_at as organization_updated_at
FROM user_organizations uo
JOIN organizations o ON uo.org_id = o.id
JOIN user_profiles up ON uo.user_id = up.user_id;

-- Grant necessary permissions
GRANT SELECT ON user_organization_memberships TO postgres;

-- Add comment for documentation
COMMENT ON VIEW user_organization_memberships IS 'View showing user memberships in organizations using Authentik user IDs with explicit table aliases to avoid column ambiguity';
