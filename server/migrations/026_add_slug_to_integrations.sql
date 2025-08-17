-- Migration: Add slug column to integrations table
-- This migration adds a slug column to the integrations table for better integration identification

-- Add slug column to integrations table
ALTER TABLE integrations ADD COLUMN IF NOT EXISTS slug VARCHAR(100);

-- Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_integrations_slug ON integrations(slug);

-- Update existing integrations with appropriate slugs
UPDATE integrations SET slug = 'openai' WHERE name = 'OpenAI' AND type = 'ai';
UPDATE integrations SET slug = 'anthropic' WHERE name = 'Anthropic' AND type = 'ai';
UPDATE integrations SET slug = 'hubspot' WHERE name = 'HubSpot' AND type = 'crm';
UPDATE integrations SET slug = 'slack' WHERE name = 'Slack' AND type = 'communication';

-- Insert Microsoft 365 integration if it doesn't exist
INSERT INTO integrations (id, name, type, slug, description, config_schema, is_active, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'Microsoft 365',
    'productivity',
    'microsoft365',
    'Microsoft 365 integration for email, calendar, and file access',
    '{"access_token": "string", "refresh_token": "string", "scope": "string", "expires_at": "string"}',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM integrations WHERE slug = 'microsoft365'
);

-- Insert Google Workspace integration if it doesn't exist
INSERT INTO integrations (id, name, type, slug, description, config_schema, is_active, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'Google Workspace',
    'productivity',
    'google-workspace',
    'Google Workspace integration for Gmail, Calendar, and Drive',
    '{"access_token": "string", "refresh_token": "string", "scope": "string", "expires_at": "string"}',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM integrations WHERE slug = 'google-workspace'
);

-- Insert Marcoby Cloud integration if it doesn't exist
INSERT INTO integrations (id, name, type, slug, description, config_schema, is_active, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'Marcoby Cloud',
    'productivity',
    'marcoby-cloud',
    'Marcoby Cloud email integration',
    '{"imap_host": "string", "imap_port": "number", "smtp_host": "string", "smtp_port": "number", "username": "string", "password": "string"}',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM integrations WHERE slug = 'marcoby-cloud'
);

-- Log the migration
INSERT INTO audit_logs (action, resource_type, details) VALUES 
('migration', 'database', '{"migration": "026_add_slug_to_integrations", "tables_modified": ["integrations"], "status": "completed"}');
