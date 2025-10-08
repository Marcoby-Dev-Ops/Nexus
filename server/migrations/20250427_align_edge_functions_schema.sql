-- Align schema with edge function expectations (business health & integrations)

-- Ensure user_integrations contains metadata used by integration services
ALTER TABLE user_integrations
  ADD COLUMN IF NOT EXISTS integration_slug VARCHAR(100),
  ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS integration_type VARCHAR(100);

UPDATE user_integrations
SET integration_slug = COALESCE(integration_slug, LOWER(integration_name))
WHERE integration_slug IS NULL;

UPDATE user_integrations
SET config = '{}'::jsonb
WHERE config IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_integrations_integration_slug
  ON user_integrations(integration_slug);

-- Extend business_health_snapshots to store the metrics referenced by edge functions
ALTER TABLE business_health_snapshots
  ADD COLUMN IF NOT EXISTS data_quality_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS connected_sources INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS verified_sources INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completion_percentage INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS data_sources TEXT[] DEFAULT '{}'::text[];

-- Normalise defaults for existing rows
UPDATE business_health_snapshots
SET data_quality_score = COALESCE(data_quality_score, 0),
    connected_sources = COALESCE(connected_sources, 0),
    verified_sources = COALESCE(verified_sources, 0),
    completion_percentage = COALESCE(completion_percentage, 0),
    data_sources = COALESCE(data_sources, '{}'::text[])
WHERE TRUE;

CREATE UNIQUE INDEX IF NOT EXISTS uq_business_health_snapshots_user_id
  ON business_health_snapshots(user_id);

-- Create onboarding_progress table required by business_health edge function
CREATE TABLE IF NOT EXISTS onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL UNIQUE,
  current_phase VARCHAR(100),
  completed_phases TEXT[] DEFAULT '{}'::text[],
  total_steps INTEGER DEFAULT 0,
  completed_steps INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_progress_user_id
  ON onboarding_progress(user_id);

-- Ensure updated_at trigger exists for onboarding_progress
DROP TRIGGER IF EXISTS update_onboarding_progress_updated_at ON onboarding_progress;

CREATE TRIGGER update_onboarding_progress_updated_at
  BEFORE UPDATE ON onboarding_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
