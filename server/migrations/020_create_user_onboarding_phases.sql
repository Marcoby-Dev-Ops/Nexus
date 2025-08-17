-- Migration 020: Create user_onboarding_phases table
-- This table tracks completion of onboarding phases for users

-- Create the user_onboarding_phases table
CREATE TABLE IF NOT EXISTS user_onboarding_phases (
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    phase_id TEXT NOT NULL,
    phase_data JSONB,
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, phase_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_onboarding_phases_user_id ON user_onboarding_phases(user_id);
CREATE INDEX IF NOT EXISTS idx_user_onboarding_phases_phase_id ON user_onboarding_phases(phase_id);
CREATE INDEX IF NOT EXISTS idx_user_onboarding_phases_completed_at ON user_onboarding_phases(completed_at);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_onboarding_phases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_user_onboarding_phases_updated_at') THEN
        CREATE TRIGGER trigger_update_user_onboarding_phases_updated_at
            BEFORE UPDATE ON user_onboarding_phases
            FOR EACH ROW
            EXECUTE FUNCTION update_user_onboarding_phases_updated_at();
    END IF;
END $$;

-- Log the migration
INSERT INTO audit_logs (action, resource_type, details) VALUES 
('migration', 'database', '{"migration": "020_create_user_onboarding_phases", "status": "completed"}');
