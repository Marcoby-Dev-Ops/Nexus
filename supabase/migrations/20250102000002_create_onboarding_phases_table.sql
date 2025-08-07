-- Create user_onboarding_phases table for 5-phase onboarding system
CREATE TABLE IF NOT EXISTS user_onboarding_phases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phase_id TEXT NOT NULL,
  phase_data JSONB,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, phase_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_onboarding_phases_user_id ON user_onboarding_phases(user_id);
CREATE INDEX IF NOT EXISTS idx_user_onboarding_phases_phase_id ON user_onboarding_phases(phase_id);
CREATE INDEX IF NOT EXISTS idx_user_onboarding_phases_completed_at ON user_onboarding_phases(completed_at);

-- Enable RLS
ALTER TABLE user_onboarding_phases ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own onboarding phases"
  ON user_onboarding_phases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding phases"
  ON user_onboarding_phases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding phases"
  ON user_onboarding_phases FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own onboarding phases"
  ON user_onboarding_phases FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON user_onboarding_phases TO service_role;
GRANT ALL ON user_onboarding_phases TO authenticated;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_onboarding_phases_updated_at 
  BEFORE UPDATE ON user_onboarding_phases 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
