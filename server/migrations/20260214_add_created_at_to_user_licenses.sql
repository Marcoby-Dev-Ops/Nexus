-- Add created_at and updated_at to user_licenses for compatibility with generic DB routes
ALTER TABLE user_licenses
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Backfill created_at from issued_at if available
UPDATE user_licenses
SET created_at = issued_at
WHERE issued_at IS NOT NULL;
