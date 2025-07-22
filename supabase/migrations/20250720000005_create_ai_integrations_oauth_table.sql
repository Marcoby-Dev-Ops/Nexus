-- Migration: Create ai_integrations_oauth table for AI integration OAuth tokens
-- This table is needed for storing OAuth tokens for AI integrations

-- Create ai_integrations_oauth table
CREATE TABLE IF NOT EXISTS public.ai_integrations_oauth (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ,
    token_type TEXT DEFAULT 'Bearer',
    scope TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, provider)
);

-- Enable RLS
ALTER TABLE public.ai_integrations_oauth ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own ai_integrations_oauth" ON public.ai_integrations_oauth
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai_integrations_oauth" ON public.ai_integrations_oauth
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ai_integrations_oauth" ON public.ai_integrations_oauth
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ai_integrations_oauth" ON public.ai_integrations_oauth
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_integrations_oauth_user_id ON public.ai_integrations_oauth(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_integrations_oauth_provider ON public.ai_integrations_oauth(provider);
CREATE INDEX IF NOT EXISTS idx_ai_integrations_oauth_expires_at ON public.ai_integrations_oauth(expires_at);

-- Create updated_at trigger
CREATE TRIGGER update_ai_integrations_oauth_updated_at 
    BEFORE UPDATE ON public.ai_integrations_oauth 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.ai_integrations_oauth IS 'OAuth tokens for AI integrations';
COMMENT ON COLUMN public.ai_integrations_oauth.provider IS 'OAuth provider identifier (e.g., microsoft_graph, google_workspace)';
COMMENT ON COLUMN public.ai_integrations_oauth.access_token IS 'OAuth access token (encrypted at rest by Supabase)';
COMMENT ON COLUMN public.ai_integrations_oauth.refresh_token IS 'OAuth refresh token (encrypted at rest by Supabase)';
COMMENT ON COLUMN public.ai_integrations_oauth.expires_at IS 'When the access token expires';
COMMENT ON COLUMN public.ai_integrations_oauth.scope IS 'OAuth scopes granted for this token'; 