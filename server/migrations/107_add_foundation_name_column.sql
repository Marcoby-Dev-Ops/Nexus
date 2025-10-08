-- Migration 107: Add foundation_name column to companies and backfill from business_identity
-- Safe migration: adds a nullable text column, backfills it from business_identity->foundation->name
-- and from companies.name as fallback. Also create an index for lookups.

BEGIN;

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS foundation_name TEXT;

-- Backfill from business_identity JSONB if present
UPDATE companies
SET foundation_name = COALESCE(
  NULLIF((business_identity->'foundation'->>'name')::text, ''),
  NULLIF(name, '')
)
WHERE foundation_name IS NULL;

-- Create an index to speed up lookups by foundation_name
CREATE INDEX IF NOT EXISTS idx_companies_foundation_name_lower ON companies (lower(coalesce(foundation_name, '')));

COMMIT;

-- Note: If your production DB is large, consider creating the index concurrently outside a transaction:
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_foundation_name_lower ON companies (lower(coalesce(foundation_name, '')));
