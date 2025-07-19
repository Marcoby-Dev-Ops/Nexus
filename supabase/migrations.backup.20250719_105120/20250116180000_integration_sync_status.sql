-- Integration Sync Status Table
-- Tracks last sync times and status for business health data sources

CREATE TABLE IF NOT EXISTS public.integration_sync_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id text NOT NULL UNIQUE,
  last_sync timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending',
  kpis_updated integer DEFAULT 0,
  error_message text,
  sync_duration_ms integer,
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.integration_sync_status ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view sync status for their organization
CREATE POLICY "Users can view org integration sync status" ON public.integration_sync_status
  FOR SELECT
  USING (
    org_id = (
      SELECT company_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- Policy: Service accounts can update sync status
CREATE POLICY "Service accounts can update sync status" ON public.integration_sync_status
  FOR ALL
  USING (true);

-- Add indexes for performance
CREATE INDEX idx_integration_sync_status_integration_id ON public.integration_sync_status(integration_id);
CREATE INDEX idx_integration_sync_status_org_id ON public.integration_sync_status(org_id);
CREATE INDEX idx_integration_sync_status_last_sync ON public.integration_sync_status(last_sync);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_integration_sync_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_integration_sync_status_updated_at
  BEFORE UPDATE ON public.integration_sync_status
  FOR EACH ROW
  EXECUTE FUNCTION update_integration_sync_status_updated_at();

-- Add sample data for testing
INSERT INTO public.integration_sync_status (integration_id, status, kpis_updated) VALUES
  ('hubspot', 'success', 12),
  ('apollo', 'success', 8),
  ('marcoby_cloud', 'success', 6),
  ('cloudflare', 'success', 4)
ON CONFLICT (integration_id) DO NOTHING; 