-- Migration for context completion tracking
-- Enables learning from user behavior and improving suggestions over time

-- Context completion events tracking
CREATE TABLE IF NOT EXISTS public.context_completion_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completion_id TEXT NOT NULL,
  gaps_addressed TEXT[] NOT NULL DEFAULT '{}',
  user_action TEXT NOT NULL CHECK (user_action IN ('accepted', 'rejected', 'deferred')),
  impact_score INTEGER DEFAULT 0,
  completion_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Context gaps tracking for analysis
CREATE TABLE IF NOT EXISTS public.context_gaps_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gap_type TEXT NOT NULL CHECK (gap_type IN ('user_profile', 'business_data', 'department_context', 'integration_data')),
  gap_severity TEXT NOT NULL CHECK (gap_severity IN ('critical', 'important', 'optional')),
  gap_field TEXT NOT NULL,
  detection_context JSONB DEFAULT '{}',
  fill_method TEXT CHECK (fill_method IN ('manual', 'integration', 'ai_suggested')),
  estimated_impact INTEGER DEFAULT 0,
  actual_impact INTEGER,
  filled_at TIMESTAMPTZ,
  filled_value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Context suggestions effectiveness tracking
CREATE TABLE IF NOT EXISTS public.context_suggestions_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  suggestion_id TEXT NOT NULL,
  suggestion_type TEXT NOT NULL,
  suggestion_priority TEXT NOT NULL CHECK (suggestion_priority IN ('high', 'medium', 'low')),
  query_context TEXT,
  department_context TEXT,
  gaps_count INTEGER DEFAULT 0,
  user_response TEXT CHECK (user_response IN ('accepted', 'rejected', 'deferred', 'ignored')),
  completion_time_seconds INTEGER,
  effectiveness_score INTEGER,
  user_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User context learning patterns
CREATE TABLE IF NOT EXISTS public.user_context_patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern_type TEXT NOT NULL,
  pattern_data JSONB NOT NULL DEFAULT '{}',
  confidence_score DECIMAL(3,2) DEFAULT 0.0,
  frequency_count INTEGER DEFAULT 1,
  last_observed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, pattern_type)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_context_completion_events_user_id ON public.context_completion_events(user_id);
CREATE INDEX IF NOT EXISTS idx_context_completion_events_action ON public.context_completion_events(user_action);
CREATE INDEX IF NOT EXISTS idx_context_completion_events_created_at ON public.context_completion_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_context_gaps_analysis_user_id ON public.context_gaps_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_context_gaps_analysis_type ON public.context_gaps_analysis(gap_type);
CREATE INDEX IF NOT EXISTS idx_context_gaps_analysis_severity ON public.context_gaps_analysis(gap_severity);
CREATE INDEX IF NOT EXISTS idx_context_gaps_analysis_filled ON public.context_gaps_analysis(filled_at);

CREATE INDEX IF NOT EXISTS idx_context_suggestions_user_id ON public.context_suggestions_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_context_suggestions_response ON public.context_suggestions_tracking(user_response);
CREATE INDEX IF NOT EXISTS idx_context_suggestions_priority ON public.context_suggestions_tracking(suggestion_priority);

CREATE INDEX IF NOT EXISTS idx_user_context_patterns_user_id ON public.user_context_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_user_context_patterns_type ON public.user_context_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_user_context_patterns_confidence ON public.user_context_patterns(confidence_score DESC);

-- RLS policies
ALTER TABLE public.context_completion_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.context_gaps_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.context_suggestions_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_context_patterns ENABLE ROW LEVEL SECURITY;

-- Users can only access their own completion events
CREATE POLICY "Users can view own completion events" ON public.context_completion_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completion events" ON public.context_completion_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only access their own gaps analysis
CREATE POLICY "Users can view own gaps analysis" ON public.context_gaps_analysis
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gaps analysis" ON public.context_gaps_analysis
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gaps analysis" ON public.context_gaps_analysis
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can only access their own suggestions tracking
CREATE POLICY "Users can view own suggestions tracking" ON public.context_suggestions_tracking
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own suggestions tracking" ON public.context_suggestions_tracking
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own suggestions tracking" ON public.context_suggestions_tracking
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can only access their own context patterns
CREATE POLICY "Users can view own context patterns" ON public.user_context_patterns
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own context patterns" ON public.user_context_patterns
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own context patterns" ON public.user_context_patterns
    FOR UPDATE USING (auth.uid() = user_id);

-- Functions for context analytics

-- Function to get user context completion stats
CREATE OR REPLACE FUNCTION get_user_context_completion_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_suggestions', COUNT(*),
        'accepted_suggestions', COUNT(*) FILTER (WHERE user_response = 'accepted'),
        'rejected_suggestions', COUNT(*) FILTER (WHERE user_response = 'rejected'),
        'deferred_suggestions', COUNT(*) FILTER (WHERE user_response = 'deferred'),
        'acceptance_rate', ROUND(
            (COUNT(*) FILTER (WHERE user_response = 'accepted')::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 
            2
        ),
        'average_completion_time', AVG(completion_time_seconds),
        'total_gaps_filled', (
            SELECT COUNT(*) 
            FROM context_gaps_analysis 
            WHERE user_id = user_uuid AND filled_at IS NOT NULL
        ),
        'most_common_gap_type', (
            SELECT gap_type 
            FROM context_gaps_analysis 
            WHERE user_id = user_uuid 
            GROUP BY gap_type 
            ORDER BY COUNT(*) DESC 
            LIMIT 1
        )
    ) INTO result
    FROM context_suggestions_tracking
    WHERE user_id = user_uuid;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to identify context patterns for a user
CREATE OR REPLACE FUNCTION analyze_user_context_patterns(user_uuid UUID)
RETURNS TABLE(
    pattern_type TEXT,
    pattern_description TEXT,
    confidence_score DECIMAL,
    recommendation TEXT
) AS $$
BEGIN
    -- Query frequency patterns
    RETURN QUERY
    SELECT 
        'query_frequency' as pattern_type,
        'User queries most frequently about: ' || department_context as pattern_description,
        COUNT(*)::DECIMAL / (SELECT COUNT(*) FROM context_suggestions_tracking WHERE user_id = user_uuid) as confidence_score,
        'Focus suggestions on ' || department_context || ' context' as recommendation
    FROM context_suggestions_tracking
    WHERE user_id = user_uuid AND department_context IS NOT NULL
    GROUP BY department_context
    ORDER BY COUNT(*) DESC
    LIMIT 3;
    
    -- Completion behavior patterns
    RETURN QUERY
    SELECT 
        'completion_behavior' as pattern_type,
        'User typically ' || user_response || 's suggestions' as pattern_description,
        COUNT(*)::DECIMAL / (SELECT COUNT(*) FROM context_suggestions_tracking WHERE user_id = user_uuid) as confidence_score,
        CASE 
            WHEN user_response = 'accepted' THEN 'Continue providing similar suggestions'
            WHEN user_response = 'rejected' THEN 'Refine suggestion approach'
            WHEN user_response = 'deferred' THEN 'Provide time-sensitive reminders'
            ELSE 'Monitor engagement patterns'
        END as recommendation
    FROM context_suggestions_tracking
    WHERE user_id = user_uuid
    GROUP BY user_response
    HAVING COUNT(*) >= 3
    ORDER BY COUNT(*) DESC;
    
    -- Gap type patterns
    RETURN QUERY
    SELECT 
        'gap_preference' as pattern_type,
        'User most often fills ' || gap_type || ' gaps' as pattern_description,
        COUNT(*)::DECIMAL / (SELECT COUNT(*) FROM context_gaps_analysis WHERE user_id = user_uuid AND filled_at IS NOT NULL) as confidence_score,
        'Prioritize ' || gap_type || ' suggestions' as recommendation
    FROM context_gaps_analysis
    WHERE user_id = user_uuid AND filled_at IS NOT NULL
    GROUP BY gap_type
    ORDER BY COUNT(*) DESC
    LIMIT 2;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get context gap effectiveness metrics
CREATE OR REPLACE FUNCTION get_context_gap_effectiveness()
RETURNS TABLE(
    gap_type TEXT,
    gap_severity TEXT,
    fill_rate DECIMAL,
    average_impact INTEGER,
    fill_method_preference TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cga.gap_type,
        cga.gap_severity,
        (COUNT(*) FILTER (WHERE filled_at IS NOT NULL)::DECIMAL / COUNT(*)) * 100 as fill_rate,
        AVG(actual_impact)::INTEGER as average_impact,
        MODE() WITHIN GROUP (ORDER BY fill_method) as fill_method_preference
    FROM context_gaps_analysis cga
    WHERE created_at > NOW() - INTERVAL '30 days'
    GROUP BY gap_type, gap_severity
    ORDER BY fill_rate DESC, average_impact DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update context patterns when completion events are added
CREATE OR REPLACE FUNCTION update_user_context_patterns()
RETURNS TRIGGER AS $$
BEGIN
    -- Update or insert completion behavior pattern
    INSERT INTO user_context_patterns (user_id, pattern_type, pattern_data, confidence_score, frequency_count)
    VALUES (
        NEW.user_id,
        'completion_behavior',
        jsonb_build_object('action', NEW.user_action, 'impact_score', NEW.impact_score),
        0.5,
        1
    )
    ON CONFLICT (user_id, pattern_type)
    DO UPDATE SET
        pattern_data = user_context_patterns.pattern_data || NEW.pattern_data,
        frequency_count = user_context_patterns.frequency_count + 1,
        confidence_score = LEAST(user_context_patterns.confidence_score + 0.1, 1.0),
        last_observed_at = NOW(),
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_context_patterns
    AFTER INSERT ON context_completion_events
    FOR EACH ROW
    EXECUTE FUNCTION update_user_context_patterns();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.context_completion_events TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.context_gaps_analysis TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.context_suggestions_tracking TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_context_patterns TO authenticated;

GRANT EXECUTE ON FUNCTION get_user_context_completion_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION analyze_user_context_patterns(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_context_gap_effectiveness() TO authenticated;

-- Comments for documentation
COMMENT ON TABLE public.context_completion_events IS 'Tracks user interactions with context completion suggestions';
COMMENT ON TABLE public.context_gaps_analysis IS 'Analyzes context gaps and their resolution patterns';
COMMENT ON TABLE public.context_suggestions_tracking IS 'Tracks effectiveness of different suggestion types';
COMMENT ON TABLE public.user_context_patterns IS 'Learned patterns about user behavior for better personalization';

COMMENT ON FUNCTION get_user_context_completion_stats(UUID) IS 'Returns comprehensive stats about user context completion behavior';
COMMENT ON FUNCTION analyze_user_context_patterns(UUID) IS 'Identifies behavioral patterns for personalized suggestions';
COMMENT ON FUNCTION get_context_gap_effectiveness() IS 'Returns metrics on which gap types are most effectively filled'; 