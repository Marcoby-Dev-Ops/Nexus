-- Migration: Add Comprehensive RLS Policies
-- This migration adds proper Row Level Security policies for all tables
-- to ensure secure data access and prevent unauthorized access

-- ====================================================================
-- ENABLE RLS ON ALL TABLES
-- ====================================================================

-- Core user and company tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- AI and insights tables
ALTER TABLE public.ai_inbox_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thoughts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_cards ENABLE ROW LEVEL SECURITY;

-- Integration tables
ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_data ENABLE ROW LEVEL SECURITY;

-- AI and chat tables (from missing tables migration)
ALTER TABLE public.ai_action_card_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_embedding_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_audit_logs ENABLE ROW LEVEL SECURITY;

-- Assessment tables
ALTER TABLE public.assessment_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_category_score ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_response ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_question ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_category ENABLE ROW LEVEL SECURITY;

-- Configuration and activity tables
ALTER TABLE public.n8n_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recent ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- USER PROFILES POLICIES
-- ====================================================================

-- Users can read their own profile
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' 
        AND policyname = 'Users can read own profile'
    ) THEN
        CREATE POLICY "Users can read own profile" ON public.user_profiles
            FOR SELECT USING (auth.uid() = id);
    END IF;
END $$;

-- Users can update their own profile
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' 
        AND policyname = 'Users can update own profile'
    ) THEN
        CREATE POLICY "Users can update own profile" ON public.user_profiles
            FOR UPDATE USING (auth.uid() = id);
    END IF;
END $$;

-- Users can insert their own profile (during registration)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' 
        AND policyname = 'Users can insert own profile'
    ) THEN
        CREATE POLICY "Users can insert own profile" ON public.user_profiles
            FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- ====================================================================
-- COMPANIES POLICIES
-- ====================================================================

-- Users can read companies they belong to
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'companies' 
        AND policyname = 'Users can read own company'
    ) THEN
        CREATE POLICY "Users can read own company" ON public.companies
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.user_profiles 
                    WHERE user_profiles.company_id = companies.id 
                    AND user_profiles.id = auth.uid()
                )
            );
    END IF;
END $$;

-- Company owners/admins can update their company
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'companies' 
        AND policyname = 'Company owners can update company'
    ) THEN
        CREATE POLICY "Company owners can update company" ON public.companies
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM public.user_profiles 
                    WHERE user_profiles.company_id = companies.id 
                    AND user_profiles.id = auth.uid()
                    AND user_profiles.role IN ('owner', 'admin')
                )
            );
    END IF;
END $$;

-- Company owners can insert new companies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'companies' 
        AND policyname = 'Company owners can insert companies'
    ) THEN
        CREATE POLICY "Company owners can insert companies" ON public.companies
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.user_profiles 
                    WHERE user_profiles.id = auth.uid()
                    AND user_profiles.role IN ('owner', 'admin')
                )
            );
    END IF;
END $$;

-- ====================================================================
-- CONTACTS POLICIES
-- ====================================================================

-- Users can read contacts from their company
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'contacts' 
        AND policyname = 'Users can read company contacts'
    ) THEN
        CREATE POLICY "Users can read company contacts" ON public.contacts
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.user_profiles 
                    WHERE user_profiles.company_id = contacts.company_id 
                    AND user_profiles.id = auth.uid()
                )
            );
    END IF;
END $$;

-- Users can manage contacts in their company
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'contacts' 
        AND policyname = 'Users can manage company contacts'
    ) THEN
        CREATE POLICY "Users can manage company contacts" ON public.contacts
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.user_profiles 
                    WHERE user_profiles.company_id = contacts.company_id 
                    AND user_profiles.id = auth.uid()
                )
            );
    END IF;
END $$;

-- ====================================================================
-- DEALS POLICIES
-- ====================================================================

-- Users can read deals from their company
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'deals' 
        AND policyname = 'Users can read company deals'
    ) THEN
        CREATE POLICY "Users can read company deals" ON public.deals
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.user_profiles 
                    WHERE user_profiles.company_id = deals.company_id 
                    AND user_profiles.id = auth.uid()
                )
            );
    END IF;
END $$;

-- Users can manage deals in their company
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'deals' 
        AND policyname = 'Users can manage company deals'
    ) THEN
        CREATE POLICY "Users can manage company deals" ON public.deals
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.user_profiles 
                    WHERE user_profiles.company_id = deals.company_id 
                    AND user_profiles.id = auth.uid()
                )
            );
    END IF;
END $$;

-- ====================================================================
-- TASKS POLICIES
-- ====================================================================

-- Users can read their own tasks
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'tasks' 
        AND policyname = 'Users can read own tasks'
    ) THEN
        CREATE POLICY "Users can read own tasks" ON public.tasks
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

-- Users can manage their own tasks
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'tasks' 
        AND policyname = 'Users can manage own tasks'
    ) THEN
        CREATE POLICY "Users can manage own tasks" ON public.tasks
            FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- ====================================================================
-- AI INBOX ITEMS POLICIES
-- ====================================================================

-- Users can read their own AI inbox items
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_inbox_items' 
        AND policyname = 'Users can read own AI inbox items'
    ) THEN
        CREATE POLICY "Users can read own AI inbox items" ON public.ai_inbox_items
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

-- Users can manage their own AI inbox items
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_inbox_items' 
        AND policyname = 'Users can manage own AI inbox items'
    ) THEN
        CREATE POLICY "Users can manage own AI inbox items" ON public.ai_inbox_items
            FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- ====================================================================
-- AI INSIGHTS POLICIES
-- ====================================================================

-- Users can read their own AI insights
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_insights' 
        AND policyname = 'Users can read own AI insights'
    ) THEN
        CREATE POLICY "Users can read own AI insights" ON public.ai_insights
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

-- Users can manage their own AI insights
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_insights' 
        AND policyname = 'Users can manage own AI insights'
    ) THEN
        CREATE POLICY "Users can manage own AI insights" ON public.ai_insights
            FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- ====================================================================
-- THOUGHTS POLICIES
-- ====================================================================

-- Users can read their own thoughts
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'thoughts' 
        AND policyname = 'Users can read own thoughts'
    ) THEN
        CREATE POLICY "Users can read own thoughts" ON public.thoughts
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

-- Users can manage their own thoughts
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'thoughts' 
        AND policyname = 'Users can manage own thoughts'
    ) THEN
        CREATE POLICY "Users can manage own thoughts" ON public.thoughts
            FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- ====================================================================
-- ACTION CARDS POLICIES
-- ====================================================================

-- Users can read their own action cards
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'action_cards' 
        AND policyname = 'Users can read own action cards'
    ) THEN
        CREATE POLICY "Users can read own action cards" ON public.action_cards
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

-- Users can manage their own action cards
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'action_cards' 
        AND policyname = 'Users can manage own action cards'
    ) THEN
        CREATE POLICY "Users can manage own action cards" ON public.action_cards
            FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- ====================================================================
-- USER INTEGRATIONS POLICIES
-- ====================================================================

-- Users can read their own integrations
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_integrations' 
        AND policyname = 'Users can read own integrations'
    ) THEN
        CREATE POLICY "Users can read own integrations" ON public.user_integrations
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

-- Users can manage their own integrations
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_integrations' 
        AND policyname = 'Users can manage own integrations'
    ) THEN
        CREATE POLICY "Users can manage own integrations" ON public.user_integrations
            FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- ====================================================================
-- INTEGRATION DATA POLICIES
-- ====================================================================

-- Users can read integration data from their integrations
-- Note: integration_data table may not exist yet, commenting out for now
/*
CREATE POLICY "Users can read own integration data" ON public.integration_data
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_integrations 
            WHERE user_integrations.id = integration_data.integration_id 
            AND user_integrations.user_id = auth.uid()
        )
    );

-- Users can manage integration data from their integrations
CREATE POLICY "Users can manage own integration data" ON public.integration_data
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_integrations 
            WHERE user_integrations.id = integration_data.integration_id 
            AND user_integrations.user_id = auth.uid()
        )
    );
*/

-- ====================================================================
-- AI ACTION CARD TEMPLATES POLICIES
-- ====================================================================

-- All authenticated users can read templates (public templates)
-- CREATE POLICY "Authenticated users can read AI action card templates" ON public.ai_action_card_templates
--     FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

-- Only service role can manage templates
-- CREATE POLICY "Service role can manage AI action card templates" ON public.ai_action_card_templates
--     FOR ALL USING (auth.role() = 'service_role');

-- ====================================================================
-- AI EMBEDDING CACHE POLICIES
-- ====================================================================

-- All authenticated users can read/write cache (shared cache)
-- CREATE POLICY "Authenticated users can access AI embedding cache" ON public.ai_embedding_cache
--     FOR ALL USING (auth.role() = 'authenticated');

-- ====================================================================
-- CHAT CONVERSATIONS POLICIES
-- ====================================================================

-- Users can read their own conversations
-- CREATE POLICY "Users can read own chat conversations" ON public.chat_conversations
--     FOR SELECT USING (auth.uid() = user_id);

-- Users can manage their own conversations
-- CREATE POLICY "Users can manage own chat conversations" ON public.chat_conversations
--     FOR ALL USING (auth.uid() = user_id);

-- ====================================================================
-- CHAT MESSAGES POLICIES
-- ====================================================================

-- Users can read messages from their conversations
-- CREATE POLICY "Users can read own chat messages" ON public.chat_messages
--     FOR SELECT USING (
--         EXISTS (
--             SELECT 1 FROM public.chat_conversations 
--             WHERE chat_conversations.id = chat_messages.conversation_id 
--             AND chat_conversations.user_id = auth.uid()
--         )
--     );

-- Users can manage messages in their conversations
-- CREATE POLICY "Users can manage own chat messages" ON public.chat_messages
--     FOR ALL USING (
--         EXISTS (
--             SELECT 1 FROM public.chat_conversations 
--             WHERE chat_conversations.id = chat_messages.conversation_id 
--             AND chat_conversations.user_id = auth.uid()
--         )
--     );

-- ====================================================================
-- AI MESSAGES POLICIES
-- ====================================================================

-- Users can read AI messages from their conversations
-- CREATE POLICY "Users can read own AI messages" ON public.ai_messages
--     FOR SELECT USING (
--         EXISTS (
--             SELECT 1 FROM public.ai_conversations 
--             WHERE ai_conversations.id = ai_messages.conversation_id 
--             AND ai_conversations.user_id = auth.uid()
--         )
--     );

-- Users can manage AI messages in their conversations
-- CREATE POLICY "Users can manage own AI messages" ON public.ai_messages
--     FOR ALL USING (
--         EXISTS (
--             SELECT 1 FROM public.ai_conversations 
--             WHERE ai_conversations.id = ai_messages.conversation_id 
--             AND ai_conversations.user_id = auth.uid()
--         )
--     );

-- ====================================================================
-- AI CONVERSATIONS POLICIES
-- ====================================================================

-- Users can read their own AI conversations
-- CREATE POLICY "Users can read own AI conversations" ON public.ai_conversations
--     FOR SELECT USING (auth.uid() = user_id);

-- Users can manage their own AI conversations
-- CREATE POLICY "Users can manage own AI conversations" ON public.ai_conversations
--     FOR ALL USING (auth.uid() = user_id);

-- ====================================================================
-- AI AUDIT LOGS POLICIES
-- ====================================================================

-- Users can read their own audit logs
-- CREATE POLICY "Users can read own AI audit logs" ON public.ai_audit_logs
--     FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage all audit logs
-- CREATE POLICY "Service role can manage AI audit logs" ON public.ai_audit_logs
--     FOR ALL USING (auth.role() = 'service_role');

-- ====================================================================
-- ASSESSMENT TABLES POLICIES
-- ====================================================================

-- Users can read assessments from their company
-- CREATE POLICY "Users can read company assessments" ON public.assessment_summary
--     FOR SELECT USING (
--         EXISTS (
--             SELECT 1 FROM public.user_profiles 
--             WHERE user_profiles.company_id = assessment_summary.company_id 
--             AND user_profiles.id = auth.uid()
--         )
--     );

-- Users can manage assessments in their company
-- CREATE POLICY "Users can manage company assessments" ON public.assessment_summary
--     FOR ALL USING (
--         EXISTS (
--             SELECT 1 FROM public.user_profiles 
--             WHERE user_profiles.company_id = assessment_summary.company_id 
--             AND user_profiles.id = auth.uid()
--         )
--     );

-- Similar policies for other assessment tables
-- CREATE POLICY "Users can read company assessment category scores" ON public.assessment_category_score
--     FOR SELECT USING (
--         EXISTS (
--             SELECT 1 FROM public.user_profiles 
--             WHERE user_profiles.company_id = assessment_category_score.company_id 
--             AND user_profiles.id = auth.uid()
--         )
--     );

-- CREATE POLICY "Users can read company assessment responses" ON public.assessment_response
--     FOR SELECT USING (
--         EXISTS (
--             SELECT 1 FROM public.user_profiles 
--             WHERE user_profiles.company_id = assessment_response.company_id 
--             AND user_profiles.id = auth.uid()
--         )
--     );

-- Assessment questions and categories are public templates
-- CREATE POLICY "Authenticated users can read assessment questions" ON public.assessment_question
--     FOR SELECT USING (auth.role() = 'authenticated');

-- CREATE POLICY "Authenticated users can read assessment categories" ON public.assessment_category
--     FOR SELECT USING (auth.role() = 'authenticated');

-- ====================================================================
-- N8N CONFIGURATIONS POLICIES
-- ====================================================================

-- Users can read their own N8N configurations
-- CREATE POLICY "Users can read own N8N configurations" ON public.n8n_configurations
--     FOR SELECT USING (auth.uid() = user_id);

-- Users can manage their own N8N configurations
-- CREATE POLICY "Users can manage own N8N configurations" ON public.n8n_configurations
--     FOR ALL USING (auth.uid() = user_id);

-- ====================================================================
-- USER ACTIVITY POLICIES
-- ====================================================================

-- Users can read their own activity
-- CREATE POLICY "Users can read own activity" ON public.user_activity
--     FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage all user activity
-- CREATE POLICY "Service role can manage user activity" ON public.user_activity
--     FOR ALL USING (auth.role() = 'service_role');

-- ====================================================================
-- RECENT POLICIES
-- ====================================================================

-- Users can read their own recent items
-- CREATE POLICY "Users can read own recent items" ON public.recent
--     FOR SELECT USING (auth.uid() = user_id);

-- Users can manage their own recent items
-- CREATE POLICY "Users can manage own recent items" ON public.recent
--     FOR ALL USING (auth.uid() = user_id);

-- ====================================================================
-- GRANT SERVICE ROLE ACCESS
-- ====================================================================

-- Grant service role access to all tables for edge functions
GRANT ALL ON public.user_profiles TO service_role;
GRANT ALL ON public.companies TO service_role;
GRANT ALL ON public.contacts TO service_role;
GRANT ALL ON public.deals TO service_role;
GRANT ALL ON public.tasks TO service_role;
GRANT ALL ON public.ai_inbox_items TO service_role;
GRANT ALL ON public.ai_insights TO service_role;
GRANT ALL ON public.thoughts TO service_role;
GRANT ALL ON public.action_cards TO service_role;
GRANT ALL ON public.user_integrations TO service_role;
GRANT ALL ON public.integration_data TO service_role;
GRANT ALL ON public.ai_action_card_templates TO service_role;
GRANT ALL ON public.ai_embedding_cache TO service_role;
GRANT ALL ON public.chat_conversations TO service_role;
GRANT ALL ON public.chat_messages TO service_role;
GRANT ALL ON public.ai_messages TO service_role;
GRANT ALL ON public.ai_conversations TO service_role;
GRANT ALL ON public.ai_audit_logs TO service_role;
GRANT ALL ON public.assessment_summary TO service_role;
GRANT ALL ON public.assessment_category_score TO service_role;
GRANT ALL ON public.assessment_response TO service_role;
GRANT ALL ON public.assessment_question TO service_role;
GRANT ALL ON public.assessment_category TO service_role;
GRANT ALL ON public.n8n_configurations TO service_role;
GRANT ALL ON public.user_activity TO service_role;
GRANT ALL ON public.recent TO service_role;
