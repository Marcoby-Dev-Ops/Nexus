-- Migration: Create User Preferences Function
-- This creates the get_user_preferences function used by the user-preferences service

-- Function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to get user preferences with defaults
CREATE OR REPLACE FUNCTION get_user_preferences(user_id_param UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
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
    WHERE up.user_id = user_id_param;
    
    -- If no preferences found, return default values
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            uuid_generate_v4() as id,
            user_id_param as user_id,
            'system'::VARCHAR(50) as theme,
            'en'::VARCHAR(10) as language,
            'UTC'::VARCHAR(100) as timezone,
            true as notifications_enabled,
            true as email_notifications,
            false as push_notifications,
            false as sidebar_collapsed,
            '{}'::JSONB as preferences,
            NOW() as created_at,
            NOW() as updated_at;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to upsert user preferences
CREATE OR REPLACE FUNCTION upsert_user_preferences(user_id_param UUID, preferences_json JSONB)
RETURNS TABLE (
    id UUID,
    user_id UUID,
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
    -- Try to update existing preferences
    UPDATE user_preferences 
    SET 
        theme = COALESCE(preferences_json->>'theme', theme),
        language = COALESCE(preferences_json->>'language', language),
        timezone = COALESCE(preferences_json->>'timezone', timezone),
        notifications_enabled = COALESCE((preferences_json->>'notifications_enabled')::BOOLEAN, notifications_enabled),
        email_notifications = COALESCE((preferences_json->>'email_notifications')::BOOLEAN, email_notifications),
        push_notifications = COALESCE((preferences_json->>'push_notifications')::BOOLEAN, push_notifications),
        sidebar_collapsed = COALESCE((preferences_json->>'sidebar_collapsed')::BOOLEAN, sidebar_collapsed),
        preferences = COALESCE(preferences_json->'preferences', preferences),
        updated_at = NOW()
    WHERE user_id = user_id_param;
    
    -- If no rows were updated, insert new preferences
    IF NOT FOUND THEN
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
            COALESCE(preferences_json->>'theme', 'system'),
            COALESCE(preferences_json->>'language', 'en'),
            COALESCE(preferences_json->>'timezone', 'UTC'),
            COALESCE((preferences_json->>'notifications_enabled')::BOOLEAN, true),
            COALESCE((preferences_json->>'email_notifications')::BOOLEAN, true),
            COALESCE((preferences_json->>'push_notifications')::BOOLEAN, false),
            COALESCE((preferences_json->>'sidebar_collapsed')::BOOLEAN, false),
            COALESCE(preferences_json->'preferences', '{}'::JSONB),
            NOW(),
            NOW()
        );
    END IF;
    
    -- Return the updated/inserted preferences
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
    WHERE up.user_id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- Function to update user preferences
CREATE OR REPLACE FUNCTION update_user_preferences(user_id_param UUID, updates_json JSONB)
RETURNS TABLE (
    id UUID,
    user_id UUID,
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
    -- Update existing preferences
    UPDATE user_preferences 
    SET 
        theme = COALESCE(updates_json->>'theme', theme),
        language = COALESCE(updates_json->>'language', language),
        timezone = COALESCE(updates_json->>'timezone', timezone),
        notifications_enabled = COALESCE((updates_json->>'notifications_enabled')::BOOLEAN, notifications_enabled),
        email_notifications = COALESCE((updates_json->>'email_notifications')::BOOLEAN, email_notifications),
        push_notifications = COALESCE((updates_json->>'push_notifications')::BOOLEAN, push_notifications),
        sidebar_collapsed = COALESCE((updates_json->>'sidebar_collapsed')::BOOLEAN, sidebar_collapsed),
        preferences = COALESCE(updates_json->'preferences', preferences),
        updated_at = NOW()
    WHERE user_id = user_id_param;
    
    -- Return the updated preferences
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
    WHERE up.user_id = user_id_param;
END;
$$ LANGUAGE plpgsql;
