-- Create action_cards table for n8n workflow approvals
CREATE TABLE IF NOT EXISTS action_cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Card metadata
    domain TEXT NOT NULL DEFAULT 'thoughts', -- thoughts, projects, tasks, etc.
    kind TEXT NOT NULL DEFAULT 'approval', -- approval, notification, action_required
    title TEXT NOT NULL,
    description TEXT,
    
    -- Action data
    meta JSONB NOT NULL DEFAULT '{}', -- Contains agentConfidence, recommendedAction, etc.
    data JSONB DEFAULT '{}', -- Contains the actual data for the action
    
    -- Status tracking
    status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, modified
    resolved_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_action_cards_user_status ON action_cards(user_id, status);
CREATE INDEX idx_action_cards_domain ON action_cards(domain);
CREATE INDEX idx_action_cards_created_at ON action_cards(created_at DESC);

-- Enable RLS
ALTER TABLE action_cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own action cards"
    ON action_cards FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own action cards"
    ON action_cards FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own action cards"
    ON action_cards FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own action cards"
    ON action_cards FOR DELETE
    USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_action_cards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER action_cards_updated_at
    BEFORE UPDATE ON action_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_action_cards_updated_at();

-- Grant permissions
GRANT ALL ON action_cards TO authenticated;
GRANT ALL ON action_cards TO service_role; 