-- Migration: Fix Schema Drift
-- This migration ensures all tables exist with proper structure and relationships

-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ====================================================================
-- CORE TABLES (ensure they exist with proper structure)
-- ====================================================================

-- Companies table (ensure it exists with all fields)
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT,
    industry TEXT,
    size TEXT CHECK (size IN ('startup', 'small', 'medium', 'large', 'enterprise')),
    logo_url TEXT,
    settings JSONB DEFAULT '{}',
    address JSONB DEFAULT '{}',
    website TEXT,
    description TEXT,
    client_base_description TEXT,
    hubspotid TEXT,
    business_phone TEXT,
    duns_number TEXT,
    employee_count INTEGER,
    founded TEXT,
    headquarters TEXT,
    social_profiles TEXT[],
    specialties TEXT[],
    followers_count INTEGER,
    microsoft_365 JSONB,
    business_licenses JSONB,
    inventory_management_system TEXT,
    fiscal_year_end TEXT DEFAULT '12-31',
    growth_stage TEXT DEFAULT 'growth',
    key_metrics JSONB DEFAULT '{}',
    mrr DECIMAL(10,2),
    burn_rate DECIMAL(10,2),
    cac DECIMAL(10,2),
    gross_margin DECIMAL(5,2),
    csat DECIMAL(5,2),
    avg_deal_cycle_days INTEGER,
    avg_first_response_mins INTEGER,
    on_time_delivery_pct DECIMAL(5,2),
    website_visitors_month INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles table (ensure it exists with all fields)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    full_name TEXT,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('owner', 'admin', 'manager', 'user')),
    department TEXT,
    job_title TEXT,
    phone TEXT,
    timezone TEXT DEFAULT 'UTC',
    preferences JSONB DEFAULT '{"theme": "system", "notifications": true, "language": "en"}',
    settings JSONB DEFAULT '{}',
    onboarding_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Integrations table
CREATE TABLE IF NOT EXISTS public.integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    icon_url TEXT,
    config_schema JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User integrations table
CREATE TABLE IF NOT EXISTS public.user_integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    integration_id UUID REFERENCES public.integrations(id) ON DELETE CASCADE,
    integration_name TEXT NOT NULL,
    status TEXT DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected', 'error', 'pending')),
    config JSONB DEFAULT '{}',
    last_sync_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- EMAIL INTELLIGENCE TABLES
-- ====================================================================

-- AI Inbox Items table
CREATE TABLE IF NOT EXISTS public.ai_inbox_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    
    -- Email-specific fields
    subject TEXT,
    sender_email TEXT,
    sender_name TEXT,
    recipient_email TEXT,
    content TEXT,
    html_content TEXT,
    message_id TEXT,
    thread_id TEXT,
    in_reply_to TEXT,
    email_references TEXT[],
    
    -- AI analysis fields
    ai_priority_score INTEGER DEFAULT 50 CHECK (ai_priority_score >= 0 AND ai_priority_score <= 100),
    ai_category TEXT,
    ai_sentiment TEXT CHECK (ai_sentiment IN ('positive', 'neutral', 'negative')),
    ai_summary TEXT,
    ai_action_items TEXT[],
    ai_processed_at TIMESTAMPTZ,
    ai_action_suggestion TEXT,
    
    -- Status and priority
    status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived', 'deleted')),
    is_important BOOLEAN DEFAULT false,
    is_flagged BOOLEAN DEFAULT false,
    snooze_until TIMESTAMPTZ,
    priority_score INTEGER DEFAULT 5 CHECK (priority_score >= 1 AND priority_score <= 10),
    
    -- Integration and source tracking
    integration_id UUID REFERENCES public.user_integrations(id) ON DELETE SET NULL,
    source_type TEXT DEFAULT 'email' CHECK (source_type IN ('email', 'notification', 'system', 'task', 'calendar')),
    external_id TEXT,
    
    -- Timestamps
    received_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    item_timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Display fields
    is_read BOOLEAN DEFAULT false,
    title TEXT,
    preview TEXT,
    sender TEXT,
    item_type TEXT DEFAULT 'email',
    
    -- Demo and archival
    is_demo BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false
);

-- ====================================================================
-- AI AND ANALYTICS TABLES
-- ====================================================================

-- AI Insights table
CREATE TABLE IF NOT EXISTS public.ai_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    insight_type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    confidence_score DECIMAL(3,2) DEFAULT 0,
    urgency TEXT CHECK (urgency IN ('low', 'medium', 'high', 'urgent')),
    category TEXT,
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Thoughts table
CREATE TABLE IF NOT EXISTS public.thoughts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('idea', 'task', 'reminder', 'update')),
    status TEXT NOT NULL CHECK (status IN (
        'future_goals', 'concept', 'in_progress', 'completed',
        'pending', 'reviewed', 'implemented',
        'not_started', 'upcoming', 'due', 'overdue'
    )),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Action cards table
CREATE TABLE IF NOT EXISTS public.action_cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    kind TEXT,
    domain TEXT,
    status TEXT DEFAULT 'pending',
    meta JSONB DEFAULT '{}',
    data JSONB DEFAULT '{}',
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- BILLING AND PLANS
-- ====================================================================

-- Billing plans table
CREATE TABLE IF NOT EXISTS public.billing_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
    price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0,
    features JSONB DEFAULT '[]',
    token_limit INTEGER DEFAULT 10000,
    is_active BOOLEAN DEFAULT true,
    is_popular BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User billing plans table
CREATE TABLE IF NOT EXISTS public.user_billing_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL REFERENCES public.billing_plans(id),
    is_active BOOLEAN DEFAULT true,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, plan_id, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- ====================================================================
-- INDEXES FOR PERFORMANCE
-- ====================================================================

-- Companies indexes
CREATE INDEX IF NOT EXISTS idx_companies_name ON public.companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_domain ON public.companies(domain);

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_company_id ON public.user_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);

-- Integrations indexes
CREATE INDEX IF NOT EXISTS idx_integrations_slug ON public.integrations(slug);
CREATE INDEX IF NOT EXISTS idx_integrations_category ON public.integrations(category);

-- User integrations indexes
CREATE INDEX IF NOT EXISTS idx_user_integrations_user_id ON public.user_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_integrations_integration_name ON public.user_integrations(integration_name);

-- AI Inbox Items indexes
CREATE INDEX IF NOT EXISTS idx_ai_inbox_items_user_id ON public.ai_inbox_items(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_inbox_items_timestamp ON public.ai_inbox_items(item_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ai_inbox_items_source_type ON public.ai_inbox_items(source_type);
CREATE INDEX IF NOT EXISTS idx_ai_inbox_items_is_read ON public.ai_inbox_items(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_ai_inbox_items_ai_priority ON public.ai_inbox_items(ai_priority_score DESC) WHERE ai_priority_score IS NOT NULL;

-- AI Insights indexes
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id ON public.ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_insight_type ON public.ai_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_ai_insights_category ON public.ai_insights(category);

-- Thoughts indexes
CREATE INDEX IF NOT EXISTS idx_thoughts_user_id ON public.thoughts(user_id);
CREATE INDEX IF NOT EXISTS idx_thoughts_category ON public.thoughts(category);
CREATE INDEX IF NOT EXISTS idx_thoughts_status ON public.thoughts(status);

-- Action cards indexes
CREATE INDEX IF NOT EXISTS idx_action_cards_user_id ON public.action_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_action_cards_company_id ON public.action_cards(company_id);
CREATE INDEX IF NOT EXISTS idx_action_cards_status ON public.action_cards(status);

-- ====================================================================
-- TRIGGERS FOR UPDATED_AT
-- ====================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_companies_updated_at'
    ) THEN
        CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_user_profiles_updated_at'
    ) THEN
        CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_user_integrations_updated_at'
    ) THEN
        CREATE TRIGGER update_user_integrations_updated_at BEFORE UPDATE ON public.user_integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_ai_inbox_items_updated_at'
    ) THEN
        CREATE TRIGGER update_ai_inbox_items_updated_at BEFORE UPDATE ON public.ai_inbox_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_ai_insights_updated_at'
    ) THEN
        CREATE TRIGGER update_ai_insights_updated_at BEFORE UPDATE ON public.ai_insights FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_thoughts_updated_at'
    ) THEN
        CREATE TRIGGER update_thoughts_updated_at BEFORE UPDATE ON public.thoughts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_action_cards_updated_at'
    ) THEN
        CREATE TRIGGER update_action_cards_updated_at BEFORE UPDATE ON public.action_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_billing_plans_updated_at'
    ) THEN
        CREATE TRIGGER update_billing_plans_updated_at BEFORE UPDATE ON public.billing_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_user_billing_plans_updated_at'
    ) THEN
        CREATE TRIGGER update_user_billing_plans_updated_at BEFORE UPDATE ON public.user_billing_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ====================================================================
-- ENABLE RLS ON ALL TABLES
-- ====================================================================

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_inbox_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thoughts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_billing_plans ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- RLS POLICIES
-- ====================================================================

-- Companies - users can view companies they're associated with
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'companies' 
        AND policyname = 'Users can view associated companies'
    ) THEN
        CREATE POLICY "Users can view associated companies" ON public.companies FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.user_profiles 
                WHERE user_profiles.company_id = companies.id 
                AND user_profiles.id = auth.uid()
            )
        );
    END IF;
END $$;

-- User profiles - users can only see their own
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' 
        AND policyname = 'Users can view own profile'
    ) THEN
        CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' 
        AND policyname = 'Users can insert own profile'
    ) THEN
        CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' 
        AND policyname = 'Users can update own profile'
    ) THEN
        CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);
    END IF;
END $$;

-- Integrations - readable by all authenticated users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'integrations' 
        AND policyname = 'Integrations are viewable by authenticated users'
    ) THEN
        CREATE POLICY "Integrations are viewable by authenticated users" ON public.integrations FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- User integrations - users can only see their own
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_integrations' 
        AND policyname = 'Users can view own integrations'
    ) THEN
        CREATE POLICY "Users can view own integrations" ON public.user_integrations FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_integrations' 
        AND policyname = 'Users can insert own integrations'
    ) THEN
        CREATE POLICY "Users can insert own integrations" ON public.user_integrations FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_integrations' 
        AND policyname = 'Users can update own integrations'
    ) THEN
        CREATE POLICY "Users can update own integrations" ON public.user_integrations FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_integrations' 
        AND policyname = 'Users can delete own integrations'
    ) THEN
        CREATE POLICY "Users can delete own integrations" ON public.user_integrations FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- AI Inbox Items - users can only see their own
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_inbox_items' 
        AND policyname = 'Users can view own inbox items'
    ) THEN
        CREATE POLICY "Users can view own inbox items" ON public.ai_inbox_items FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_inbox_items' 
        AND policyname = 'Users can insert own inbox items'
    ) THEN
        CREATE POLICY "Users can insert own inbox items" ON public.ai_inbox_items FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_inbox_items' 
        AND policyname = 'Users can update own inbox items'
    ) THEN
        CREATE POLICY "Users can update own inbox items" ON public.ai_inbox_items FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_inbox_items' 
        AND policyname = 'Users can delete own inbox items'
    ) THEN
        CREATE POLICY "Users can delete own inbox items" ON public.ai_inbox_items FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- AI Insights - users can only see their own
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_insights' 
        AND policyname = 'Users can view own ai insights'
    ) THEN
        CREATE POLICY "Users can view own ai insights" ON public.ai_insights FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_insights' 
        AND policyname = 'Users can insert own ai insights'
    ) THEN
        CREATE POLICY "Users can insert own ai insights" ON public.ai_insights FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_insights' 
        AND policyname = 'Users can update own ai insights'
    ) THEN
        CREATE POLICY "Users can update own ai insights" ON public.ai_insights FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Thoughts - users can only see their own
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'thoughts' 
        AND policyname = 'Users can view own thoughts'
    ) THEN
        CREATE POLICY "Users can view own thoughts" ON public.thoughts FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'thoughts' 
        AND policyname = 'Users can insert own thoughts'
    ) THEN
        CREATE POLICY "Users can insert own thoughts" ON public.thoughts FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'thoughts' 
        AND policyname = 'Users can update own thoughts'
    ) THEN
        CREATE POLICY "Users can update own thoughts" ON public.thoughts FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'thoughts' 
        AND policyname = 'Users can delete own thoughts'
    ) THEN
        CREATE POLICY "Users can delete own thoughts" ON public.thoughts FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Action cards - users can only see their own
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'action_cards' 
        AND policyname = 'Users can view own action cards'
    ) THEN
        CREATE POLICY "Users can view own action cards" ON public.action_cards FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'action_cards' 
        AND policyname = 'Users can insert own action cards'
    ) THEN
        CREATE POLICY "Users can insert own action cards" ON public.action_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'action_cards' 
        AND policyname = 'Users can update own action cards'
    ) THEN
        CREATE POLICY "Users can update own action cards" ON public.action_cards FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'action_cards' 
        AND policyname = 'Users can delete own action cards'
    ) THEN
        CREATE POLICY "Users can delete own action cards" ON public.action_cards FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Billing plans - readable by all authenticated users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'billing_plans' 
        AND policyname = 'Billing plans are viewable by authenticated users'
    ) THEN
        CREATE POLICY "Billing plans are viewable by authenticated users" ON public.billing_plans FOR SELECT USING (auth.role() = 'authenticated');
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
        CREATE POLICY "Users can view own billing plans" ON public.user_billing_plans FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_billing_plans' 
        AND policyname = 'Users can insert own billing plans'
    ) THEN
        CREATE POLICY "Users can insert own billing plans" ON public.user_billing_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_billing_plans' 
        AND policyname = 'Users can update own billing plans'
    ) THEN
        CREATE POLICY "Users can update own billing plans" ON public.user_billing_plans FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- ====================================================================
-- INSERT DEFAULT DATA
-- ====================================================================

-- Insert default billing plans
INSERT INTO public.billing_plans (id, name, description, price_monthly, price_yearly, features, token_limit, is_popular) VALUES
('free', 'Free', 'Basic features for individuals', 0, 0, '["Basic AI Assistant", "Limited Integrations", "5GB Storage"]', 10000, false),
('pro', 'Pro', 'Advanced features for professionals', 29.99, 299.99, '["Advanced AI Assistant", "All Integrations", "100GB Storage", "Priority Support"]', 100000, true),
('enterprise', 'Enterprise', 'Full features for teams', 99.99, 999.99, '["Custom AI Models", "Unlimited Integrations", "1TB Storage", "24/7 Support", "Custom Branding"]', 1000000, false)
ON CONFLICT (id) DO NOTHING; 