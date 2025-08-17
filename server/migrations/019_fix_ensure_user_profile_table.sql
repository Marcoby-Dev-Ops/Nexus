-- Migration: Fix ensure_user_profile function to use correct table
-- This fixes the mismatch between auth system using user_mappings and ensure_user_profile using external_user_mappings

-- Drop the existing function
DROP FUNCTION IF EXISTS ensure_user_profile(text);

-- Create the corrected ensure_user_profile function
CREATE OR REPLACE FUNCTION ensure_user_profile(user_id_param text)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    first_name text,
    last_name text,
    email text,
    phone text,
    avatar_url text,
    bio text,
    company_name text,
    job_title text,
    location text,
    website text,
    social_links jsonb,
    preferences jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
) AS $$
DECLARE
    internal_user_id UUID;
    existing_profile RECORD;
    user_email text;
BEGIN
    -- First, try to find the internal user ID from user_mappings (used by auth system)
    SELECT um.internal_user_id INTO internal_user_id
    FROM user_mappings um
    WHERE um.external_user_id = user_id_param;
    
    -- If no mapping found in user_mappings, try external_user_mappings as fallback
    IF internal_user_id IS NULL THEN
        SELECT eum.internal_user_id INTO internal_user_id
        FROM external_user_mappings eum
        WHERE eum.external_user_id = user_id_param;
    END IF;
    
    -- If still no mapping found, try to treat the input as a UUID directly
    IF internal_user_id IS NULL THEN
        BEGIN
            internal_user_id := user_id_param::UUID;
        EXCEPTION
            WHEN OTHERS THEN
                -- If it's not a valid UUID, this is an error
                RAISE EXCEPTION 'Invalid user ID: %', user_id_param;
        END;
    END IF;
    
    -- Get user email from auth.users
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = internal_user_id;
    
    -- Now try to get existing profile using internal user ID
    SELECT * INTO existing_profile
    FROM user_profiles
    WHERE user_id = internal_user_id;
    
    -- If profile exists, return it
    IF FOUND THEN
        RETURN QUERY
        SELECT 
            up.id,
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
            up.updated_at
        FROM user_profiles up
        WHERE up.user_id = internal_user_id;
    ELSE
        -- Create new profile
        INSERT INTO user_profiles (
            user_id,
            email,
            created_at,
            updated_at
        ) VALUES (
            internal_user_id,
            user_email,
            NOW(),
            NOW()
        )
        RETURNING 
            id,
            user_id,
            first_name,
            last_name,
            email,
            phone,
            avatar_url,
            bio,
            company_name,
            job_title,
            location,
            website,
            social_links,
            preferences,
            created_at,
            updated_at
        INTO existing_profile;
        
        RETURN QUERY SELECT 
            existing_profile.id,
            existing_profile.user_id,
            existing_profile.first_name,
            existing_profile.last_name,
            existing_profile.email,
            existing_profile.phone,
            existing_profile.avatar_url,
            existing_profile.bio,
            existing_profile.company_name,
            existing_profile.job_title,
            existing_profile.location,
            existing_profile.website,
            existing_profile.social_links,
            existing_profile.preferences,
            existing_profile.created_at,
            existing_profile.updated_at;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION ensure_user_profile(text) TO postgres;
