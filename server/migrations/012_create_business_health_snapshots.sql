-- Migration: Create business_health_snapshots table
-- This table stores business health snapshots with the structure expected by the application

-- Create the business_health_snapshots table
CREATE TABLE IF NOT EXISTS business_health_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL, -- External user ID (Authentik hash)
    org_id UUID REFERENCES companies(id),
    overall_score INTEGER NOT NULL DEFAULT 0,
    category_scores JSONB DEFAULT '{}',
    last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_sources TEXT[] DEFAULT '{}',
    connected_sources INTEGER DEFAULT 0,
    verified_sources INTEGER DEFAULT 0,
    data_quality_score INTEGER DEFAULT 0,
    completion_percentage INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one snapshot per user (latest)
    UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_health_snapshots_user_id ON business_health_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_business_health_snapshots_org_id ON business_health_snapshots(org_id);
CREATE INDEX IF NOT EXISTS idx_business_health_snapshots_last_calculated ON business_health_snapshots(last_calculated);

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_business_health_snapshots_updated_at
    BEFORE UPDATE ON business_health_snapshots
    FOR EACH ROW
    EXECUTE FUNCTION update_user_profiles_updated_at();

-- Enable RLS
ALTER TABLE business_health_snapshots ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$
BEGIN
    -- Users can view their own business health snapshots
    EXECUTE 'CREATE POLICY "Users can view own business health snapshots" ON business_health_snapshots FOR SELECT USING (user_id = current_user)';
    
    -- Users can insert their own business health snapshots
    EXECUTE 'CREATE POLICY "Users can insert own business health snapshots" ON business_health_snapshots FOR INSERT WITH CHECK (user_id = current_user)';
    
    -- Users can update their own business health snapshots
    EXECUTE 'CREATE POLICY "Users can update own business health snapshots" ON business_health_snapshots FOR UPDATE USING (user_id = current_user)';
    
    -- Users can delete their own business health snapshots
    EXECUTE 'CREATE POLICY "Users can delete own business health snapshots" ON business_health_snapshots FOR DELETE USING (user_id = current_user)';
EXCEPTION
    WHEN OTHERS THEN
        -- Policies might already exist, continue
        NULL;
END $$;
