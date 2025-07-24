-- Fix missing RLS policies that were commented out in previous migration
-- This migration adds the essential policies needed for the application to function

-- ====================================================================
-- USER PROFILES POLICIES (ESSENTIAL)
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
-- COMPANIES POLICIES (ESSENTIAL)
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

-- ====================================================================
-- AI INBOX ITEMS POLICIES (ESSENTIAL)
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
-- AI INSIGHTS POLICIES (ESSENTIAL)
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
-- THOUGHTS POLICIES (ESSENTIAL)
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
-- ACTION CARDS POLICIES (ESSENTIAL)
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
-- USER INTEGRATIONS POLICIES (ESSENTIAL)
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
-- INTEGRATIONS POLICIES (ESSENTIAL)
-- ====================================================================

-- Integrations - readable by all authenticated users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'integrations' 
        AND policyname = 'Integrations are viewable by authenticated users'
    ) THEN
        CREATE POLICY "Integrations are viewable by authenticated users" ON public.integrations
            FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- ====================================================================
-- BILLING PLANS POLICIES (ESSENTIAL)
-- ====================================================================

-- Billing plans - readable by all authenticated users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'billing_plans' 
        AND policyname = 'Billing plans are viewable by authenticated users'
    ) THEN
        CREATE POLICY "Billing plans are viewable by authenticated users" ON public.billing_plans
            FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- User billing plans - users can only see their own
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_billing_plans' 
        AND policyname = 'Users can view own billing plans'
    ) THEN
        CREATE POLICY "Users can view own billing plans" ON public.user_billing_plans
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

-- ====================================================================
-- SERVICE ROLE GRANTS (ESSENTIAL)
-- ====================================================================

-- Grant service role access to essential tables
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.user_profiles TO service_role';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'companies') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.companies TO service_role';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_inbox_items') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.ai_inbox_items TO service_role';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_insights') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.ai_insights TO service_role';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'thoughts') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.thoughts TO service_role';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'action_cards') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.action_cards TO service_role';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_integrations') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.user_integrations TO service_role';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'integrations') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.integrations TO service_role';
    END IF;
END $$;
