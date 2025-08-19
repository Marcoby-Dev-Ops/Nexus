-- Migration: Ensure Default Organizations for All Users (Fixed)
-- This ensures every user has a default organization for tenant-based billing and data filtering

-- Function to create default organization for a user
CREATE OR REPLACE FUNCTION ensure_default_organization(user_id UUID)
RETURNS UUID AS $$
DECLARE
    org_id UUID;
    user_email TEXT;
    user_name TEXT;
BEGIN
    -- Check if user already has an organization
    SELECT uo.org_id INTO org_id
    FROM user_organizations uo
    WHERE uo.user_id = ensure_default_organization.user_id
    LIMIT 1;
    
    -- If user already has an organization, return it
    IF org_id IS NOT NULL THEN
        RETURN org_id;
    END IF;
    
    -- Get user email from users table (not user_profiles to avoid circular dependency)
    SELECT u.email INTO user_email
    FROM users u
    WHERE u.id = ensure_default_organization.user_id;
    
    -- Get user name for organization name - try user_profiles first, fallback to users table
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
    WHERE up.user_id = ensure_default_organization.user_id;
    
    -- If no user profile exists yet, use email as fallback
    IF user_name IS NULL OR user_name = 'Personal Organization' THEN
        user_name := COALESCE(user_email, 'Personal Organization');
    END IF;
    
    -- Create default organization
    INSERT INTO organizations (name, description, slug, tenant_id, settings, created_at, updated_at)
    VALUES (
        COALESCE(user_name, 'Personal Organization'),
        'Default organization for ' || COALESCE(user_email, 'user'),
        'personal-' || ensure_default_organization.user_id::text,
        ensure_default_organization.user_id,
        '{"is_default": true, "billing_tier": "personal"}',
        NOW(),
        NOW()
    )
    RETURNING id INTO org_id;
    
    -- Add user as owner of the organization
    INSERT INTO user_organizations (user_id, org_id, role, permissions, is_primary, joined_at)
    VALUES (
        ensure_default_organization.user_id,
        org_id,
        'owner',
        '["*"]',
        true,
        NOW()
    );
    
    RETURN org_id;
END;
$$ LANGUAGE plpgsql;

-- Create default organizations for all existing users who don't have one
DO $$
DECLARE
    user_record RECORD;
    org_id UUID;
BEGIN
    FOR user_record IN 
        SELECT DISTINCT u.id as user_id 
        FROM users u 
        LEFT JOIN user_organizations uo ON u.id = uo.user_id 
        WHERE uo.user_id IS NULL
    LOOP
        SELECT ensure_default_organization(user_record.user_id) INTO org_id;
        RAISE NOTICE 'Created default organization % for user %', org_id, user_record.user_id;
    END LOOP;
END $$;

-- Create a trigger to automatically create default organization for new users
CREATE OR REPLACE FUNCTION create_default_organization_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Create default organization for new user profile
    PERFORM ensure_default_organization(NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on user_profiles table (since users is a view)
DROP TRIGGER IF EXISTS create_default_organization_on_user_profile_insert ON user_profiles;
CREATE TRIGGER create_default_organization_on_user_profile_insert
    AFTER INSERT ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_default_organization_trigger();

-- Add organization_id to user_profiles for easier access (if not already present)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN organization_id UUID REFERENCES organizations(id);
    END IF;
END $$;

-- Update existing user_profiles with their primary organization
UPDATE user_profiles 
SET organization_id = (
    SELECT uo.org_id 
    FROM user_organizations uo 
    WHERE uo.user_id = user_profiles.user_id 
    AND uo.is_primary = true 
    LIMIT 1
)
WHERE organization_id IS NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_organization_id ON user_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_user_id ON user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_org_id ON user_organizations(org_id);
