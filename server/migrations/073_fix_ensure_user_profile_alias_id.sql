-- Migration: Redefine ensure_user_profile to return id as alias of user_id
-- Keeps table structure intact (no up.id), avoids 500s, aligns with client expectations

DROP FUNCTION IF EXISTS ensure_user_profile(text);

CREATE OR REPLACE FUNCTION ensure_user_profile(external_user_id TEXT)
RETURNS TABLE (
    id text,
    user_id text,
    first_name character varying,
    last_name character varying,
    email character varying,
    phone character varying,
    avatar_url text,
    bio text,
    company_name character varying,
    job_title character varying,
    location character varying,
    website character varying,
    social_links jsonb,
    preferences jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    onboarding_completed boolean,
    company_id uuid,
    onboarding_started_at timestamp with time zone,
    onboarding_completed_at timestamp with time zone,
    display_name character varying,
    organization_id uuid
) AS $$
DECLARE
    profile_exists BOOLEAN;
BEGIN
    -- Ensure profile exists
    SELECT EXISTS(
        SELECT 1 FROM user_profiles up 
        WHERE up.user_id = ensure_user_profile.external_user_id
    ) INTO profile_exists;

    IF NOT profile_exists THEN
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
            ensure_user_profile.external_user_id,
            ensure_user_profile.external_user_id || '@authentik.local',
            NULL,
            NULL,
            NULL,
            false,
            NOW(),
            NOW()
        );
    END IF;

    -- Return profile, with id as alias of user_id
    RETURN QUERY 
    SELECT 
        up.user_id AS id,
        up.user_id,
        up.first_name,
        up.last_name,
        up.email,
        up.phone,
        up.avatar_url,
        up.bio,
        up.company_name,
        up.job_title,
        up.location,
        up.website,
        up.social_links,
        up.preferences,
        up.created_at,
        up.updated_at,
        up.onboarding_completed,
        up.company_id,
        up.onboarding_started_at,
        up.onboarding_completed_at,
        up.display_name,
        up.organization_id
    FROM user_profiles up
    WHERE up.user_id = ensure_user_profile.external_user_id;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION ensure_user_profile(text) TO postgres;

COMMENT ON FUNCTION ensure_user_profile(text) IS 'Returns user profile, with id as alias of user_id; avoids selecting non-existent up.id.';
