-- 015_create_companies_table.sql
-- Defines the internal companies table (distinct from external-facing organizations).
-- Companies = internal account-level entity representing the user''s own company context.

-- Ensure foundational function exists (defensive, no harm if already created)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  legal_name TEXT,
  domain TEXT,
  website TEXT,
  description TEXT,
  industry TEXT,
  size TEXT,
  timezone TEXT,
  country_code CHAR(2),
  region TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_companies_domain ON companies(domain);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry);
CREATE INDEX IF NOT EXISTS idx_companies_size ON companies(size);

-- Trigger to maintain updated_at
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE companies IS 'Internal account-level company entity (distinct from external organizations imported from third-party systems).';
COMMENT ON COLUMN companies.domain IS 'Primary domain of the internal company';
