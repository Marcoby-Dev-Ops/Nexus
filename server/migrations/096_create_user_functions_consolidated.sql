-- Migration: Create User Functions (Consolidated)
-- Description: Creates all user-related database functions for profiles and preferences

-- ============================================================================
-- USER PROFILE FUNCTIONS
-- ============================================================================

-- Create ensure_user_profile function for UserProfileService
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
    
    -- Get the created profile
    SELECT * INTO v_profile FROM user_profiles WHERE user_id = p_user_id;
  ELSE
    -- Update last_active_at for existing profile
    UPDATE user_profiles 
    SET last_active_at = NOW(), updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Get the updated profile
    SELECT * INTO v_profile FROM user_profiles WHERE user_id = p_user_id;
  END IF;
  
  -- Return the profile data
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

-- ============================================================================
-- USER PREFERENCES FUNCTIONS
-- ============================================================================

-- Function to get user preferences
CREATE OR REPLACE FUNCTION get_user_preferences(user_id_param VARCHAR)
RETURNS TABLE (
    id UUID,
    user_id VARCHAR,
    theme VARCHAR(50),
    language VARCHAR(10),
    timezone VARCHAR(100),
    notifications_enabled BOOLEAN,
    email_notifications BOOLEAN,
    push_notifications BOOLEAN,
    sidebar_collapsed BOOLEAN,
    preferences JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        up.id,
        up.user_id,
        up.theme,
        up.language,
        up.timezone,
        up.notifications_enabled,
        up.email_notifications,
        up.push_notifications,
        up.sidebar_collapsed,
        up.preferences,
        up.created_at,
        up.updated_at
    FROM user_preferences up
    WHERE up.user_id = get_user_preferences.user_id_param;
END;
$$ LANGUAGE plpgsql;

-- Function to upsert user preferences
CREATE OR REPLACE FUNCTION upsert_user_preferences(user_id_param VARCHAR, preferences_json JSONB)
RETURNS TABLE (
    id UUID,
    user_id VARCHAR,
    theme VARCHAR(50),
    language VARCHAR(10),
    timezone VARCHAR(100),
    notifications_enabled BOOLEAN,
    email_notifications BOOLEAN,
    push_notifications BOOLEAN,
    sidebar_collapsed BOOLEAN,
    preferences JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    existing_id UUID;
    theme_val VARCHAR(50) := COALESCE(preferences_json->>'theme', 'system');
    language_val VARCHAR(10) := COALESCE(preferences_json->>'language', 'en');
    timezone_val VARCHAR(100) := COALESCE(preferences_json->>'timezone', 'UTC');
    notifications_enabled_val BOOLEAN := COALESCE((preferences_json->>'notifications_enabled')::BOOLEAN, true);
    email_notifications_val BOOLEAN := COALESCE((preferences_json->>'email_notifications')::BOOLEAN, true);
    push_notifications_val BOOLEAN := COALESCE((preferences_json->>'push_notifications')::BOOLEAN, false);
    sidebar_collapsed_val BOOLEAN := COALESCE((preferences_json->>'sidebar_collapsed')::BOOLEAN, false);
BEGIN
    -- Check if preferences exist for this user
    SELECT id INTO existing_id FROM user_preferences WHERE user_id = user_id_param;
    
    IF existing_id IS NOT NULL THEN
        -- Update existing preferences
        UPDATE user_preferences SET
            theme = theme_val,
            language = language_val,
            timezone = timezone_val,
            notifications_enabled = notifications_enabled_val,
            email_notifications = email_notifications_val,
            push_notifications = push_notifications_val,
            sidebar_collapsed = sidebar_collapsed_val,
            preferences = preferences_json,
            updated_at = NOW()
        WHERE user_id = user_id_param;
        
        RETURN QUERY SELECT * FROM user_preferences WHERE user_id = user_id_param;
    ELSE
        -- Insert new preferences
        INSERT INTO user_preferences (
            user_id,
            theme,
            language,
            timezone,
            notifications_enabled,
            email_notifications,
            push_notifications,
            sidebar_collapsed,
            preferences,
            created_at,
            updated_at
        ) VALUES (
            user_id_param,
            theme_val,
            language_val,
            timezone_val,
            notifications_enabled_val,
            email_notifications_val,
            push_notifications_val,
            sidebar_collapsed_val,
            preferences_json,
            NOW(),
            NOW()
        );
        
        RETURN QUERY SELECT * FROM user_preferences WHERE user_id = user_id_param;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update specific user preference fields
CREATE OR REPLACE FUNCTION update_user_preferences(user_id_param VARCHAR, updates_json JSONB)
RETURNS TABLE (
    id UUID,
    user_id VARCHAR,
    theme VARCHAR(50),
    language VARCHAR(10),
    timezone VARCHAR(100),
    notifications_enabled BOOLEAN,
    email_notifications BOOLEAN,
    push_notifications BOOLEAN,
    sidebar_collapsed BOOLEAN,
    preferences JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    existing_id UUID;
    current_preferences RECORD;
BEGIN
    -- Check if preferences exist for this user
    SELECT * INTO current_preferences FROM user_preferences WHERE user_id = user_id_param;
    
    IF current_preferences IS NULL THEN
        -- Create default preferences if none exist
        INSERT INTO user_preferences (
            user_id,
            theme,
            language,
            timezone,
            notifications_enabled,
            email_notifications,
            push_notifications,
            sidebar_collapsed,
            preferences,
            created_at,
            updated_at
        ) VALUES (
            user_id_param,
            'system',
            'en',
            'UTC',
            true,
            true,
            false,
            false,
            '{}'::JSONB,
            NOW(),
            NOW()
        );
        
        SELECT * INTO current_preferences FROM user_preferences WHERE user_id = user_id_param;
    END IF;
    
    -- Update only the fields that are provided in updates_json
    UPDATE user_preferences SET
        theme = COALESCE(updates_json->>'theme', current_preferences.theme),
        language = COALESCE(updates_json->>'language', current_preferences.language),
        timezone = COALESCE(updates_json->>'timezone', current_preferences.timezone),
        notifications_enabled = COALESCE((updates_json->>'notifications_enabled')::BOOLEAN, current_preferences.notifications_enabled),
        email_notifications = COALESCE((updates_json->>'email_notifications')::BOOLEAN, current_preferences.email_notifications),
        push_notifications = COALESCE((updates_json->>'push_notifications')::BOOLEAN, current_preferences.push_notifications),
        sidebar_collapsed = COALESCE((updates_json->>'sidebar_collapsed')::BOOLEAN, current_preferences.sidebar_collapsed),
        preferences = COALESCE(current_preferences.preferences || updates_json, updates_json),
        updated_at = NOW()
    WHERE user_id = user_id_param;
    
    RETURN QUERY SELECT * FROM user_preferences WHERE user_id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION ensure_user_profile(TEXT) IS 'Creates or retrieves a user profile for Authentik users';
COMMENT ON FUNCTION get_user_preferences(VARCHAR) IS 'Gets user preferences by user ID';
COMMENT ON FUNCTION upsert_user_preferences(VARCHAR, JSONB) IS 'Creates or updates user preferences';
COMMENT ON FUNCTION update_user_preferences(VARCHAR, JSONB) IS 'Updates specific user preference fields';


