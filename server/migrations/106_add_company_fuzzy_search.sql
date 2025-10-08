-- Migration: 106_add_company_fuzzy_search
-- Purpose: Add normalized name and tax_id columns for companies and enable trigram similarity search
-- Notes:
--  - CREATE INDEX CONCURRENTLY cannot run inside a transaction block. If your migration runner executes migrations inside a transaction,
--    run the CREATE INDEX CONCURRENTLY step manually or adjust the runner to allow non-transactional statements.

-- 1) Enable helpful extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- unaccent is optional but helpful for accent-insensitive matching
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 2) Add name_normalized and tax_id columns if they don't exist
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS name_normalized TEXT,
  ADD COLUMN IF NOT EXISTS tax_id VARCHAR(255);

-- 3) Backfill name_normalized from existing name values
-- Use unaccent + lower if unaccent is available, otherwise fallback to lower(name)
DO $$
BEGIN
  -- safe update: only update rows where name_normalized is null
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'unaccent') THEN
    UPDATE companies SET name_normalized = lower(unaccent(name)) WHERE name_normalized IS NULL;
  ELSE
    UPDATE companies SET name_normalized = lower(name) WHERE name_normalized IS NULL;
  END IF;
  -- populate tax_id from tax_info JSONB if present (common key: tax_id)
  UPDATE companies SET tax_id = (tax_info->> 'tax_id')
    WHERE tax_id IS NULL AND tax_info IS NOT NULL AND tax_info ? 'tax_id';
END$$;

-- 4) Create trigram index on name_normalized for fast fuzzy matching
-- Use CONCURRENTLY to avoid long locks on production tables. If your migration runner disallows CONCURRENTLY,
-- run the CREATE INDEX statement separately (outside transactions) or remove CONCURRENTLY (but be aware of locks).
-- Note: many migration runners wrap files in transactions; CONCURRENTLY will fail inside a transaction block.
-- Attempt a non-transactional creation if possible; fall back to a regular index if necessary.

-- Try to create index concurrently; if that fails the admin should run the statement manually:
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_name_normalized_trgm ON companies USING GIN (name_normalized gin_trgm_ops);

-- We'll create a regular index here as a safe default; ops teams can replace it with CONCURRENTLY in production.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'idx_companies_name_normalized_trgm'
  ) THEN
    EXECUTE 'CREATE INDEX idx_companies_name_normalized_trgm ON companies USING GIN (name_normalized gin_trgm_ops)';
  END IF;
END$$;

-- 5) Trigger function to maintain name_normalized on updates/inserts
CREATE OR REPLACE FUNCTION companies_set_name_normalized()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.name IS DISTINCT FROM OLD.name OR TG_OP = 'INSERT' THEN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'unaccent') THEN
      NEW.name_normalized := lower(unaccent(NEW.name));
    ELSE
      NEW.name_normalized := lower(NEW.name);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to companies
DROP TRIGGER IF EXISTS trg_companies_set_name_normalized ON companies;
CREATE TRIGGER trg_companies_set_name_normalized
  BEFORE INSERT OR UPDATE OF name ON companies
  FOR EACH ROW
  EXECUTE FUNCTION companies_set_name_normalized();

-- 6) NOTE: do NOT insert into `schema_migrations` here — your migration runner
-- should record applied migrations. A manual insert previously caused a
-- duplicate-key error when the runner also tried to record the migration.

-- End of migration
