-- Create user_licenses table to support billing and quota management
CREATE TABLE IF NOT EXISTS user_licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    license_type VARCHAR(100) NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(user_id, license_type)
);

-- Add some default licenses for existing users if needed
-- This is optional but helpful for testing
INSERT INTO user_licenses (user_id, license_type, metadata)
SELECT id, 'developer_preview', '{"source": "auto_migration"}'::jsonb
FROM users
ON CONFLICT (user_id, license_type) DO NOTHING;
