-- Migration: User Preferences Functions
-- Split from 096_create_user_functions_consolidated.sql

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
    SELECT id INTO existing_id FROM user_preferences WHERE user_id = user_id_param;
    IF existing_id IS NOT NULL THEN
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
    SELECT * INTO current_preferences FROM user_preferences WHERE user_id = user_id_param;
    IF current_preferences IS NULL THEN
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

ANALYZE user_preferences;
