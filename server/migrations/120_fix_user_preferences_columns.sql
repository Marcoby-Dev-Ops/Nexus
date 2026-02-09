-- Fix missing columns in user_preferences table
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS push_notifications BOOLEAN DEFAULT false;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS sidebar_collapsed BOOLEAN DEFAULT false;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_push_notifications ON user_preferences(push_notifications);
