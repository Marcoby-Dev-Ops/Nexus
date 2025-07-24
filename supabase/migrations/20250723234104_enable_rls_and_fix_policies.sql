-- Enable RLS and fix policies for all essential tables
-- This migration ensures RLS is enabled and proper policies are in place

-- ====================================================================
-- ENABLE RLS ON ALL ESSENTIAL TABLES
-- ====================================================================

-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Enable RLS on ai_inbox_items
ALTER TABLE public.ai_inbox_items ENABLE ROW LEVEL SECURITY;

-- Enable RLS on ai_insights
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- Enable RLS on thoughts
ALTER TABLE public.thoughts ENABLE ROW LEVEL SECURITY;

-- Enable RLS on action_cards
ALTER TABLE public.action_cards ENABLE ROW LEVEL SECURITY;

-- Enable RLS on user_integrations
ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;

-- Enable RLS on integrations
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Enable RLS on billing_plans
ALTER TABLE public.billing_plans ENABLE ROW LEVEL SECURITY;

-- Enable RLS on user_billing_plans
ALTER TABLE public.user_billing_plans ENABLE ROW LEVEL SECURITY;

-- Enable RLS on business_profiles (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'business_profiles') THEN
        EXECUTE 'ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY';
    END IF;
END $$;

-- ====================================================================
-- DROP EXISTING POLICIES (to avoid conflicts)
-- ====================================================================

-- Drop existing policies on user_profiles
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

-- Drop existing policies on companies
DROP POLICY IF EXISTS "Users can read own company" ON public.companies;

-- Drop existing policies on ai_inbox_items
DROP POLICY IF EXISTS "Users can read own AI inbox items" ON public.ai_inbox_items;
DROP POLICY IF EXISTS "Users can manage own AI inbox items" ON public.ai_inbox_items;

-- Drop existing policies on ai_insights
DROP POLICY IF EXISTS "Users can read own AI insights" ON public.ai_insights;
DROP POLICY IF EXISTS "Users can manage own AI insights" ON public.ai_insights;

-- Drop existing policies on thoughts
DROP POLICY IF EXISTS "Users can read own thoughts" ON public.thoughts;
DROP POLICY IF EXISTS "Users can manage own thoughts" ON public.thoughts;

-- Drop existing policies on action_cards
DROP POLICY IF EXISTS "Users can read own action cards" ON public.action_cards;
DROP POLICY IF EXISTS "Users can manage own action cards" ON public.action_cards;

-- Drop existing policies on user_integrations
DROP POLICY IF EXISTS "Users can read own integrations" ON public.user_integrations;
DROP POLICY IF EXISTS "Users can manage own integrations" ON public.user_integrations;

-- Drop existing policies on integrations
DROP POLICY IF EXISTS "Integrations are viewable by authenticated users" ON public.integrations;

-- Drop existing policies on billing_plans
DROP POLICY IF EXISTS "Billing plans are viewable by authenticated users" ON public.billing_plans;

-- Drop existing policies on user_billing_plans
DROP POLICY IF EXISTS "Users can view own billing plans" ON public.user_billing_plans;

-- Drop existing policies on business_profiles
DROP POLICY IF EXISTS "Users can read own business profile" ON public.business_profiles;
DROP POLICY IF EXISTS "Users can manage own business profile" ON public.business_profiles;

-- ====================================================================
-- CREATE NEW POLICIES
-- ====================================================================

-- USER PROFILES POLICIES
CREATE POLICY "Users can read own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- COMPANIES POLICIES
CREATE POLICY "Users can read own company" ON public.companies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_profiles.company_id = companies.id 
            AND user_profiles.id = auth.uid()
        )
    );

-- AI INBOX ITEMS POLICIES
CREATE POLICY "Users can read own AI inbox items" ON public.ai_inbox_items
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own AI inbox items" ON public.ai_inbox_items
    FOR ALL USING (auth.uid() = user_id);

-- AI INSIGHTS POLICIES
CREATE POLICY "Users can read own AI insights" ON public.ai_insights
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own AI insights" ON public.ai_insights
    FOR ALL USING (auth.uid() = user_id);

-- THOUGHTS POLICIES
CREATE POLICY "Users can read own thoughts" ON public.thoughts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own thoughts" ON public.thoughts
    FOR ALL USING (auth.uid() = user_id);

-- ACTION CARDS POLICIES
CREATE POLICY "Users can read own action cards" ON public.action_cards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own action cards" ON public.action_cards
    FOR ALL USING (auth.uid() = user_id);

-- USER INTEGRATIONS POLICIES
CREATE POLICY "Users can read own integrations" ON public.user_integrations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own integrations" ON public.user_integrations
    FOR ALL USING (auth.uid() = user_id);

-- INTEGRATIONS POLICIES
CREATE POLICY "Integrations are viewable by authenticated users" ON public.integrations
    FOR SELECT USING (auth.role() = 'authenticated');

-- BILLING PLANS POLICIES
CREATE POLICY "Billing plans are viewable by authenticated users" ON public.billing_plans
    FOR SELECT USING (auth.role() = 'authenticated');

-- USER BILLING PLANS POLICIES
CREATE POLICY "Users can view own billing plans" ON public.user_billing_plans
    FOR SELECT USING (auth.uid() = user_id);

-- BUSINESS PROFILES POLICIES (if table exists)
-- BUSINESS PROFILES POLICIES (using correct column structure)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'business_profiles') THEN
        EXECUTE 'CREATE POLICY "Users can read own business profile" ON public.business_profiles FOR SELECT USING (auth.uid() = org_id)';
        EXECUTE 'CREATE POLICY "Users can manage own business profile" ON public.business_profiles FOR ALL USING (auth.uid() = org_id)';
    END IF;
END $$;

-- ====================================================================
-- SERVICE ROLE GRANTS (ESSENTIAL)
-- ====================================================================

-- Grant service role access to all essential tables
GRANT ALL PRIVILEGES ON TABLE public.user_profiles TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.companies TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.ai_inbox_items TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.ai_insights TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.thoughts TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.action_cards TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.user_integrations TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.integrations TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.billing_plans TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.user_billing_plans TO service_role;

-- Grant service role access to business_profiles if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'business_profiles') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.business_profiles TO service_role';
    END IF;
END $$;
