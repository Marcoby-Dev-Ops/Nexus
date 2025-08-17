-- Migration: Add display_name column to user_profiles table
-- This migration adds the missing display_name column that the application expects

-- Add display_name column to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS display_name VARCHAR(255);

-- Update existing profiles to have a display_name based on first_name and last_name
UPDATE user_profiles 
SET display_name = CASE 
    WHEN first_name IS NOT NULL AND last_name IS NOT NULL THEN first_name || ' ' || last_name
    WHEN first_name IS NOT NULL THEN first_name
    WHEN last_name IS NOT NULL THEN last_name
    ELSE 'User'
END
WHERE display_name IS NULL;

-- Create index on display_name for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_display_name ON user_profiles(display_name);

-- Drop the existing function first to avoid signature conflicts
DROP FUNCTION IF EXISTS ensure_user_profile(UUID);

-- Update the ensure_user_profile function to include display_name
CREATE OR REPLACE FUNCTION ensure_user_profile(user_id_param UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    display_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    avatar_url TEXT,
    bio TEXT,
    company_name VARCHAR(255),
    job_title VARCHAR(255),
    location VARCHAR(255),
    website VARCHAR(255),
    social_links JSONB,
    preferences JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Try to get existing profile
    RETURN QUERY
    SELECT 
        up.id,
        up.user_id,
        up.first_name,
        up.last_name,
        up.display_name,
        up.email,
        up.phone,
        up.avatar_url,
        up.bio,
        up.company_name,
        up.job_title,
        up.location,
        up.website,
        up.social_links,
        up.preferences,
        up.created_at,
        up.updated_at
    FROM user_profiles up
    WHERE up.user_id = user_id_param;
    
    -- If no profile found, create one and return it
    IF NOT FOUND THEN
        INSERT INTO user_profiles (
            user_id,
            first_name,
            last_name,
            display_name,
            email,
            phone,
            avatar_url,
            bio,
            company_name,
            job_title,
            location,
            website,
            social_links,
            preferences,
            created_at,
            updated_at
        ) VALUES (
            user_id_param,
            NULL,
            NULL,
            'User',
            NULL,
            NULL,
            NULL,
            NULL,
            NULL,
            NULL,
            NULL,
            NULL,
            '{}'::JSONB,
            '{}'::JSONB,
            NOW(),
            NOW()
        );
        
        -- Return the newly created profile
        RETURN QUERY
        SELECT 
            up.id,
            up.user_id,
            up.first_name,
            up.last_name,
            up.display_name,
            up.email,
            up.phone,
            up.avatar_url,
            up.bio,
            up.company_name,
            up.job_title,
            up.location,
            up.website,
            up.social_links,
            up.preferences,
            up.created_at,
            up.updated_at
        FROM user_profiles up
        WHERE up.user_id = user_id_param;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Log the migration
INSERT INTO audit_logs (action, resource_type, details) VALUES 
('migration', 'database', '{"migration": "022_add_display_name_to_user_profiles", "status": "completed", "note": "Added display_name column to user_profiles table"}');
