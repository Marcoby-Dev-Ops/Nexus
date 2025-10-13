-- Migration: User Function Comments
-- Split from 096_create_user_functions_consolidated.sql

COMMENT ON FUNCTION ensure_user_profile(TEXT) IS 'Creates or retrieves a user profile for Authentik users';
COMMENT ON FUNCTION get_user_preferences(VARCHAR) IS 'Gets user preferences by user ID';
COMMENT ON FUNCTION upsert_user_preferences(VARCHAR, JSONB) IS 'Creates or updates user preferences';
COMMENT ON FUNCTION update_user_preferences(VARCHAR, JSONB) IS 'Updates specific user preference fields';
