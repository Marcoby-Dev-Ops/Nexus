-- Migration: Create External User Mapping Table
-- This table maps external Authentik user IDs to internal UUIDs

CREATE TABLE IF NOT EXISTS external_user_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_user_id VARCHAR(255) UNIQUE NOT NULL, -- Authentik user ID (hash string)
    internal_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL DEFAULT 'authentik', -- 'authentik', 'supabase', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_external_user_mappings_external_id ON external_user_mappings(external_user_id);
CREATE INDEX IF NOT EXISTS idx_external_user_mappings_internal_id ON external_user_mappings(internal_user_id);
CREATE INDEX IF NOT EXISTS idx_external_user_mappings_provider ON external_user_mappings(provider);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_external_user_mappings_updated_at ON external_user_mappings;
CREATE TRIGGER update_external_user_mappings_updated_at 
    BEFORE UPDATE ON external_user_mappings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get or create user mapping
CREATE OR REPLACE FUNCTION get_or_create_user_mapping(
    p_external_user_id VARCHAR(255),
    p_email VARCHAR(255) DEFAULT NULL,
    p_provider VARCHAR(50) DEFAULT 'authentik'
)
RETURNS UUID AS $$
DECLARE
    v_internal_user_id UUID;
    v_user_id UUID;
BEGIN
    -- First, try to find existing mapping
    SELECT internal_user_id INTO v_internal_user_id
    FROM external_user_mappings
    WHERE external_user_id = p_external_user_id AND provider = p_provider;
    
    -- If mapping exists, return the internal user ID
    IF v_internal_user_id IS NOT NULL THEN
        RETURN v_internal_user_id;
    END IF;
    
    -- If no mapping exists, create a new user and mapping
    -- First, create the user
    INSERT INTO users (email, created_at, updated_at)
    VALUES (p_email, NOW(), NOW())
    RETURNING id INTO v_user_id;
    
    -- Then create the mapping
    INSERT INTO external_user_mappings (external_user_id, internal_user_id, provider)
    VALUES (p_external_user_id, v_user_id, p_provider);
    
    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;
