-- Migration: Simplify ensure_user_profile to minimal stable columns
-- Returns only id (alias), user_id, email, first_name, last_name, created_at, updated_at

DROP FUNCTION IF EXISTS ensure_user_profile(text);

CREATE OR REPLACE FUNCTION ensure_user_profile(external_user_id TEXT)
RETURNS TABLE (
    id text,
    user_id text,
    email text,
    first_name text,
    last_name text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
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
            created_at,
            updated_at
        ) VALUES (
            ensure_user_profile.external_user_id,
            ensure_user_profile.external_user_id || '@authentik.local',
            NULL,
            NULL,
            NOW(),
            NOW()
        );
    END IF;

    -- Return profile with id alias
    RETURN QUERY 
    SELECT 
        up.user_id AS id,
        up.user_id,
        up.email,
        up.first_name,
        up.last_name,
        up.created_at,
        up.updated_at
    FROM user_profiles up
    WHERE up.user_id = ensure_user_profile.external_user_id;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION ensure_user_profile(text) TO postgres;

COMMENT ON FUNCTION ensure_user_profile(text) IS 'Minimal columns with id alias to match client expectations.';
