-- Migration: Fix ensure_default_organization_safe function to work without internal user IDs
-- This function was still referencing the removed user_mappings table

-- Drop the problematic function
DROP FUNCTION IF EXISTS ensure_default_organization_safe(text);

-- Create the fixed function that works directly with external user IDs
CREATE OR REPLACE FUNCTION ensure_default_organization_safe(external_user_id TEXT)
RETURNS TABLE (
    id uuid,
    name character varying,
    slug character varying,
    description text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    owner_id character varying,
    is_personal boolean,
    settings jsonb
) AS $$
DECLARE
    existing_org RECORD;
    user_profile RECORD;
BEGIN
    -- Check if user has a profile
    SELECT * INTO user_profile
    FROM user_profiles up
    WHERE up.user_id = ensure_default_organization_safe.external_user_id;
    
    -- If no profile exists, create one first
    IF user_profile IS NULL THEN
        INSERT INTO user_profiles (
            user_id,
            email,
            first_name,
            last_name,
            display_name,
            onboarding_completed,
            created_at,
            updated_at
        ) VALUES (
            ensure_default_organization_safe.external_user_id,
            'user@example.com',
            NULL,
            NULL,
            NULL,
            false,
            NOW(),
            NOW()
        );
    END IF;
    
    -- Check if user already has a personal organization
    SELECT * INTO existing_org
    FROM organizations o
    WHERE o.owner_id = ensure_default_organization_safe.external_user_id
    AND o.is_personal = true;
    
    IF existing_org IS NOT NULL THEN
        -- Return existing personal organization
        RETURN QUERY SELECT 
            existing_org.id,
            existing_org.name,
            existing_org.slug,
            existing_org.description,
            existing_org.created_at,
            existing_org.updated_at,
            existing_org.owner_id,
            existing_org.is_personal,
            existing_org.settings;
    ELSE
        -- Create new personal organization
        INSERT INTO organizations (
            name,
            slug,
            description,
            owner_id,
            is_personal,
            created_at,
            updated_at,
            settings
        ) VALUES (
            'Personal Organization',
            'personal-' || ensure_default_organization_safe.external_user_id,
            'Personal organization for ' || ensure_default_organization_safe.external_user_id,
            ensure_default_organization_safe.external_user_id,
            true,
            NOW(),
            NOW(),
            '{}'::jsonb
        )
        RETURNING * INTO existing_org;
        
        RETURN QUERY SELECT 
            existing_org.id,
            existing_org.name,
            existing_org.slug,
            existing_org.description,
            existing_org.created_at,
            existing_org.updated_at,
            existing_org.owner_id,
            existing_org.is_personal,
            existing_org.settings;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION ensure_default_organization_safe(text) TO postgres;

-- Add comment
COMMENT ON FUNCTION ensure_default_organization_safe(text) IS 'Fixed version - works directly with external user IDs without internal user ID mapping';
