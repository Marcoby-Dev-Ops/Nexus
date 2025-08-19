-- Migration: Fix ensure_user_profile to include onboarding_completed field
-- This migration updates the function to return the onboarding_completed field
-- that the frontend needs to determine onboarding status

-- Drop the existing function
DROP FUNCTION IF EXISTS ensure_user_profile(text);

-- Create the updated function with onboarding_completed field
CREATE OR REPLACE FUNCTION ensure_user_profile(user_param TEXT)
RETURNS TABLE (
    id character varying(255),
    user_id character varying(255),
    email character varying(255),
    first_name character varying(255),
    last_name character varying(255),
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    onboarding_completed boolean,
    onboarding_started_at timestamp with time zone,
    onboarding_completed_at timestamp with time zone,
    company_id uuid,
    display_name character varying(255),
    organization_id uuid
) AS $$
DECLARE
    profile_exists BOOLEAN;
    external_user_id TEXT;
BEGIN
    -- Use the provided parameter as external_user_id
    external_user_id := user_param;
    
    -- Ensure profile exists
    SELECT EXISTS(
        SELECT 1 FROM user_profiles up 
        WHERE up.user_id = external_user_id
    ) INTO profile_exists;

    IF NOT profile_exists THEN
        INSERT INTO user_profiles (
            user_id,
            email,
            first_name,
            last_name,
            created_at,
            updated_at,
            onboarding_completed,
            onboarding_started_at,
            onboarding_completed_at,
            company_id,
            display_name,
            organization_id
        ) VALUES (
            external_user_id,
            external_user_id || '@authentik.local',
            NULL,
            NULL,
            NOW(),
            NOW(),
            false,
            NULL,
            NULL,
            NULL,
            NULL,
            NULL
        );
    END IF;

    -- Return profile with all necessary fields including onboarding status
    RETURN QUERY 
    SELECT 
        up.user_id AS id,
        up.user_id,
        up.email,
        up.first_name,
        up.last_name,
        up.created_at,
        up.updated_at,
        up.onboarding_completed,
        up.onboarding_started_at,
        up.onboarding_completed_at,
        up.company_id,
        up.display_name,
        up.organization_id
    FROM user_profiles up
    WHERE up.user_id = external_user_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION ensure_user_profile(text) TO postgres;

-- Add comment
COMMENT ON FUNCTION ensure_user_profile(text) IS 'Updated function that includes onboarding_completed field for frontend onboarding status checks.';
