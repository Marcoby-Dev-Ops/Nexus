-- Migration: Fix ensure_default_organization_safe ambiguous columns

-- Create a safe version of ensure_default_organization that works with external user IDs
CREATE OR REPLACE FUNCTION ensure_default_organization_safe(external_user_id TEXT)
RETURNS UUID AS $$
DECLARE
    org_id UUID;
    user_email TEXT;
    user_name TEXT;
BEGIN
    -- Check if user already has an organization (fix the JOIN type mismatch)
    SELECT uo.org_id INTO org_id
    FROM user_organizations uo
    INNER JOIN user_mappings um ON uo.user_id = um.internal_user_id::text
    WHERE um.external_user_id = ensure_default_organization_safe.external_user_id
    LIMIT 1;
    
    -- If user already has an organization, return it
    IF org_id IS NOT NULL THEN
        RETURN org_id;
    END IF;
    
    -- Get user email from users table via user_mappings (fix ambiguous columns)
    SELECT u.email INTO user_email
    FROM users u
    INNER JOIN user_mappings um ON u.id::uuid = um.internal_user_id
    WHERE um.external_user_id = ensure_default_organization_safe.external_user_id;
    
    -- Get user name for organization name (handle case where profile doesn't exist yet)
    SELECT 
        CASE 
            WHEN up.first_name IS NOT NULL AND up.last_name IS NOT NULL 
            THEN up.first_name || ' ' || up.last_name
            WHEN up.first_name IS NOT NULL 
            THEN up.first_name
            WHEN up.display_name IS NOT NULL 
            THEN up.display_name
            ELSE 'Personal Organization'
        END INTO user_name
    FROM user_profiles up
    WHERE up.user_id = ensure_default_organization_safe.external_user_id;
    
    -- Create default organization
    INSERT INTO organizations (name, description, slug, tenant_id, settings, created_at, updated_at)
    VALUES (
        COALESCE(user_name, 'Personal Organization'),
        'Default organization for ' || COALESCE(user_email, 'user'),
        'personal-' || ensure_default_organization_safe.external_user_id,
        (SELECT internal_user_id FROM user_mappings WHERE external_user_id = ensure_default_organization_safe.external_user_id),
        '{"is_default": true, "billing_tier": "personal"}',
        NOW(),
        NOW()
    )
    RETURNING id INTO org_id;
    
    -- Add user as owner of the organization (fix the type mismatch)
    INSERT INTO user_organizations (user_id, org_id, role, permissions, is_primary, joined_at)
    VALUES (
        (SELECT internal_user_id::text FROM user_mappings WHERE external_user_id = ensure_default_organization_safe.external_user_id),
        org_id,
        'owner',
        '["*"]',
        true,
        NOW()
    );
    
    RETURN org_id;
END;
$$ LANGUAGE plpgsql;
