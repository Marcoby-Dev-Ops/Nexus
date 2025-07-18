-- Migration to add RAG context fields to user_profiles table
-- These fields enable personalized AI assistance based on user context

-- Add RAG-specific context fields
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS rag_context JSONB DEFAULT '{
  "experience_level": "intermediate",
  "communication_style": "direct",
  "primary_responsibilities": [],
  "current_pain_points": [],
  "immediate_goals": "",
  "success_metrics": [],
  "time_availability": "medium",
  "collaboration_frequency": "small-team",
  "automation_maturity": "basic",
  "business_priorities": [],
  "success_timeframe": "3 months",
  "key_tools": [],
  "data_sources": [],
  "learning_preferences": [],
  "decision_making_style": "analytical",
  "information_depth_preference": "detailed"
}'::jsonb;

-- Add context quality tracking fields
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS context_quality_score INTEGER DEFAULT 0;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS last_context_update TIMESTAMPTZ DEFAULT NOW();

-- Add indexes for better performance on RAG context queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_context_quality ON public.user_profiles(context_quality_score);
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_context_update ON public.user_profiles(last_context_update DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_rag_context_gin ON public.user_profiles USING gin (rag_context);

-- Function to calculate and update profile completion percentage based on RAG context
CREATE OR REPLACE FUNCTION update_profile_completion_with_rag_context()
RETURNS TRIGGER AS $$
DECLARE
    completion_score INTEGER := 0;
    context_score INTEGER := 0;
    rag_data JSONB;
BEGIN
    -- Get RAG context data
    rag_data := NEW.rag_context;
    
    -- Calculate basic profile completion (50 points)
    IF NEW.first_name IS NOT NULL AND NEW.first_name != '' THEN completion_score := completion_score + 8; END IF;
    IF NEW.last_name IS NOT NULL AND NEW.last_name != '' THEN completion_score := completion_score + 8; END IF;
    IF NEW.job_title IS NOT NULL AND NEW.job_title != '' THEN completion_score := completion_score + 8; END IF;
    IF NEW.department IS NOT NULL AND NEW.department != '' THEN completion_score := completion_score + 8; END IF;
    IF NEW.bio IS NOT NULL AND NEW.bio != '' THEN completion_score := completion_score + 6; END IF;
    IF NEW.location IS NOT NULL AND NEW.location != '' THEN completion_score := completion_score + 6; END IF;
    IF NEW.timezone IS NOT NULL AND NEW.timezone != '' THEN completion_score := completion_score + 6; END IF;
    
    -- Calculate RAG context completion (50 points)
    IF rag_data->>'experience_level' IS NOT NULL AND rag_data->>'experience_level' != '' THEN context_score := context_score + 10; END IF;
    IF rag_data->>'communication_style' IS NOT NULL AND rag_data->>'communication_style' != '' THEN context_score := context_score + 10; END IF;
    IF rag_data->>'immediate_goals' IS NOT NULL AND rag_data->>'immediate_goals' != '' THEN context_score := context_score + 10; END IF;
    IF rag_data->'primary_responsibilities' IS NOT NULL AND jsonb_array_length(rag_data->'primary_responsibilities') > 0 THEN context_score := context_score + 10; END IF;
    IF rag_data->'current_pain_points' IS NOT NULL AND jsonb_array_length(rag_data->'current_pain_points') > 0 THEN context_score := context_score + 5; END IF;
    IF rag_data->'success_metrics' IS NOT NULL AND jsonb_array_length(rag_data->'success_metrics') > 0 THEN context_score := context_score + 5; END IF;
    
    -- Update completion percentage
    NEW.profile_completion_percentage := LEAST(completion_score + context_score, 100);
    
    -- Calculate context quality score for RAG effectiveness
    NEW.context_quality_score := LEAST(
        (CASE WHEN NEW.first_name IS NOT NULL AND NEW.first_name != '' THEN 5 ELSE 0 END) +
        (CASE WHEN NEW.job_title IS NOT NULL AND NEW.job_title != '' THEN 5 ELSE 0 END) +
        (CASE WHEN NEW.department IS NOT NULL AND NEW.department != '' THEN 5 ELSE 0 END) +
        (CASE WHEN NEW.role IS NOT NULL AND NEW.role != 'user' THEN 5 ELSE 0 END) +
        (CASE WHEN NEW.company_id IS NOT NULL THEN 5 ELSE 0 END) +
        (CASE WHEN rag_data->>'experience_level' IS NOT NULL AND rag_data->>'experience_level' != '' THEN 15 ELSE 0 END) +
        (CASE WHEN rag_data->>'communication_style' IS NOT NULL AND rag_data->>'communication_style' != '' THEN 15 ELSE 0 END) +
        (CASE WHEN rag_data->>'immediate_goals' IS NOT NULL AND rag_data->>'immediate_goals' != '' THEN 15 ELSE 0 END) +
        (CASE WHEN rag_data->'primary_responsibilities' IS NOT NULL AND jsonb_array_length(rag_data->'primary_responsibilities') > 0 THEN 15 ELSE 0 END) +
        (CASE WHEN rag_data->'current_pain_points' IS NOT NULL AND jsonb_array_length(rag_data->'current_pain_points') > 0 THEN 15 ELSE 0 END),
        100
    );
    
    -- Update last context update timestamp
    NEW.last_context_update := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update completion scores
DROP TRIGGER IF EXISTS update_profile_completion_rag_trigger ON public.user_profiles;
CREATE TRIGGER update_profile_completion_rag_trigger
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_completion_with_rag_context();

-- Update existing profiles to have default RAG context
UPDATE public.user_profiles 
SET rag_context = '{
  "experience_level": "intermediate",
  "communication_style": "direct",
  "primary_responsibilities": [],
  "current_pain_points": [],
  "immediate_goals": "",
  "success_metrics": [],
  "time_availability": "medium",
  "collaboration_frequency": "small-team",
  "automation_maturity": "basic",
  "business_priorities": [],
  "success_timeframe": "3 months",
  "key_tools": [],
  "data_sources": [],
  "learning_preferences": [],
  "decision_making_style": "analytical",
  "information_depth_preference": "detailed"
}'::jsonb
WHERE rag_context IS NULL;

-- Add helpful comments
COMMENT ON COLUMN public.user_profiles.rag_context IS 'RAG-specific context fields for personalized AI assistance';
COMMENT ON COLUMN public.user_profiles.context_quality_score IS 'Score (0-100) indicating quality of context for RAG system';
COMMENT ON COLUMN public.user_profiles.last_context_update IS 'Timestamp of last RAG context update';

-- Create view for RAG context analysis
CREATE OR REPLACE VIEW public.user_rag_context_analysis AS
SELECT 
    id,
    first_name,
    last_name,
    job_title,
    department,
    role,
    profile_completion_percentage,
    context_quality_score,
    last_context_update,
    rag_context->>'experience_level' as experience_level,
    rag_context->>'communication_style' as communication_style,
    rag_context->>'immediate_goals' as immediate_goals,
    jsonb_array_length(COALESCE(rag_context->'primary_responsibilities', '[]'::jsonb)) as responsibilities_count,
    jsonb_array_length(COALESCE(rag_context->'current_pain_points', '[]'::jsonb)) as pain_points_count,
    jsonb_array_length(COALESCE(rag_context->'success_metrics', '[]'::jsonb)) as success_metrics_count,
    rag_context->>'time_availability' as time_availability,
    rag_context->>'collaboration_frequency' as collaboration_frequency,
    rag_context->>'automation_maturity' as automation_maturity,
    rag_context->>'success_timeframe' as success_timeframe,
    jsonb_array_length(COALESCE(rag_context->'key_tools', '[]'::jsonb)) as key_tools_count,
    jsonb_array_length(COALESCE(rag_context->'business_priorities', '[]'::jsonb)) as business_priorities_count,
    CASE 
        WHEN context_quality_score >= 80 THEN 'Expert'
        WHEN context_quality_score >= 60 THEN 'Good'
        WHEN context_quality_score >= 40 THEN 'Basic'
        ELSE 'Generic'
    END as rag_assistance_level
FROM public.user_profiles
WHERE rag_context IS NOT NULL;

-- Add RLS policies for RAG context
CREATE POLICY "Users can view own RAG context" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own RAG context" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Grant permissions on the view
GRANT SELECT ON public.user_rag_context_analysis TO authenticated; 