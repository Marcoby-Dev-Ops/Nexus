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
        'welcome-introduction'::VARCHAR(50) as step_id,
        'Welcome to Nexus'::VARCHAR(255) as step_name,
        'Your business transformation journey starts here'::TEXT as step_description,
        1::INTEGER as step_order,
        true::BOOLEAN as is_required,
        'form'::VARCHAR(50) as step_type,
        'profile'::VARCHAR(50) as step_category
    
    UNION ALL
    
    SELECT 
        'core-identity-priorities'::VARCHAR(50) as step_id,
        'Core Identity & Priorities'::VARCHAR(255) as step_name,
        '3-4 fast questions to understand your business'::TEXT as step_description,
        2::INTEGER as step_order,
        true::BOOLEAN as is_required,
        'form'::VARCHAR(50) as step_type,
        'profile'::VARCHAR(50) as step_category
    
    UNION ALL
    
    SELECT 
        'day-1-insight-preview'::VARCHAR(50) as step_id,
        'Your First Insights'::VARCHAR(255) as step_name,
        'See your executive dashboard and opportunities'::TEXT as step_description,
        3::INTEGER as step_order,
        true::BOOLEAN as is_required,
        'preview'::VARCHAR(50) as step_type,
        'insights'::VARCHAR(50) as step_category
    
    UNION ALL
    
    SELECT 
        'ai-goal-generation'::VARCHAR(50) as step_id,
        'Your AI Goals'::VARCHAR(255) as step_name,
        'AI generates goals based on your business context'::TEXT as step_description,
        4::INTEGER as step_order,
        true::BOOLEAN as is_required,
        'ai'::VARCHAR(50) as step_type,
        'goals'::VARCHAR(50) as step_category
    
    UNION ALL
    
    SELECT 
        'action-plan-creation'::VARCHAR(50) as step_id,
        'Your Action Plan'::VARCHAR(255) as step_name,
        'AI creates your first actionable thoughts'::TEXT as step_description,
        5::INTEGER as step_order,
        true::BOOLEAN as is_required,
        'ai'::VARCHAR(50) as step_type,
        'actions'::VARCHAR(50) as step_category
    
    UNION ALL
    
    SELECT 
        'dashboard-introduction'::VARCHAR(50) as step_id,
        'Your Executive Dashboard'::VARCHAR(255) as step_name,
        'Tour your personalized business dashboard'::TEXT as step_description,
        6::INTEGER as step_order,
        true::BOOLEAN as is_required,
        'tutorial'::VARCHAR(50) as step_type,
        'dashboard'::VARCHAR(50) as step_category
    
    UNION ALL
    
    SELECT 
        'first-action-guidance'::VARCHAR(50) as step_id,
        'Your First Action'::VARCHAR(255) as step_name,
        'Take your first AI-assisted business action'::TEXT as step_description,
        7::INTEGER as step_order,
        true::BOOLEAN as is_required,
        'guidance'::VARCHAR(50) as step_type,
        'actions'::VARCHAR(50) as step_category
    
    ORDER BY step_order;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to public (or remove if not needed)
-- GRANT EXECUTE ON FUNCTION get_required_onboarding_steps() TO public;
