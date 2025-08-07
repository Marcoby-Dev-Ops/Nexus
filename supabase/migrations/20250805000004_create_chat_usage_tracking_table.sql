-- Create chat_usage_tracking table
CREATE TABLE IF NOT EXISTS public.chat_usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid,
  date date NOT NULL,
  usage_count integer NOT NULL DEFAULT 0,
  metadata jsonb
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chat_usage_tracking_user_id ON public.chat_usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_usage_tracking_org_id ON public.chat_usage_tracking(org_id);
CREATE INDEX IF NOT EXISTS idx_chat_usage_tracking_date ON public.chat_usage_tracking(date);

-- Enable RLS
ALTER TABLE public.chat_usage_tracking ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own usage" ON public.chat_usage_tracking
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own usage" ON public.chat_usage_tracking
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own usage" ON public.chat_usage_tracking
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own usage" ON public.chat_usage_tracking
  FOR DELETE USING (user_id = auth.uid()); 