-- Migration: Create Insight Feedback Table
-- This table stores user feedback on AI-generated insights to improve RAG system recommendations

-- Insight feedback table for tracking user responses to AI insights
CREATE TABLE IF NOT EXISTS insight_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL, -- Authentik user ID
    company_id UUID REFERENCES companies(id),
    organization_id UUID REFERENCES organizations(id),
    
    -- Insight identification
    insight_id VARCHAR(255) NOT NULL, -- ID of the insight being rated
    insight_type VARCHAR(100) NOT NULL, -- 'fire_insight', 'business_insight', 'recommendation', etc.
    insight_title VARCHAR(500) NOT NULL, -- Title of the insight for reference
    insight_content TEXT, -- Content of the insight for context
    
    -- User feedback
    rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- 1-5 star rating (optional)
    value_assessment VARCHAR(50) NOT NULL, -- 'valuable', 'not_valuable', 'already_implemented', 'not_applicable'
    implementation_status VARCHAR(50) DEFAULT 'not_started', -- 'not_started', 'in_progress', 'completed', 'abandoned'
    feedback_comment TEXT, -- Optional user comment
    
    -- Business context for RAG learning
    business_context JSONB DEFAULT '{}', -- Industry, company size, role, etc. at time of feedback
    insight_category VARCHAR(100), -- Category of the insight (strategy, operations, etc.)
    insight_impact VARCHAR(50), -- Impact level of the insight (low, medium, high, critical)
    insight_confidence DECIMAL(3,2), -- Original confidence score of the insight
    
    -- RAG learning metadata
    should_exclude_from_recommendations BOOLEAN DEFAULT false, -- Whether to exclude similar insights
    exclusion_reason VARCHAR(200), -- Reason for exclusion (already implemented, not valuable, etc.)
    learning_applied BOOLEAN DEFAULT false, -- Whether this feedback has been processed by RAG system
    
    -- System fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_insight_feedback_user_id ON insight_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_insight_feedback_company_id ON insight_feedback(company_id);
CREATE INDEX IF NOT EXISTS idx_insight_feedback_insight_id ON insight_feedback(insight_id);
CREATE INDEX IF NOT EXISTS idx_insight_feedback_type ON insight_feedback(insight_type);
CREATE INDEX IF NOT EXISTS idx_insight_feedback_value_assessment ON insight_feedback(value_assessment);
CREATE INDEX IF NOT EXISTS idx_insight_feedback_implementation_status ON insight_feedback(implementation_status);
CREATE INDEX IF NOT EXISTS idx_insight_feedback_exclude_recommendations ON insight_feedback(should_exclude_from_recommendations);
CREATE INDEX IF NOT EXISTS idx_insight_feedback_learning_applied ON insight_feedback(learning_applied);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_insight_feedback_user_type ON insight_feedback(user_id, insight_type);
CREATE INDEX IF NOT EXISTS idx_insight_feedback_company_type ON insight_feedback(company_id, insight_type);
CREATE INDEX IF NOT EXISTS idx_insight_feedback_user_value ON insight_feedback(user_id, value_assessment);

-- Add RLS policies
ALTER TABLE insight_feedback ENABLE ROW LEVEL SECURITY;

-- Users can only see their own feedback
CREATE POLICY "Users can view own insight feedback" ON insight_feedback
    FOR SELECT USING (auth.uid()::text = user_id);

-- Users can insert their own feedback
CREATE POLICY "Users can insert own insight feedback" ON insight_feedback
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Users can update their own feedback
CREATE POLICY "Users can update own insight feedback" ON insight_feedback
    FOR UPDATE USING (auth.uid()::text = user_id);

-- System can update learning_applied flag
CREATE POLICY "System can update learning flags" ON insight_feedback
    FOR UPDATE USING (true);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_insight_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_insight_feedback_updated_at
    BEFORE UPDATE ON insight_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_insight_feedback_updated_at();
