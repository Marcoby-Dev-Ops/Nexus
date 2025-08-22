-- Migration: Add slug to integrations table
-- This migration adds a slug column to the integrations table for better URL-friendly identifiers

-- Add slug column to integrations table
ALTER TABLE integrations ADD COLUMN IF NOT EXISTS slug VARCHAR(100);

-- Update existing integrations with default slugs based on name
UPDATE integrations 
SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]', '-', 'g'))
WHERE slug IS NULL;

-- Make slug NOT NULL after populating
ALTER TABLE integrations ALTER COLUMN slug SET NOT NULL;

-- Add unique constraint on slug
ALTER TABLE integrations ADD CONSTRAINT integrations_slug_unique UNIQUE (slug);

-- Create index on slug for performance
CREATE INDEX IF NOT EXISTS idx_integrations_slug ON integrations(slug);

-- Update user_integrations table to reference slug instead of integration_name
ALTER TABLE user_integrations ADD COLUMN IF NOT EXISTS integration_slug VARCHAR(100);

-- Update existing user_integrations with slugs from integrations table
UPDATE user_integrations 
SET integration_slug = i.slug
FROM integrations i
WHERE user_integrations.integration_name = i.name
AND user_integrations.integration_slug IS NULL;

-- Create index on integration_slug
CREATE INDEX IF NOT EXISTS idx_user_integrations_integration_slug ON user_integrations(integration_slug);

-- Add foreign key constraint
ALTER TABLE user_integrations 
ADD CONSTRAINT fk_user_integrations_integration_slug 
FOREIGN KEY (integration_slug) REFERENCES integrations(slug) ON DELETE CASCADE;
