-- Migration: Refactor to use Authentik user IDs directly (Simplified)
-- This migration removes the internal UUID mapping and uses Authentik user IDs as primary keys
-- Note: RLS policies will be handled separately

-- Step 1: Backup current data
CREATE TABLE IF NOT EXISTS user_mappings_backup AS SELECT * FROM user_mappings;
CREATE TABLE IF NOT EXISTS user_profiles_backup AS SELECT * FROM user_profiles;

-- Step 2: Create a new user_profiles table with the correct structure
CREATE TABLE IF NOT EXISTS user_profiles_new (
    user_id VARCHAR(255) PRIMARY KEY, -- Authentik user ID as primary key
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(255),
    avatar_url TEXT,
    bio TEXT,
    company_name VARCHAR(255),
    job_title VARCHAR(255),
    location VARCHAR(255),
    website VARCHAR(255),
    social_links JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    onboarding_completed BOOLEAN DEFAULT false,
    company_id UUID REFERENCES companies(id),
    onboarding_started_at TIMESTAMP WITH TIME ZONE,
    onboarding_completed_at TIMESTAMP WITH TIME ZONE,
    display_name VARCHAR(255),
    organization_id UUID REFERENCES organizations(id)
);

-- Step 3: Copy data from old table to new table
INSERT INTO user_profiles_new (
    user_id, first_name, last_name, email, phone, avatar_url, bio, 
    company_name, job_title, location, website, social_links, preferences,
    created_at, updated_at, onboarding_completed, company_id, 
    onboarding_started_at, onboarding_completed_at, display_name, organization_id
)
SELECT 
    user_id, first_name, last_name, email, phone, avatar_url, bio,
    company_name, job_title, location, website, social_links, preferences,
    created_at, updated_at, onboarding_completed, company_id,
    onboarding_started_at, onboarding_completed_at, display_name, organization_id
FROM user_profiles;

-- Step 4: Drop the old table and rename the new one
DROP TABLE user_profiles CASCADE;
ALTER TABLE user_profiles_new RENAME TO user_profiles;

-- Step 5: Create indexes on the new table
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_organization_id ON user_profiles(organization_id);

-- Step 6: Update the users view
DROP VIEW IF EXISTS users;
CREATE VIEW users AS 
SELECT 
    user_id as id,
    email,
    first_name,
    last_name,
    display_name,
    created_at,
    updated_at
FROM user_profiles;

-- Step 7: Remove the user_mappings table since we no longer need it
DROP TABLE IF EXISTS user_mappings;

-- Step 8: Add comments to document the changes
COMMENT ON TABLE user_profiles IS 'User profiles using Authentik user IDs as primary keys';
COMMENT ON COLUMN user_profiles.user_id IS 'Authentik user ID (primary key)';
COMMENT ON VIEW users IS 'View for backward compatibility, maps to user_profiles';

-- Step 9: Create a function to help with data migration if needed
CREATE OR REPLACE FUNCTION migrate_user_data_from_mappings()
RETURNS void AS $$
DECLARE
    mapping_record RECORD;
BEGIN
    -- This function can be used to migrate data from the backup if needed
    FOR mapping_record IN SELECT * FROM user_mappings_backup LOOP
        -- Update any existing records that need to be migrated
        -- This is a placeholder for any specific migration logic needed
        RAISE NOTICE 'Migration record: external_user_id=%, internal_user_id=%', 
            mapping_record.external_user_id, mapping_record.internal_user_id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
