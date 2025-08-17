-- Fix User Creation Functions for Clean Architecture
-- Update all user creation functions to work with auth.users instead of the removed users table

-- ====================================================================
-- 1. UPDATE EXTERNAL USER MAPPING FUNCTION
-- ====================================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_or_create_user_mapping(VARCHAR, VARCHAR, VARCHAR);

-- Update the get_or_create_user_mapping function to work with auth.users
CREATE OR REPLACE FUNCTION get_or_create_user_mapping(
    p_external_user_id VARCHAR(255),
    p_email VARCHAR(255) DEFAULT NULL,
    p_provider VARCHAR(50) DEFAULT 'authentik'
)
RETURNS UUID AS $$
DECLARE
    v_internal_user_id UUID;
    v_user_id UUID;
BEGIN
    -- First, try to find existing mapping
    SELECT internal_user_id INTO v_internal_user_id
    FROM external_user_mappings
    WHERE external_user_id = p_external_user_id AND provider = p_provider;
    
    -- If mapping exists, return the internal user ID
    IF v_internal_user_id IS NOT NULL THEN
        RETURN v_internal_user_id;
    END IF;
    
    -- If no mapping exists, create a new user and mapping
    -- First, create the user in auth.users
    INSERT INTO auth.users (id, email, created_at, updated_at)
    VALUES (gen_random_uuid(), p_email, NOW(), NOW())
    RETURNING id INTO v_user_id;
    
    -- Then create the mapping
    INSERT INTO external_user_mappings (external_user_id, internal_user_id, provider, created_at, updated_at)
    VALUES (p_external_user_id, v_user_id, p_provider, NOW(), NOW());
    
    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- 2. UPDATE OAUTH USER CREATION FUNCTION
-- ====================================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS handle_oauth_user_creation(text, text, text, text, boolean);

-- Function to handle OAuth callback and create user if needed
CREATE OR REPLACE FUNCTION handle_oauth_user_creation(
    oauth_user_id text,
    user_email text,
    first_name text DEFAULT NULL,
    last_name text DEFAULT NULL,
    is_verified boolean DEFAULT true
)
RETURNS TABLE (
    user_id uuid,
    is_new_user boolean,
    profile_created boolean
) AS $$
DECLARE
    existing_user_id uuid;
    new_user_id uuid;
    profile_exists boolean;
BEGIN
    -- Check if user already exists by email in auth.users
    SELECT id INTO existing_user_id 
    FROM auth.users 
    WHERE email = user_email;
    
    -- If user exists, use existing ID
    IF existing_user_id IS NOT NULL THEN
        new_user_id := existing_user_id;
    ELSE
        -- Create new user in auth.users
        INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            user_email,
            CASE WHEN is_verified THEN NOW() ELSE NULL END,
            NOW(),
            NOW()
        )
        RETURNING id INTO new_user_id;
    END IF;
    
    -- Create or update external user mapping
    INSERT INTO external_user_mappings (external_user_id, internal_user_id, provider, created_at, updated_at)
    VALUES (oauth_user_id, new_user_id, 'authentik', NOW(), NOW())
    ON CONFLICT (external_user_id) 
    DO UPDATE SET 
        internal_user_id = new_user_id,
        updated_at = NOW();
    
    -- Check if profile exists
    SELECT EXISTS(SELECT 1 FROM user_profiles WHERE user_id = new_user_id) INTO profile_exists;
    
    -- Create profile if it doesn't exist
    IF NOT profile_exists THEN
        INSERT INTO user_profiles (
            user_id, 
            first_name, 
            last_name, 
            email, 
            created_at, 
            updated_at
        ) VALUES (
            new_user_id,
            first_name,
            last_name,
            user_email,
            NOW(),
            NOW()
        );
    END IF;
    
    -- Return results
    RETURN QUERY SELECT 
        new_user_id,
        existing_user_id IS NULL,
        NOT profile_exists;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- 3. UPDATE ENSURE USER PROFILE FUNCTION
-- ====================================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS ensure_user_profile(text);

-- Function to ensure user profile exists (used by API)
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
    -- First, try to find the internal user ID from external mapping
    SELECT eum.internal_user_id INTO internal_user_id
    FROM external_user_mappings eum
    WHERE eum.external_user_id = user_id_param;
    
    -- If no mapping found, try to treat the input as a UUID directly
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

-- ====================================================================
-- 4. CREATE COMPLETE OAUTH FLOW FUNCTION
-- ====================================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS create_user_from_oauth_complete(text, text, text, text, boolean);

-- Function to handle complete OAuth user creation flow
CREATE OR REPLACE FUNCTION create_user_from_oauth_complete(
    oauth_user_id text,
    user_email text,
    first_name text DEFAULT NULL,
    last_name text DEFAULT NULL,
    is_verified boolean DEFAULT true
)
RETURNS TABLE (
    user_id uuid,
    profile_created boolean,
    mapping_created boolean
) AS $$
DECLARE
    new_user_id uuid;
    profile_exists boolean;
    mapping_exists boolean;
BEGIN
    -- Check if mapping already exists
    SELECT EXISTS(
        SELECT 1 FROM external_user_mappings 
        WHERE external_user_id = oauth_user_id
    ) INTO mapping_exists;
    
    -- If mapping exists, get the user ID
    IF mapping_exists THEN
        SELECT internal_user_id INTO new_user_id
        FROM external_user_mappings
        WHERE external_user_id = oauth_user_id;
    ELSE
        -- Create new user in auth.users
        INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            user_email,
            CASE WHEN is_verified THEN NOW() ELSE NULL END,
            NOW(),
            NOW()
        )
        RETURNING id INTO new_user_id;
        
        -- Create external mapping
        INSERT INTO external_user_mappings (external_user_id, internal_user_id, provider, created_at, updated_at)
        VALUES (oauth_user_id, new_user_id, 'authentik', NOW(), NOW());
    END IF;
    
    -- Check if profile exists
    SELECT EXISTS(SELECT 1 FROM user_profiles WHERE user_id = new_user_id) INTO profile_exists;
    
    -- Create profile if it doesn't exist
    IF NOT profile_exists THEN
        INSERT INTO user_profiles (
            user_id,
            first_name,
            last_name,
            email,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            first_name,
            last_name,
            user_email,
            NOW(),
            NOW()
        );
    END IF;
    
    -- Return results
    RETURN QUERY SELECT 
        new_user_id,
        NOT profile_exists,
        NOT mapping_exists;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- 5. GRANT PERMISSIONS
-- ====================================================================

-- Grant execute permissions on all functions
GRANT EXECUTE ON FUNCTION get_or_create_user_mapping(VARCHAR, VARCHAR, VARCHAR) TO postgres;
GRANT EXECUTE ON FUNCTION handle_oauth_user_creation(text, text, text, text, boolean) TO postgres;
GRANT EXECUTE ON FUNCTION ensure_user_profile(text) TO postgres;
GRANT EXECUTE ON FUNCTION create_user_from_oauth_complete(text, text, text, text, boolean) TO postgres;

-- Log the migration
INSERT INTO audit_logs (action, resource_type, details) VALUES 
('migration', 'database', '{"migration": "018_fix_user_creation_functions", "functions_updated": 4, "status": "completed"}');
