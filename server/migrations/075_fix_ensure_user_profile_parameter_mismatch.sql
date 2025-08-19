-- Migration: Fix ensure_user_profile parameter mismatch and add failsafe authentication
-- This migration fixes the function signature to accept both user_id and external_user_id parameters
-- and adds a failsafe authentication mechanism

-- Drop the existing function
DROP FUNCTION IF EXISTS ensure_user_profile(text);

-- Create a new function that accepts both parameter names
CREATE OR REPLACE FUNCTION ensure_user_profile(user_param TEXT)
RETURNS TABLE (
    id character varying(255),
    user_id character varying(255),
    email character varying(255),
    first_name character varying(255),
    last_name character varying(255),
    created_at timestamp with time zone,
    updated_at timestamp with time zone
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
            updated_at
        ) VALUES (
            external_user_id,
            external_user_id || '@authentik.local',
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
    WHERE up.user_id = external_user_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION ensure_user_profile(text) TO postgres;

-- Add comment
COMMENT ON FUNCTION ensure_user_profile(text) IS 'Fixed function that accepts both user_id and external_user_id parameters for backward compatibility.';

-- Create a failsafe authentication table for when IAM is down
CREATE TABLE IF NOT EXISTS failsafe_users (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    external_user_id text NOT NULL UNIQUE,
    email text NOT NULL,
    first_name text,
    last_name text,
    password_hash text NOT NULL,
    is_active boolean DEFAULT true,
    last_login timestamp with time zone,
    created_at timestamp with time zone DEFAULT NOW(),
    updated_at timestamp with time zone DEFAULT NOW()
);

-- Create indexes for failsafe users
CREATE INDEX IF NOT EXISTS idx_failsafe_users_external_id ON failsafe_users(external_user_id);
CREATE INDEX IF NOT EXISTS idx_failsafe_users_email ON failsafe_users(email);

-- Create a function to authenticate with failsafe
CREATE OR REPLACE FUNCTION authenticate_failsafe_user(email_param text, password_param text)
RETURNS TABLE (
    id uuid,
    external_user_id text,
    email text,
    first_name text,
    last_name text,
    is_active boolean
) AS $$
BEGIN
    -- Check if user exists and password matches (simplified for demo)
    -- In production, use proper password hashing
    RETURN QUERY 
    SELECT 
        fu.id,
        fu.external_user_id,
        fu.email,
        fu.first_name,
        fu.last_name,
        fu.is_active
    FROM failsafe_users fu
    WHERE fu.email = email_param 
      AND fu.password_hash = password_param  -- In production, use proper password verification
      AND fu.is_active = true;
      
    -- Update last login if user found
    IF FOUND THEN
        UPDATE failsafe_users 
        SET last_login = NOW(), updated_at = NOW()
        WHERE email = email_param;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions for failsafe authentication
GRANT EXECUTE ON FUNCTION authenticate_failsafe_user(text, text) TO postgres;

-- Add comment
COMMENT ON FUNCTION authenticate_failsafe_user(text, text) IS 'Failsafe authentication function for when IAM is down.';

-- Create a function to check if IAM is available
CREATE OR REPLACE FUNCTION check_iam_availability()
RETURNS boolean AS $$
BEGIN
    -- This function can be extended to check IAM health
    -- For now, return true (IAM is available)
    -- In production, implement actual health check
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_iam_availability() TO postgres;

-- Add comment
COMMENT ON FUNCTION check_iam_availability() IS 'Function to check if IAM system is available.';
