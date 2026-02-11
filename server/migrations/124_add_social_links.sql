ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';
