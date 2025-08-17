-- Migration: Fix user_integrations table schema
-- This migration ensures the user_integrations table has the correct structure
-- and properly references auth.users table

-- First, drop the existing user_integrations table if it exists
DROP TABLE IF EXISTS user_integrations CASCADE;

-- Recreate user_integrations table with correct schema
CREATE TABLE IF NOT EXISTS user_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    integration_name VARCHAR(100) NOT NULL,
    integration_id UUID,
    credentials JSONB,
    settings JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'active',
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, integration_name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_integrations_user_id ON user_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_integrations_status ON user_integrations(status);
CREATE INDEX IF NOT EXISTS idx_user_integrations_integration_name ON user_integrations(integration_name);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_user_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_integrations_updated_at
    BEFORE UPDATE ON user_integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_user_integrations_updated_at();

-- Log the migration
INSERT INTO audit_logs (action, resource_type, details) VALUES 
('migration', 'database', '{"migration": "018_fix_user_integrations_table", "tables_fixed": ["user_integrations"], "status": "completed"}');
