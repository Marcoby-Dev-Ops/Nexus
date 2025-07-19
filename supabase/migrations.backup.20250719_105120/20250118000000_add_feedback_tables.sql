-- Add feedback and success tracking tables
-- Pillar: 1,2 - Complete feedback loops and success measurement

-- Message feedback table
CREATE TABLE IF NOT EXISTS public.ai_message_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id TEXT NOT NULL,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    agent_id TEXT,
    
    -- Feedback details
    rating TEXT NOT NULL CHECK (rating IN ('helpful', 'unhelpful')),
    feedback_category TEXT CHECK (feedback_category IN ('accuracy', 'relevance', 'completeness', 'clarity', 'actionability')),
    comment TEXT,
    follow_up_needed BOOLEAN DEFAULT false,
    improvement_suggestion TEXT,
    
    -- Context for analysis
    message_content_hash TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate feedback
    UNIQUE(message_id, user_id)
);

-- Success outcome tracking table
CREATE TABLE IF NOT EXISTS public.ai_success_outcomes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id TEXT NOT NULL,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Recommendation tracking
    recommendation TEXT NOT NULL,
    expected_outcome TEXT NOT NULL,
    actual_outcome TEXT,
    
    -- Status tracking
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'not_applicable')),
    impact_type TEXT NOT NULL CHECK (impact_type IN ('time_savings', 'cost_reduction', 'revenue_increase', 'efficiency_gain', 'quality_improvement')),
    
    -- Quantified impact
    quantified_impact JSONB,
    
    -- Timing
    follow_up_date TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    
    -- User notes
    user_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate tracking
    UNIQUE(message_id, user_id)
);

-- Feedback analytics view
CREATE OR REPLACE VIEW public.feedback_analytics AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    agent_id,
    rating,
    feedback_category,
    COUNT(*) as feedback_count,
    COUNT(CASE WHEN follow_up_needed THEN 1 END) as follow_up_requests,
    AVG(CASE WHEN rating = 'helpful' THEN 1 ELSE 0 END) as helpfulness_rate
FROM public.ai_message_feedback
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at), agent_id, rating, feedback_category
ORDER BY date DESC;

-- Success outcome analytics view
CREATE OR REPLACE VIEW public.outcome_analytics AS
SELECT 
    DATE_TRUNC('week', created_at) as week,
    impact_type,
    status,
    COUNT(*) as outcome_count,
    AVG(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as success_rate,
    AVG(EXTRACT(EPOCH FROM (completed_at - created_at))/86400) as avg_completion_days
FROM public.ai_success_outcomes
WHERE created_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE_TRUNC('week', created_at), impact_type, status
ORDER BY week DESC;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_message_feedback_user_date 
ON public.ai_message_feedback(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_message_feedback_agent_rating 
ON public.ai_message_feedback(agent_id, rating, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_success_outcomes_user_status 
ON public.ai_success_outcomes(user_id, status, follow_up_date);

CREATE INDEX IF NOT EXISTS idx_success_outcomes_impact_type 
ON public.ai_success_outcomes(impact_type, status, created_at DESC);

-- Enable RLS
ALTER TABLE public.ai_message_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_success_outcomes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for message feedback
CREATE POLICY "Users can view own feedback" ON public.ai_message_feedback
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback" ON public.ai_message_feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own feedback" ON public.ai_message_feedback
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for success outcomes
CREATE POLICY "Users can view own outcomes" ON public.ai_success_outcomes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own outcomes" ON public.ai_success_outcomes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own outcomes" ON public.ai_success_outcomes
    FOR UPDATE USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.ai_message_feedback TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.ai_success_outcomes TO authenticated;
GRANT SELECT ON public.feedback_analytics TO authenticated;
GRANT SELECT ON public.outcome_analytics TO authenticated;

-- Update triggers
CREATE TRIGGER update_ai_message_feedback_updated_at
    BEFORE UPDATE ON public.ai_message_feedback
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_success_outcomes_updated_at
    BEFORE UPDATE ON public.ai_success_outcomes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column(); 