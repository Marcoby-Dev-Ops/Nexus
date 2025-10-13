-- Migration: User Profile Functions
-- Split from 096_create_user_functions_consolidated.sql

-- Drop existing function if it exists (drop all overloads)
DROP FUNCTION IF EXISTS ensure_user_profile CASCADE;

CREATE OR REPLACE FUNCTION ensure_user_profile(p_user_id TEXT)
RETURNS TABLE(
  id UUID,
  user_id TEXT,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255),
  business_email VARCHAR(255),
  personal_email VARCHAR(255),
  phone VARCHAR(20),
  mobile VARCHAR(20),
  work_phone VARCHAR(20),
  avatar_url TEXT,
  bio TEXT,
  company_name VARCHAR(255),
  company_id UUID,
  job_title VARCHAR(255),
  role VARCHAR(50),
  department VARCHAR(100),
  display_name VARCHAR(255),
  location VARCHAR(255),
  timezone VARCHAR(50),
  work_location VARCHAR(50),
  website VARCHAR(255),
  linkedin_url VARCHAR(255),
  github_url VARCHAR(255),
  twitter_url VARCHAR(255),
  social_links JSONB,
  skills TEXT[],
  certifications TEXT[],
  languages JSONB,
  address JSONB,
  emergency_contact JSONB,
  preferences JSONB,
  status VARCHAR(20),
  onboarding_completed BOOLEAN,
  profile_completion_percentage INTEGER,
  subscription_tier VARCHAR(50),
  last_active_at TIMESTAMP WITH TIME ZONE,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_profile RECORD;
  v_company_id UUID;
BEGIN
  -- Check if profile exists
  SELECT * INTO v_profile FROM user_profiles WHERE user_id = p_user_id;
  IF v_profile IS NULL THEN
    -- Create new profile with default values
    INSERT INTO user_profiles (
      user_id,
      first_name,
      last_name,
      email,
      role,
      status,
      onboarding_completed,
      profile_completion_percentage,
      subscription_tier,
      last_active_at,
      created_at,
      updated_at
    ) VALUES (
      p_user_id,
      'User',
      '',
      '',
      'user',
      'active',
      false,
      0,
      'free',
      NOW(),
      NOW(),
      NOW()
    );
    SELECT * INTO v_profile FROM user_profiles WHERE user_id = p_user_id;
  ELSE
    UPDATE user_profiles 
    SET last_active_at = NOW(), updated_at = NOW()
    WHERE user_id = p_user_id;
    SELECT * INTO v_profile FROM user_profiles WHERE user_id = p_user_id;
  END IF;
  RETURN QUERY SELECT
    v_profile.id,
    v_profile.user_id,
    v_profile.first_name,
    v_profile.last_name,
    v_profile.email,
    v_profile.business_email,
    v_profile.personal_email,
    v_profile.phone,
    v_profile.mobile,
    v_profile.work_phone,
    v_profile.avatar_url,
    v_profile.bio,
    v_profile.company_name,
    v_profile.company_id,
    v_profile.job_title,
    v_profile.role,
    v_profile.department,
    v_profile.display_name,
    v_profile.location,
    v_profile.timezone,
    v_profile.work_location,
    v_profile.website,
    v_profile.linkedin_url,
    v_profile.github_url,
    v_profile.twitter_url,
    v_profile.social_links,
    v_profile.skills,
    v_profile.certifications,
    v_profile.languages,
    v_profile.address,
    v_profile.emergency_contact,
    v_profile.preferences,
    v_profile.status,
    v_profile.onboarding_completed,
    v_profile.profile_completion_percentage,
    v_profile.subscription_tier,
    v_profile.last_active_at,
    v_profile.last_login,
    v_profile.created_at,
    v_profile.updated_at;
END;
$$ LANGUAGE plpgsql;

ANALYZE user_profiles;
