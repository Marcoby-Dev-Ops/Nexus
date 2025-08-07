-- Create personal_automations table
CREATE TABLE IF NOT EXISTS public.personal_automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  userid uuid NOT NULL,
  name text NOT NULL,
  description text,
  config jsonb,
  createdat timestamptz NOT NULL DEFAULT now(),
  updatedat timestamptz
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_personal_automations_userid ON public.personal_automations(userid);
CREATE INDEX IF NOT EXISTS idx_personal_automations_createdat ON public.personal_automations(createdat);

-- Enable RLS
ALTER TABLE public.personal_automations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own automations" ON public.personal_automations
  FOR SELECT USING (userid = auth.uid());

CREATE POLICY "Users can insert their own automations" ON public.personal_automations
  FOR INSERT WITH CHECK (userid = auth.uid());

CREATE POLICY "Users can update their own automations" ON public.personal_automations
  FOR UPDATE USING (userid = auth.uid());

CREATE POLICY "Users can delete their own automations" ON public.personal_automations
  FOR DELETE USING (userid = auth.uid()); 