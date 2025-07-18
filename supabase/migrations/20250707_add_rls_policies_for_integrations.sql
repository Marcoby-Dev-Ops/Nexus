-- Enable RLS for all relevant tables
ALTER TABLE public.oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_integrations_oauth ENABLE ROW LEVEL SECURITY;

-- oauth_tokens policies
CREATE POLICY "Allow users to read their own oauth_tokens"
  ON public.oauth_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert their own oauth_tokens"
  ON public.oauth_tokens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own oauth_tokens"
  ON public.oauth_tokens
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own oauth_tokens"
  ON public.oauth_tokens
  FOR DELETE
  USING (auth.uid() = user_id);

-- ai_email_accounts policies
CREATE POLICY "Allow users to read their own ai_email_accounts"
  ON public.ai_email_accounts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert their own ai_email_accounts"
  ON public.ai_email_accounts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own ai_email_accounts"
  ON public.ai_email_accounts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own ai_email_accounts"
  ON public.ai_email_accounts
  FOR DELETE
  USING (auth.uid() = user_id);

-- ai_integrations_oauth policies
CREATE POLICY "Allow users to read their own ai_integrations_oauth"
  ON public.ai_integrations_oauth
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert their own ai_integrations_oauth"
  ON public.ai_integrations_oauth
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own ai_integrations_oauth"
  ON public.ai_integrations_oauth
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own ai_integrations_oauth"
  ON public.ai_integrations_oauth
  FOR DELETE
  USING (auth.uid() = user_id); 