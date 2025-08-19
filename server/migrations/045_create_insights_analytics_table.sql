-- Migration: Create Insights Analytics Table
-- This table stores aggregated insights data for trend analysis across industries and maturity levels

-- Insights analytics table for trend analysis
CREATE TABLE IF NOT EXISTS insights_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL, -- Authentik user ID
    company_id UUID REFERENCES companies(id),
    organization_id UUID REFERENCES organizations(id),
    
    -- Business context
    industry VARCHAR(100),
    company_size VARCHAR(50),
    maturity_level VARCHAR(50), -- 'Early Stage', 'Growing', 'Mature'
    sophistication_level VARCHAR(50), -- 'Beginner', 'Intermediate', 'Advanced'
    
    -- Insights data
    insight_count INTEGER DEFAULT 0,
    insights_data JSONB DEFAULT '[]', -- Array of insight objects
    building_blocks_covered TEXT[], -- Which building blocks were addressed
    priority_areas TEXT[], -- User's stated priorities
    
    -- Tool and integration context
    tool_categories_count INTEGER DEFAULT 0,
    integration_count INTEGER DEFAULT 0,
    selected_tools JSONB DEFAULT '{}', -- Tool selections by category
    selected_integrations TEXT[], -- Integration names
    
    -- Analytics metadata
    confidence_score DECIMAL(3,2), -- Overall confidence in the analysis
    data_completeness_score DECIMAL(3,2), -- How complete the user data was
    analysis_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Anonymization flags
    is_anonymized BOOLEAN DEFAULT false,
    anonymized_company_name VARCHAR(100),
    
    -- System fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_insights_analytics_industry ON insights_analytics(industry);
CREATE INDEX IF NOT EXISTS idx_insights_analytics_company_size ON insights_analytics(company_size);
CREATE INDEX IF NOT EXISTS idx_insights_analytics_maturity_level ON insights_analytics(maturity_level);
CREATE INDEX IF NOT EXISTS idx_insights_analytics_sophistication_level ON insights_analytics(sophistication_level);
CREATE INDEX IF NOT EXISTS idx_insights_analytics_created_at ON insights_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_insights_analytics_building_blocks ON insights_analytics USING GIN(building_blocks_covered);
CREATE INDEX IF NOT EXISTS idx_insights_analytics_priority_areas ON insights_analytics USING GIN(priority_areas);

-- RLS policies for insights analytics
ALTER TABLE insights_analytics ENABLE ROW LEVEL SECURITY;

-- Users can view their own analytics data
CREATE POLICY "Users can view own insights analytics" ON insights_analytics
    FOR SELECT USING (user_id = auth.uid()::text);

-- Users can insert their own analytics data
CREATE POLICY "Users can insert own insights analytics" ON insights_analytics
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

-- Users can update their own analytics data
CREATE POLICY "Users can update own insights analytics" ON insights_analytics
    FOR UPDATE USING (user_id = auth.uid()::text);

-- System can access all analytics data for trend analysis (anonymized)
CREATE POLICY "System can access anonymized analytics" ON insights_analytics
    FOR SELECT USING (is_anonymized = true);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_insights_analytics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_insights_analytics_updated_at
    BEFORE UPDATE ON insights_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_insights_analytics_updated_at();

-- Function to anonymize company data for trend analysis
CREATE OR REPLACE FUNCTION anonymize_insights_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Only anonymize if not already anonymized and older than 30 days
    IF NEW.is_anonymized = false AND NEW.created_at < NOW() - INTERVAL '30 days' THEN
        NEW.is_anonymized = true;
        NEW.anonymized_company_name = 'Company_' || substr(md5(NEW.company_id::text), 1, 8);
        NEW.user_id = 'anonymous_' || substr(md5(NEW.user_id), 1, 8);
        NEW.company_id = NULL;
        NEW.organization_id = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically anonymize old data
CREATE TRIGGER anonymize_old_insights_analytics
    BEFORE INSERT OR UPDATE ON insights_analytics
    FOR EACH ROW
    EXECUTE FUNCTION anonymize_insights_analytics();
