-- Create personal_thoughts table
CREATE TABLE IF NOT EXISTS public.personal_thoughts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  userid uuid NOT NULL,
  company_id uuid,
  createdat timestamptz NOT NULL DEFAULT now(),
  updatedat timestamptz,
  tags text[],
  metadata jsonb
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_personal_thoughts_userid ON public.personal_thoughts(userid);
CREATE INDEX IF NOT EXISTS idx_personal_thoughts_createdat ON public.personal_thoughts(createdat);

-- Enable RLS
ALTER TABLE public.personal_thoughts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own thoughts" ON public.personal_thoughts
  FOR SELECT USING (userid = auth.uid());

CREATE POLICY "Users can insert their own thoughts" ON public.personal_thoughts
  FOR INSERT WITH CHECK (userid = auth.uid());

CREATE POLICY "Users can update their own thoughts" ON public.personal_thoughts
  FOR UPDATE USING (userid = auth.uid());

CREATE POLICY "Users can delete their own thoughts" ON public.personal_thoughts
  FOR DELETE USING (userid = auth.uid()); 