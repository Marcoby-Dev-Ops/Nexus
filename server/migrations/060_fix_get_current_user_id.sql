-- Migration: Fix get_current_user_id function to work without internal user IDs
-- This function was still trying to use the removed external_user_mappings table

-- Drop the problematic function
DROP FUNCTION IF EXISTS get_current_user_id();

-- Create the fixed function that returns the external user ID directly
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_external_user_id TEXT;
BEGIN
    -- Get the external user ID from the JWT token (Authentik user ID)
    v_external_user_id := current_setting('request.jwt.claims', true)::json->>'sub';

    -- Return the external user ID directly (no more internal user ID mapping)
    RETURN v_external_user_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_current_user_id() TO postgres;

-- Add comment
COMMENT ON FUNCTION get_current_user_id() IS 'Fixed version - returns external user ID directly without internal user ID mapping';

-- Also fix get_current_user_id_text if it exists
DROP FUNCTION IF EXISTS get_current_user_id_text();

CREATE OR REPLACE FUNCTION get_current_user_id_text()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Simply call the main function since it now returns TEXT
    RETURN get_current_user_id();
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_current_user_id_text() TO postgres;

-- Add comment
COMMENT ON FUNCTION get_current_user_id_text() IS 'Fixed version - returns external user ID as TEXT';
