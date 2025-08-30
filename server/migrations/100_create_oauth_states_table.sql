-- Migration: Create oauth_states table for secure OAuth state storage
-- This table stores OAuth state parameters to prevent CSRF attacks

CREATE TABLE IF NOT EXISTS oauth_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  code_verifier TEXT,
  redirect_uri TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_oauth_states_state ON oauth_states(state);
CREATE INDEX IF NOT EXISTS idx_oauth_states_provider ON oauth_states(provider);
CREATE INDEX IF NOT EXISTS idx_oauth_states_user_id ON oauth_states(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires_at ON oauth_states(expires_at);

-- Create a function to clean up expired states
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_states()
RETURNS void AS $$
BEGIN
  DELETE FROM oauth_states WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_oauth_states_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists, then create it
DROP TRIGGER IF EXISTS trigger_update_oauth_states_updated_at ON oauth_states;
CREATE TRIGGER trigger_update_oauth_states_updated_at
  BEFORE UPDATE ON oauth_states
  FOR EACH ROW
  EXECUTE FUNCTION update_oauth_states_updated_at();

-- Add RLS (Row Level Security) for security
ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist, then create them
DROP POLICY IF EXISTS "Users can only access their own OAuth states" ON oauth_states;
CREATE POLICY "Users can only access their own OAuth states" ON oauth_states
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can access all OAuth states" ON oauth_states;
CREATE POLICY "Service role can access all OAuth states" ON oauth_states
  FOR ALL USING (auth.role() = 'service_role');

-- Add comment for documentation
COMMENT ON TABLE oauth_states IS 'Stores OAuth state parameters for CSRF protection during OAuth flows';
COMMENT ON COLUMN oauth_states.state IS 'Unique OAuth state parameter for CSRF protection';
COMMENT ON COLUMN oauth_states.provider IS 'OAuth provider identifier (e.g., google, microsoft, hubspot)';
COMMENT ON COLUMN oauth_states.code_verifier IS 'PKCE code verifier for public clients';
COMMENT ON COLUMN oauth_states.expires_at IS 'When this OAuth state expires (typically 10 minutes)';
