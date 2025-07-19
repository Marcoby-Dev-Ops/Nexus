-- Create OAuth tokens table for secure token storage
CREATE TABLE IF NOT EXISTS oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  integration_slug TEXT NOT NULL, -- 'microsoft', 'linkedin', 'google-workspace', etc.
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  scope TEXT,
  token_type TEXT DEFAULT 'Bearer',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one token per user per integration
  UNIQUE(user_id, integration_slug)
);

-- Enable RLS
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own tokens
CREATE POLICY "Users can view own oauth tokens" ON oauth_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own oauth tokens" ON oauth_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own oauth tokens" ON oauth_tokens
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own oauth tokens" ON oauth_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user_id ON oauth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_integration ON oauth_tokens(integration_slug);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_expires_at ON oauth_tokens(expires_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_oauth_tokens_updated_at 
  BEFORE UPDATE ON oauth_tokens 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE oauth_tokens IS 'Secure storage for OAuth access and refresh tokens';
COMMENT ON COLUMN oauth_tokens.integration_slug IS 'Identifier for the OAuth provider (e.g., microsoft, linkedin, google-workspace)';
COMMENT ON COLUMN oauth_tokens.access_token IS 'OAuth access token (encrypted at rest by Supabase)';
COMMENT ON COLUMN oauth_tokens.refresh_token IS 'OAuth refresh token (encrypted at rest by Supabase)';
COMMENT ON COLUMN oauth_tokens.expires_at IS 'When the access token expires';
COMMENT ON COLUMN oauth_tokens.scope IS 'OAuth scopes granted for this token'; 