-- Migration: Create get_required_onboarding_steps RPC function
-- This function returns the required onboarding steps for a user

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS get_required_onboarding_steps();

-- Create the get_required_onboarding_steps function
CREATE OR REPLACE FUNCTION get_required_onboarding_steps()
RETURNS TABLE (
    step_id VARCHAR(50),
    step_name VARCHAR(255),
    step_description TEXT,
    step_order INTEGER,
    is_required BOOLEAN,
    step_type VARCHAR(50),
    step_category VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'profile_setup'::VARCHAR(50) as step_id,
        'Profile Setup'::VARCHAR(255) as step_name,
        'Complete your basic profile information'::TEXT as step_description,
        1::INTEGER as step_order,
        true::BOOLEAN as is_required,
        'form'::VARCHAR(50) as step_type,
        'profile'::VARCHAR(50) as step_category
    
    UNION ALL
    
    SELECT 
        'company_setup'::VARCHAR(50) as step_id,
        'Company Setup'::VARCHAR(255) as step_name,
        'Set up your company information'::TEXT as step_description,
        2::INTEGER as step_order,
        false::BOOLEAN as is_required,
        'form'::VARCHAR(50) as step_type,
        'company'::VARCHAR(50) as step_category
    
    UNION ALL
    
    SELECT 
        'preferences'::VARCHAR(50) as step_id,
        'Preferences'::VARCHAR(255) as step_name,
        'Configure your preferences and settings'::TEXT as step_description,
        3::INTEGER as step_order,
        false::BOOLEAN as is_required,
        'form'::VARCHAR(50) as step_type,
        'preferences'::VARCHAR(50) as step_category
    
    UNION ALL
    
    SELECT 
        'integrations'::VARCHAR(50) as step_id,
        'Integrations'::VARCHAR(255) as step_name,
        'Connect your external tools and services'::TEXT as step_description,
        4::INTEGER as step_order,
        false::BOOLEAN as is_required,
        'integration'::VARCHAR(50) as step_type,
        'integrations'::VARCHAR(50) as step_category
    
    UNION ALL
    
    SELECT 
        'tutorial'::VARCHAR(50) as step_id,
        'Tutorial'::VARCHAR(255) as step_name,
        'Learn how to use Nexus effectively'::TEXT as step_description,
        5::INTEGER as step_order,
        false::BOOLEAN as is_required,
        'tutorial'::VARCHAR(50) as step_type,
        'learning'::VARCHAR(50) as step_category
    
    ORDER BY step_order;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to public (or remove if not needed)
-- GRANT EXECUTE ON FUNCTION get_required_onboarding_steps() TO public;
