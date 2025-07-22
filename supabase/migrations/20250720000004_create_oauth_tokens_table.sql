-- Migration: Create oauth_tokens table for OAuth token storage
-- This table is needed for storing OAuth access and refresh tokens for integrations

-- Create oauth_tokens table
CREATE TABLE IF NOT EXISTS public.oauth_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    integration_slug TEXT NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ,
    token_type TEXT DEFAULT 'Bearer',
    scope TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, integration_slug)
);

-- Enable RLS
ALTER TABLE public.oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own oauth tokens" ON public.oauth_tokens
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own oauth tokens" ON public.oauth_tokens
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own oauth tokens" ON public.oauth_tokens
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own oauth tokens" ON public.oauth_tokens
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user_id ON public.oauth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_integration ON public.oauth_tokens(integration_slug);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_expires_at ON public.oauth_tokens(expires_at);

-- Create updated_at trigger
CREATE TRIGGER update_oauth_tokens_updated_at 
    BEFORE UPDATE ON public.oauth_tokens 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.oauth_tokens IS 'Secure storage for OAuth access and refresh tokens';
COMMENT ON COLUMN public.oauth_tokens.integration_slug IS 'Identifier for the OAuth provider (e.g., microsoft, linkedin, google-workspace)';
COMMENT ON COLUMN public.oauth_tokens.access_token IS 'OAuth access token (encrypted at rest by Supabase)';
COMMENT ON COLUMN public.oauth_tokens.refresh_token IS 'OAuth refresh token (encrypted at rest by Supabase)';
COMMENT ON COLUMN public.oauth_tokens.expires_at IS 'When the access token expires';
COMMENT ON COLUMN public.oauth_tokens.scope IS 'OAuth scopes granted for this token'; 