-- Pillar 6 – Reliability & Trust
-- Create ai_integrations table to store per-organisation OAuth credentials

-- =====================================================================
-- Table: ai_integrations
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.ai_integrations (
  org_id UUID NOT NULL,
  provider TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (org_id, provider)
);

-- Update timestamp trigger (assumes helper function exists)
CREATE TRIGGER set_ai_integrations_updated_at
  BEFORE UPDATE ON public.ai_integrations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------
-- Row-Level Security – tenant isolation by org_id claim
-- ---------------------------------------------------------------------
ALTER TABLE public.ai_integrations ENABLE ROW LEVEL SECURITY;

-- Allow org-scoped access based on JWT claim `org_id`
CREATE POLICY "Org members can manage their integrations" ON public.ai_integrations
  USING (org_id::text = current_setting('request.jwt.claims', true)::json ->> 'org_id')
  WITH CHECK (org_id::text = current_setting('request.jwt.claims', true)::json ->> 'org_id'); 