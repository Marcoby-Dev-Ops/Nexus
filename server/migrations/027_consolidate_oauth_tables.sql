-- Migration: Consolidate OAuth tables
-- This migration creates a new consolidated user_integrations table structure
-- that includes OAuth data directly in the table

-- Step 1: Create the new consolidated user_integrations table
CREATE TABLE IF NOT EXISTS user_integrations_new (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    integration_slug VARCHAR(100) NOT NULL,
    integration_id UUID REFERENCES integrations(id),
    
    -- OAuth data (consolidated from oauth_tokens)
    access_token TEXT,
    refresh_token TEXT,
    token_type VARCHAR(50) DEFAULT 'Bearer',
    expires_at TIMESTAMP WITH TIME ZONE,
    scope TEXT,
    
    -- Additional config
    settings JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'active',
    last_sync_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, integration_slug)
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_integrations_new_user_id ON user_integrations_new(user_id);
CREATE INDEX IF NOT EXISTS idx_user_integrations_new_integration_slug ON user_integrations_new(integration_slug);
CREATE INDEX IF NOT EXISTS idx_user_integrations_new_status ON user_integrations_new(status);
CREATE INDEX IF NOT EXISTS idx_user_integrations_new_expires_at ON user_integrations_new(expires_at);

-- Step 3: Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_user_integrations_new_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_integrations_new_updated_at
    BEFORE UPDATE ON user_integrations_new
    FOR EACH ROW
    EXECUTE FUNCTION update_user_integrations_new_updated_at();

-- Step 4: Drop old tables and rename new table
DROP TABLE IF EXISTS user_integrations CASCADE;
DROP TABLE IF EXISTS oauth_tokens CASCADE;

ALTER TABLE user_integrations_new RENAME TO user_integrations;

-- Step 5: Recreate triggers with correct names
DROP TRIGGER IF EXISTS trigger_update_user_integrations_new_updated_at ON user_integrations;
CREATE TRIGGER trigger_update_user_integrations_updated_at
    BEFORE UPDATE ON user_integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_user_integrations_new_updated_at();

-- Step 6: Log the migration
INSERT INTO audit_logs (action, resource_type, details) VALUES 
('migration', 'database', '{"migration": "027_consolidate_oauth_tables", "tables_consolidated": ["user_integrations", "oauth_tokens"], "status": "completed"}');
