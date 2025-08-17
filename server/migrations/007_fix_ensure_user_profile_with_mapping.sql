-- Migration: Fix ensure_user_profile function with external user mapping
-- This creates a new function that handles external user IDs (Authentik hashes) to internal UUIDs

-- Drop the existing function
DROP FUNCTION IF EXISTS ensure_user_profile(UUID);
DROP FUNCTION IF EXISTS ensure_user_profile(TEXT);

-- Create a new function that accepts either UUID or TEXT (external user ID)
CREATE OR REPLACE FUNCTION ensure_user_profile(user_id_param TEXT)
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
DECLARE
    internal_user_id UUID;
    existing_profile RECORD;
BEGIN
    -- First, try to find the internal user ID from external mapping
    SELECT internal_user_id INTO internal_user_id
    FROM external_user_mappings
    WHERE external_user_id = user_id_param;
    
    -- If no mapping found, try to treat the input as a UUID directly
    IF internal_user_id IS NULL THEN
        BEGIN
            internal_user_id := user_id_param::UUID;
        EXCEPTION
            WHEN OTHERS THEN
                -- If it's not a valid UUID, create a new user and mapping
                internal_user_id := uuid_generate_v4();
                
                -- Insert into users table
                INSERT INTO users (id, email, created_at, updated_at)
                VALUES (internal_user_id, NULL, NOW(), NOW());
                
                -- Create external mapping
                INSERT INTO external_user_mappings (external_user_id, internal_user_id, provider, created_at, updated_at)
                VALUES (user_id_param, internal_user_id, 'authentik', NOW(), NOW());
        END;
    END IF;
    
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
            internal_user_id,
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
        WHERE up.user_id = internal_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Also create a UUID version for backward compatibility
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
DECLARE
    existing_profile RECORD;
BEGIN
    -- Try to get existing profile
    SELECT * INTO existing_profile
    FROM user_profiles
    WHERE user_id = user_id_param;
    
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
        WHERE up.user_id = user_id_param;
    ELSE
        -- Create new profile
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
