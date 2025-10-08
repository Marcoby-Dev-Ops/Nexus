-- 012_create_user_profiles_table.sql
-- Foundational user_profiles table required by downstream migrations (AI chat, auth compatibility, contacts, etc.)
-- Distinct from external identity providers; stores internal enriched profile data.

-- Ensure trigger function exists (defensive)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id VARCHAR(255) PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  role TEXT DEFAULT 'user',
  company_id UUID,
  organization_id UUID,
  business_type TEXT,
  funding_stage TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_company_id ON user_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_org_id ON user_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE user_profiles IS 'Internal enriched user profiles linked to identity provider accounts (user_id).';
COMMENT ON COLUMN user_profiles.company_id IS 'Internal company association.';
COMMENT ON COLUMN user_profiles.organization_id IS 'External organization association (CRM/PSA imported).';
