-- Apply Onboarding Migration
-- Run this SQL in your Supabase Dashboard SQL Editor

-- Table to track individual onboarding steps
CREATE TABLE IF NOT EXISTS user_onboarding_steps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    step_id TEXT NOT NULL,
    step_data JSONB,
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, step_id)
);

-- Table to track onboarding completions
CREATE TABLE IF NOT EXISTS user_onboarding_completions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    onboarding_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_onboarding_steps_user_id ON user_onboarding_steps(user_id);
CREATE INDEX IF NOT EXISTS idx_user_onboarding_steps_step_id ON user_onboarding_steps(step_id);
CREATE INDEX IF NOT EXISTS idx_user_onboarding_completions_user_id ON user_onboarding_completions(user_id);

-- Add RLS policies
ALTER TABLE user_onboarding_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_onboarding_completions ENABLE ROW LEVEL SECURITY;

-- Users can only access their own onboarding data
CREATE POLICY "Users can manage their own onboarding steps" 
ON user_onboarding_steps FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own onboarding completions" 
ON user_onboarding_completions FOR ALL 
USING (auth.uid() = user_id);

-- Add onboarding_completed column to user_profiles if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'onboarding_completed'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add preferences column to user_profiles if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'preferences'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN preferences JSONB DEFAULT '{}';
    END IF;
END $$;

-- Verify the tables were created
SELECT 'user_onboarding_steps' as table_name, COUNT(*) as row_count FROM user_onboarding_steps
UNION ALL
SELECT 'user_onboarding_completions' as table_name, COUNT(*) as row_count FROM user_onboarding_completions; 