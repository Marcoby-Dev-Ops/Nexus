-- 119_promote_company_metadata_columns.sql
-- Promote business metadata from settings JSON to first-class columns for query performance.

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS business_type TEXT,
  ADD COLUMN IF NOT EXISTS funding_stage TEXT,
  ADD COLUMN IF NOT EXISTS revenue_range TEXT;

-- Backfill from settings JSON if present and columns null
UPDATE companies
SET business_type = COALESCE(business_type, settings->>'business_type')
WHERE (settings->>'business_type') IS NOT NULL AND business_type IS NULL;

UPDATE companies
SET funding_stage = COALESCE(funding_stage, settings->>'funding_stage')
WHERE (settings->>'funding_stage') IS NOT NULL AND funding_stage IS NULL;

UPDATE companies
SET revenue_range = COALESCE(revenue_range, settings->>'revenue_range')
WHERE (settings->>'revenue_range') IS NOT NULL AND revenue_range IS NULL;

COMMENT ON COLUMN companies.business_type IS 'Primary business type classification (promoted from settings JSON).';
COMMENT ON COLUMN companies.funding_stage IS 'Funding stage classification (promoted from settings JSON).';
COMMENT ON COLUMN companies.revenue_range IS 'Revenue range classification (promoted from settings JSON).';
