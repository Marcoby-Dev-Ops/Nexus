-- Migration: Fix ensure_user_profile function
-- This fixes the function to match the actual user_profiles table schema

-- Drop the existing function
DROP FUNCTION IF EXISTS ensure_user_profile(UUID);

-- Create the corrected ensure_user_profile function
CREATE OR REPLACE FUNCTION ensure_user_profile(user_id_param UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    avatar_url TEXT,
    bio TEXT,
    company_name VARCHAR(255),
    job_title VARCHAR(255),
    location VARCHAR(255),
    website VARCHAR(255),
    social_links JSONB,
    preferences JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Try to get existing profile
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
    WHERE up.user_id = user_id_param;
    
    -- If no profile found, create one and return it
    IF NOT FOUND THEN
        INSERT INTO user_profiles (
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
        ) VALUES (
            user_id_param,
            NULL,
            NULL,
            NULL,
            NULL,
            NULL,
            NULL,
            NULL,
            NULL,
            NULL,
            NULL,
            '{}'::JSONB,
            '{}'::JSONB,
            NOW(),
            NOW()
        );
        
        -- Return the newly created profile
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
        WHERE up.user_id = user_id_param;
    END IF;
END;
$$ LANGUAGE plpgsql;
