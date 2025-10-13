-- Add missing type column to integrations table
-- This fixes the server code expecting integrations.type

ALTER TABLE integrations 
ADD COLUMN IF NOT EXISTS type VARCHAR(100);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_integrations_type ON integrations(type);