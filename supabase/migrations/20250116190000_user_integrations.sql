-- User Integrations Table
-- Tracks what data sources users have connected to Nexus for business health scoring

CREATE TABLE IF NOT EXISTS public.user_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_type text NOT NULL,
  integration_name text NOT NULL,
  is_active boolean DEFAULT true,
  is_verified boolean DEFAULT false,
  access_level text DEFAULT 'basic' CHECK (access_level IN ('none', 'basic', 'read', 'full')),
  connection_data jsonb,
  last_sync timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, integration_type)
);

-- Add RLS policies
ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view/edit their own integrations
CREATE POLICY "Users can view their own integrations" ON public.user_integrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own integrations" ON public.user_integrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own integrations" ON public.user_integrations
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own integrations" ON public.user_integrations
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_integrations_user_id ON public.user_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_integrations_type ON public.user_integrations(integration_type);
CREATE INDEX IF NOT EXISTS idx_user_integrations_active ON public.user_integrations(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_integrations_verified ON public.user_integrations(is_verified) WHERE is_verified = true;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_integrations_updated_at
  BEFORE UPDATE ON public.user_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data for testing (remove in production)
INSERT INTO public.user_integrations (user_id, integration_type, integration_name, is_active, is_verified, access_level) 
VALUES 
  -- This would normally be populated by OAuth flows or user setup
  (auth.uid(), 'business_email', 'Business Email', true, false, 'basic'),
  (auth.uid(), 'business_website', 'Business Website', true, false, 'basic')
ON CONFLICT (user_id, integration_type) DO NOTHING; 