-- Create user_licenses table
CREATE TABLE IF NOT EXISTS public.user_licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  license_type text NOT NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  metadata jsonb
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_licenses_user_id ON public.user_licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_licenses_license_type ON public.user_licenses(license_type);

-- Enable RLS
ALTER TABLE public.user_licenses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own licenses" ON public.user_licenses
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own licenses" ON public.user_licenses
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own licenses" ON public.user_licenses
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own licenses" ON public.user_licenses
  FOR DELETE USING (user_id = auth.uid()); 