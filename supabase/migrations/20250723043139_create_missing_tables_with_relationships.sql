-- Migration: Create Missing Tables with Proper Relationships
-- This migration creates all missing tables that are referenced in the codebase
-- with proper foreign key relationships and RLS policies

-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ====================================================================
-- AI AND CHAT TABLES
-- ====================================================================

-- AI Action Card Templates (for slash commands)
CREATE TABLE IF NOT EXISTS public.ai_action_card_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    template_data JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    last_used TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Embedding Cache (for RAG functionality)
CREATE TABLE IF NOT EXISTS public.ai_embedding_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    checksum TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    embedding TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat Conversations
CREATE TABLE IF NOT EXISTS public.chat_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    summary_chunks TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat Messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Messages (for AI chat functionality)
CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Conversations
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    summary_chunks TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Audit Logs
CREATE TABLE IF NOT EXISTS public.ai_audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- ASSESSMENT TABLES
-- ====================================================================

-- Assessment Summary
CREATE TABLE IF NOT EXISTS public.assessment_summary (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    overall_score INTEGER DEFAULT 0,
    category_scores JSONB DEFAULT '{}',
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assessment Category Score
CREATE TABLE IF NOT EXISTS public.assessment_category_score (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    category_name TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    max_score INTEGER DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assessment Response
CREATE TABLE IF NOT EXISTS public.assessment_response (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    question_id UUID NOT NULL,
    answer_value TEXT,
    score INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assessment Question
CREATE TABLE IF NOT EXISTS public.assessment_question (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL,
    action_type TEXT,
    target_field TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assessment Category
CREATE TABLE IF NOT EXISTS public.assessment_category (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    weight INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- N8N CONFIGURATION TABLES
-- ====================================================================

-- N8N Configurations
CREATE TABLE IF NOT EXISTS public.n8n_configurations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    instance_name TEXT NOT NULL,
    base_url TEXT NOT NULL,
    api_key TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- USER ACTIVITY AND RECENT TABLES
-- ====================================================================

-- User Activity
CREATE TABLE IF NOT EXISTS public.user_activity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recent Items
CREATE TABLE IF NOT EXISTS public.recent (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL,
    item_id TEXT NOT NULL,
    item_title TEXT,
    visited_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- ADD TRIGGERS FOR UPDATED_AT COLUMNS
-- ====================================================================

-- Add triggers for all tables with updated_at columns
DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN (
            'ai_action_card_templates', 'chat_conversations', 'ai_conversations',
            'assessment_summary', 'assessment_category_score', 'assessment_response',
            'assessment_question', 'assessment_category', 'n8n_configurations'
        )
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_updated_at_column ON public.%I;
            CREATE TRIGGER update_updated_at_column
                BEFORE UPDATE ON public.%I
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        ', table_record.table_name, table_record.table_name);
    END LOOP;
END $$;

-- ====================================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ====================================================================

-- Enable RLS on all new tables
ALTER TABLE public.ai_action_card_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_embedding_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_category_score ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_response ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_question ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_category ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.n8n_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recent ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- CREATE RLS POLICIES
-- ====================================================================

-- AI Action Card Templates - Read access for all authenticated users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_action_card_templates' 
        AND policyname = 'Allow read access to ai_action_card_templates'
    ) THEN
        CREATE POLICY "Allow read access to ai_action_card_templates" ON public.ai_action_card_templates
            FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- AI Embedding Cache - Read/write access for all authenticated users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_embedding_cache' 
        AND policyname = 'Allow all access to ai_embedding_cache'
    ) THEN
        CREATE POLICY "Allow all access to ai_embedding_cache" ON public.ai_embedding_cache
            FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- Chat Conversations - Users can only access their own conversations
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'chat_conversations' 
        AND policyname = 'Users can access own chat conversations'
    ) THEN
        CREATE POLICY "Users can access own chat conversations" ON public.chat_conversations
            FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- Chat Messages - Users can only access messages in their conversations
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'chat_messages' 
        AND policyname = 'Users can access messages in own conversations'
    ) THEN
        CREATE POLICY "Users can access messages in own conversations" ON public.chat_messages
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.chat_conversations 
                    WHERE id = chat_messages.conversation_id 
                    AND user_id = auth.uid()
                )
            );
    END IF;
END $$;

-- AI Messages - Users can only access their own messages
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_messages' 
        AND policyname = 'Users can access own ai messages'
    ) THEN
        CREATE POLICY "Users can access own ai messages" ON public.ai_messages
            FOR ALL USING (auth.uid()::text = conversation_id::text);
    END IF;
END $$;

-- AI Conversations - Users can only access their own conversations
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_conversations' 
        AND policyname = 'Users can access own ai conversations'
    ) THEN
        CREATE POLICY "Users can access own ai conversations" ON public.ai_conversations
            FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- AI Audit Logs - Users can only access their own audit logs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_audit_logs' 
        AND policyname = 'Users can access own ai audit logs'
    ) THEN
        CREATE POLICY "Users can access own ai audit logs" ON public.ai_audit_logs
            FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- Assessment Summary - Company-based access
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'assessment_summary' 
        AND policyname = 'Company users can access assessment summary'
    ) THEN
        CREATE POLICY "Company users can access assessment summary" ON public.assessment_summary
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.user_profiles 
                    WHERE user_profiles.company_id = assessment_summary.company_id 
                    AND user_profiles.id = auth.uid()
                )
            );
    END IF;
END $$;

-- Assessment Category Score - Company-based access
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'assessment_category_score' 
        AND policyname = 'Company users can access assessment category scores'
    ) THEN
        CREATE POLICY "Company users can access assessment category scores" ON public.assessment_category_score
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.user_profiles 
                    WHERE user_profiles.company_id = assessment_category_score.company_id 
                    AND user_profiles.id = auth.uid()
                )
            );
    END IF;
END $$;

-- Assessment Response - Company-based access
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'assessment_response' 
        AND policyname = 'Company users can access assessment responses'
    ) THEN
        CREATE POLICY "Company users can access assessment responses" ON public.assessment_response
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.user_profiles 
                    WHERE user_profiles.company_id = assessment_response.company_id 
                    AND user_profiles.id = auth.uid()
                )
            );
    END IF;
END $$;

-- Assessment Question - Read access for all authenticated users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'assessment_question' 
        AND policyname = 'Allow read access to assessment questions'
    ) THEN
        CREATE POLICY "Allow read access to assessment questions" ON public.assessment_question
            FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- Assessment Category - Read access for all authenticated users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'assessment_category' 
        AND policyname = 'Allow read access to assessment categories'
    ) THEN
        CREATE POLICY "Allow read access to assessment categories" ON public.assessment_category
            FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- N8N Configurations - Users can only access their own configurations
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'n8n_configurations' 
        AND policyname = 'Users can access own n8n configurations'
    ) THEN
        CREATE POLICY "Users can access own n8n configurations" ON public.n8n_configurations
            FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- User Activity - Users can only access their own activity
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_activity' 
        AND policyname = 'Users can access own activity'
    ) THEN
        CREATE POLICY "Users can access own activity" ON public.user_activity
            FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- Recent - Users can only access their own recent items
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'recent' 
        AND policyname = 'Users can access own recent items'
    ) THEN
        CREATE POLICY "Users can access own recent items" ON public.recent
            FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- ====================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ====================================================================

-- Indexes for AI Action Card Templates
CREATE INDEX IF NOT EXISTS idx_ai_action_card_templates_slug ON public.ai_action_card_templates(slug);
CREATE INDEX IF NOT EXISTS idx_ai_action_card_templates_category ON public.ai_action_card_templates(category);
CREATE INDEX IF NOT EXISTS idx_ai_action_card_templates_active ON public.ai_action_card_templates(is_active);

-- Indexes for AI Embedding Cache
CREATE INDEX IF NOT EXISTS idx_ai_embedding_cache_checksum ON public.ai_embedding_cache(checksum);

-- Indexes for Chat Conversations
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON public.chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_created_at ON public.chat_conversations(created_at);

-- Indexes for Chat Messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);

-- Indexes for AI Messages
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON public.ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_created_at ON public.ai_messages(created_at);

-- Indexes for AI Conversations
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON public.ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_created_at ON public.ai_conversations(created_at);

-- Indexes for AI Audit Logs
CREATE INDEX IF NOT EXISTS idx_ai_audit_logs_user_id ON public.ai_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_audit_logs_created_at ON public.ai_audit_logs(created_at);

-- Indexes for Assessment tables
CREATE INDEX IF NOT EXISTS idx_assessment_summary_company_id ON public.assessment_summary(company_id);
CREATE INDEX IF NOT EXISTS idx_assessment_category_score_company_id ON public.assessment_category_score(company_id);
CREATE INDEX IF NOT EXISTS idx_assessment_response_company_id ON public.assessment_response(company_id);
CREATE INDEX IF NOT EXISTS idx_assessment_response_question_id ON public.assessment_response(question_id);

-- Indexes for N8N Configurations
CREATE INDEX IF NOT EXISTS idx_n8n_configurations_user_id ON public.n8n_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_n8n_configurations_active ON public.n8n_configurations(is_active);

-- Indexes for User Activity
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON public.user_activity(created_at);

-- Indexes for Recent
CREATE INDEX IF NOT EXISTS idx_recent_user_id ON public.recent(user_id);
CREATE INDEX IF NOT EXISTS idx_recent_visited_at ON public.recent(visited_at);

-- ====================================================================
-- INSERT DEFAULT DATA
-- ====================================================================

-- Insert default AI Action Card Templates
INSERT INTO public.ai_action_card_templates (slug, title, description, category, template_data, is_active) VALUES
('analyze-email', 'Analyze Email', 'Analyze the content and sentiment of an email', 'email', '{"action": "analyze_email", "description": "Analyze email content and sentiment"}', true),
('create-task', 'Create Task', 'Create a new task from email content', 'task', '{"action": "create_task", "description": "Create task from email"}', true),
('schedule-meeting', 'Schedule Meeting', 'Schedule a meeting based on email content', 'calendar', '{"action": "schedule_meeting", "description": "Schedule meeting from email"}', true),
('follow-up', 'Follow Up', 'Create a follow-up reminder', 'reminder', '{"action": "follow_up", "description": "Create follow-up reminder"}', true),
('delegate', 'Delegate Task', 'Delegate task to team member', 'delegation', '{"action": "delegate_task", "description": "Delegate task to team member"}', true)
ON CONFLICT (slug) DO NOTHING;

-- Insert default Assessment Categories
INSERT INTO public.assessment_category (name, description, weight) VALUES
('Business Operations', 'Core business processes and efficiency', 5),
('Customer Experience', 'Customer satisfaction and service quality', 4),
('Financial Health', 'Revenue, costs, and financial stability', 4),
('Technology & Infrastructure', 'IT systems and digital capabilities', 3),
('Team & Culture', 'Employee satisfaction and organizational culture', 2),
('Market Position', 'Competitive advantage and market share', 2)
ON CONFLICT DO NOTHING;

-- Insert default Assessment Questions
INSERT INTO public.assessment_question (category_id, question_text, question_type) 
SELECT 
    ac.id,
    'How would you rate your overall business efficiency?',
    'scale'
FROM public.assessment_category ac 
WHERE ac.name = 'Business Operations'
ON CONFLICT DO NOTHING;
