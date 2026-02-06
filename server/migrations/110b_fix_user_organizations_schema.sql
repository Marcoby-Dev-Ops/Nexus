-- Migration: Fix user_organizations schema to match application expectations
-- Standardize around organizations.id + user_organizations.organization_id

-- Add columns used by server logic
ALTER TABLE user_organizations
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Backfill created_at from joined_at when possible
UPDATE user_organizations
SET created_at = COALESCE(created_at, joined_at)
WHERE created_at IS NULL;

-- Ensure only one primary org per user (best-effort constraint)
-- If multiple exist, keep the earliest joined as primary.
WITH ranked AS (
  SELECT id, user_id,
         ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY is_primary DESC, joined_at ASC) AS rn
  FROM user_organizations
)
UPDATE user_organizations uo
SET is_primary = (r.rn = 1)
FROM ranked r
WHERE uo.id = r.id;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_user_primary_org
ON user_organizations(user_id)
WHERE is_primary;
