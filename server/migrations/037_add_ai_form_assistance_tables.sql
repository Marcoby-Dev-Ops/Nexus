-- Migration: Add AI Form Assistance Tables
-- This migration adds tables for AI-powered form completion assistance
-- Integrates with existing ai_conversations, ai_messages, and ai_insights tables

-- Create table for AI assistant form completion sessions
CREATE TABLE IF NOT EXISTS ai_form_assistance_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    conversation_id UUID, -- Link to existing conversation (foreign key will be added later)
    form_type VARCHAR(100) NOT NULL, -- 'company_profile', 'user_profile', etc.
    session_data JSONB DEFAULT '{}',
    conversation_history JSONB DEFAULT '[]',
    suggestions_generated JSONB DEFAULT '[]',
    fields_completed JSONB DEFAULT '[]',
    completion_percentage INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'abandoned'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create table for AI-generated form suggestions
CREATE TABLE IF NOT EXISTS ai_form_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES ai_form_assistance_sessions(id) ON DELETE CASCADE,
    field_name VARCHAR(100) NOT NULL,
    field_type VARCHAR(50) NOT NULL, -- 'text', 'select', 'textarea', 'array'
    suggested_value TEXT,
    confidence_score DECIMAL(3,2) DEFAULT 0.0,
    reasoning TEXT,
    source_context JSONB DEFAULT '{}',
    accepted BOOLEAN DEFAULT false,
    applied_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_form_assistance_sessions_user_id 
ON ai_form_assistance_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_ai_form_assistance_sessions_company_id 
ON ai_form_assistance_sessions(company_id);

CREATE INDEX IF NOT EXISTS idx_ai_form_assistance_sessions_form_type 
ON ai_form_assistance_sessions(form_type);

-- Note: conversation_id index will be created later when the table exists

CREATE INDEX IF NOT EXISTS idx_ai_form_suggestions_session_id 
ON ai_form_suggestions(session_id);

CREATE INDEX IF NOT EXISTS idx_ai_form_suggestions_field_name 
ON ai_form_suggestions(field_name);

-- Create function to calculate form completion percentage
CREATE OR REPLACE FUNCTION calculate_form_completion_percentage(
    session_uuid UUID
)
RETURNS INTEGER AS $$
DECLARE
    session_data JSONB;
    total_fields INTEGER := 0;
    completed_fields INTEGER := 0;
    field_name TEXT;
    field_value TEXT;
BEGIN
    -- Get session data
    SELECT session_data INTO session_data
    FROM ai_form_assistance_sessions
    WHERE id = session_uuid;
    
    IF session_data IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Count total fields and completed fields
    FOR field_name, field_value IN SELECT * FROM jsonb_each_text(session_data)
    LOOP
        total_fields := total_fields + 1;
        
        -- Check if field is completed (has meaningful value)
        IF field_value IS NOT NULL AND length(trim(field_value)) > 0 THEN
            completed_fields := completed_fields + 1;
        END IF;
    END LOOP;
    
    -- Return percentage
    IF total_fields > 0 THEN
        RETURN ROUND((completed_fields::DECIMAL / total_fields) * 100);
    ELSE
        RETURN 0;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to generate AI suggestions for form fields
CREATE OR REPLACE FUNCTION generate_ai_form_suggestions(
    session_uuid UUID,
    field_name TEXT,
    field_type TEXT,
    context_data JSONB DEFAULT '{}'
)
RETURNS TABLE(
    suggestion_id UUID,
    suggested_value TEXT,
    confidence_score DECIMAL(3,2),
    reasoning TEXT
) AS $$
DECLARE
    session_record RECORD;
    company_data JSONB;
    user_context JSONB;
BEGIN
    -- Get session data
    SELECT * INTO session_record
    FROM ai_form_assistance_sessions
    WHERE id = session_uuid;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Get company knowledge data for context
    SELECT data INTO company_data
    FROM company_knowledge_data
    WHERE company_id = session_record.company_id;
    
    -- Get user context
    SELECT 
        jsonb_build_object(
            'user_id', up.user_id,
            'role', up.role,
            'department', up.department,
            'job_title', up.job_title,
            'company', up.company
        ) INTO user_context
    FROM user_profiles up
    WHERE up.user_id = session_record.user_id;
    
    -- Generate suggestions based on field type and context
    -- This is a placeholder - actual AI logic would be implemented in the application layer
    RETURN QUERY
    SELECT 
        gen_random_uuid()::UUID as suggestion_id,
        'AI-generated suggestion'::TEXT as suggested_value,
        0.85::DECIMAL(3,2) as confidence_score,
        'Generated based on company context and user profile'::TEXT as reasoning;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update completion percentage when session data changes
CREATE OR REPLACE FUNCTION update_form_completion_percentage()
RETURNS TRIGGER AS $$
BEGIN
    NEW.completion_percentage = calculate_form_completion_percentage(NEW.id);
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_form_completion_percentage
    BEFORE UPDATE ON ai_form_assistance_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_form_completion_percentage();

-- Add RLS policies for security
ALTER TABLE ai_form_assistance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_form_suggestions ENABLE ROW LEVEL SECURITY;

-- Policy for ai_form_assistance_sessions
CREATE POLICY "Users can view their own form assistance sessions" ON ai_form_assistance_sessions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own form assistance sessions" ON ai_form_assistance_sessions
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own form assistance sessions" ON ai_form_assistance_sessions
    FOR UPDATE USING (user_id = auth.uid());

-- Policy for ai_form_suggestions
CREATE POLICY "Users can view their own form suggestions" ON ai_form_suggestions
    FOR SELECT USING (
        session_id IN (
            SELECT id FROM ai_form_assistance_sessions WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own form suggestions" ON ai_form_suggestions
    FOR INSERT WITH CHECK (
        session_id IN (
            SELECT id FROM ai_form_assistance_sessions WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own form suggestions" ON ai_form_suggestions
    FOR UPDATE USING (
        session_id IN (
            SELECT id FROM ai_form_assistance_sessions WHERE user_id = auth.uid()
        )
    );

-- Note: Permissions will be granted later when the auth system is properly configured
