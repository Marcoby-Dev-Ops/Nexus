-- ====================================================================
-- CONSOLIDATED TABLES MIGRATION
-- This migration consolidates all table definitions and adds missing tables
-- Replaces redundant migrations: 20250107000000, 20250118000001, 20250118000004, 20250119000000
-- ====================================================================

-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ====================================================================
-- CORE BUSINESS TABLES
-- ====================================================================

-- Companies table (consolidated from multiple migrations)
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT,
    industry TEXT,
    size TEXT CHECK (size IN ('startup', 'small', 'medium', 'large', 'enterprise')),
    logo_url TEXT,
    settings JSONB DEFAULT '{}',
    -- Additional fields from various migrations
    address JSONB DEFAULT '{}',
    website TEXT,
    description TEXT,
    client_base_description TEXT,
    hubspotId TEXT,
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
    fiscal_year_end TEXT,
    growth_stage TEXT,
    key_metrics JSONB,
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

-- ====================================================================
-- BILLING AND SUBSCRIPTION TABLES
-- ====================================================================

-- Billing plans table
CREATE TABLE IF NOT EXISTS public.billing_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('free', 'pro', 'enterprise', 'custom')),
    monthly_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    included_tokens INTEGER DEFAULT 0,
    overage_rate_per_token DECIMAL(10,6) NOT NULL DEFAULT 0,
    features TEXT[] DEFAULT '{}',
    limits JSONB DEFAULT '{}',
    ai_model_access JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User billing plans table
CREATE TABLE IF NOT EXISTS public.user_billing_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL REFERENCES public.billing_plans(id),
    is_active BOOLEAN DEFAULT true,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- AI AND ANALYTICS TABLES
-- ====================================================================

-- AI model usage tracking
CREATE TABLE IF NOT EXISTS public.ai_model_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    model TEXT NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('openai', 'openrouter')),
    tokens_used INTEGER NOT NULL DEFAULT 0,
    cost DECIMAL(10,6) NOT NULL DEFAULT 0,
    latency INTEGER NOT NULL DEFAULT 0,
    success BOOLEAN DEFAULT true,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    agent_id TEXT,
    query_type TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI cost allocations
CREATE TABLE IF NOT EXISTS public.ai_cost_allocations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    department_id TEXT,
    agent_id TEXT NOT NULL,
    model TEXT NOT NULL,
    provider TEXT NOT NULL,
    tokens_used INTEGER NOT NULL DEFAULT 0,
    cost DECIMAL(10,6) NOT NULL DEFAULT 0,
    billing_category TEXT NOT NULL CHECK (billing_category IN ('operations', 'development', 'research', 'customer_support', 'sales', 'marketing')),
    cost_center TEXT,
    project_id TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI billing records
CREATE TABLE IF NOT EXISTS public.ai_billing_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    plan_id TEXT NOT NULL REFERENCES public.billing_plans(id),
    base_amount DECIMAL(10,2) NOT NULL,
    token_usage_included INTEGER DEFAULT 0,
    token_usage_overage INTEGER DEFAULT 0,
    token_usage_total INTEGER DEFAULT 0,
    overage_charges DECIMAL(10,2) DEFAULT 0,
    additional_fees JSONB DEFAULT '[]',
    total_amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'finalized', 'paid', 'overdue')),
    payment_due DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI performance metrics
CREATE TABLE IF NOT EXISTS public.ai_performance_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_type TEXT NOT NULL CHECK (metric_type IN ('model_performance', 'user_satisfaction', 'cost_efficiency', 'response_quality', 'latency', 'error_rate')),
    metric_value DECIMAL(10,4) NOT NULL,
    previous_value DECIMAL(10,4),
    trend TEXT NOT NULL CHECK (trend IN ('improving', 'stable', 'degrading')),
    change_percent DECIMAL(5,2) DEFAULT 0,
    agent_id TEXT,
    model TEXT,
    provider TEXT,
    timeframe TEXT NOT NULL CHECK (timeframe IN ('hour', 'day', 'week', 'month')),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI budget tracking
CREATE TABLE IF NOT EXISTS public.ai_budget_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    month_year TEXT NOT NULL,
    budget_limit DECIMAL(10,2) DEFAULT 100.00,
    current_spend DECIMAL(10,2) DEFAULT 0.00,
    request_count INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI model performance
CREATE TABLE IF NOT EXISTS public.ai_model_performance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    model TEXT NOT NULL,
    provider TEXT NOT NULL,
    success_rate DECIMAL(5,4) DEFAULT 0.0000,
    average_latency DECIMAL(10,2) DEFAULT 0.00,
    average_cost DECIMAL(10,6) DEFAULT 0.000000,
    total_usage INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    last_used TIMESTAMPTZ,
    trend TEXT DEFAULT 'stable' CHECK (trend IN ('improving', 'stable', 'degrading')),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI optimization suggestions
CREATE TABLE IF NOT EXISTS public.ai_optimization_suggestions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('model_switch', 'usage_reduction', 'budget_increase', 'tier_optimization')),
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    potential_savings DECIMAL(10,2) DEFAULT 0.00,
    implementation_effort TEXT CHECK (implementation_effort IN ('low', 'medium', 'high')),
    is_active BOOLEAN DEFAULT true,
    applied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- BUSINESS INTELLIGENCE TABLES
-- ====================================================================

-- Business health tracking
CREATE TABLE IF NOT EXISTS public.business_health (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    health_score INTEGER CHECK (health_score BETWEEN 0 AND 100),
    metrics JSONB DEFAULT '{}',
    recommendations JSONB DEFAULT '[]',
    last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI insights
CREATE TABLE IF NOT EXISTS public.ai_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    insight_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    data JSONB DEFAULT '{}',
    confidence_score DECIMAL(3,2) CHECK (confidence_score BETWEEN 0 AND 1),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- INTEGRATION TABLES
-- ====================================================================

-- Integration status tracking
CREATE TABLE IF NOT EXISTS public.integration_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    integration_slug TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('connected', 'disconnected', 'error', 'pending')),
    last_sync_at TIMESTAMPTZ,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, integration_slug)
);

-- ====================================================================
-- USER INTERFACE TABLES
-- ====================================================================

-- Component usage analytics
CREATE TABLE IF NOT EXISTS public.component_usages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    component_name TEXT NOT NULL,
    location TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    usage_count INTEGER DEFAULT 1,
    performance_metrics JSONB DEFAULT '{}',
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recent navigation history
CREATE TABLE IF NOT EXISTS public."Recent" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    title TEXT,
    visited_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Pinned items
CREATE TABLE IF NOT EXISTS public."Pin" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    title TEXT NOT NULL,
    pinned_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    UNIQUE(user_id, path)
);

-- ====================================================================
-- SERVICE MONITORING TABLES
-- ====================================================================

-- Service health logs
CREATE TABLE IF NOT EXISTS public.service_health_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'down')),
    latency_ms INTEGER,
    error_message TEXT,
    checked_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- AI ACTION CARDS
-- ====================================================================

-- AI action card templates
CREATE TABLE IF NOT EXISTS public.ai_action_card_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    template_data JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    last_used TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- MISSING APPLICATION-SPECIFIC TABLES
-- ====================================================================

-- Debug logs table
CREATE TABLE IF NOT EXISTS public.debug_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    level TEXT NOT NULL DEFAULT 'info' CHECK (level IN ('debug', 'info', 'warn', 'error', 'fatal')),
    message TEXT NOT NULL,
    context JSONB DEFAULT '{}',
    source TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activities table
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goal assessments table
CREATE TABLE IF NOT EXISTS public.goal_assessments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    goal_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    target_value DECIMAL(10,2),
    current_value DECIMAL(10,2),
    unit TEXT,
    target_date DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    assessment_date TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Manual tasks table
CREATE TABLE IF NOT EXISTS public.manual_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    task_type TEXT NOT NULL,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    assigned_to UUID REFERENCES auth.users(id),
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contacts table
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    job_title TEXT,
    department TEXT,
    company_name TEXT,
    lead_source TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'prospect', 'customer', 'partner')),
    lead_score INTEGER DEFAULT 0,
    notes TEXT,
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deals table
CREATE TABLE IF NOT EXISTS public.deals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    deal_value DECIMAL(12,2),
    currency TEXT DEFAULT 'USD',
    stage TEXT DEFAULT 'prospecting' CHECK (stage IN ('prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost')),
    probability INTEGER DEFAULT 0 CHECK (probability BETWEEN 0 AND 100),
    expected_close_date DATE,
    closed_date DATE,
    lead_source TEXT,
    notes TEXT,
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat sessions table
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    session_name TEXT,
    session_type TEXT DEFAULT 'conversation' CHECK (session_type IN ('conversation', 'analysis', 'planning', 'support')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
    model_used TEXT,
    provider TEXT,
    total_tokens INTEGER DEFAULT 0,
    total_cost DECIMAL(10,6) DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    cost DECIMAL(10,6) DEFAULT 0,
    model_used TEXT,
    provider TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- INDEXES FOR PERFORMANCE
-- ====================================================================

-- Companies indexes
CREATE INDEX IF NOT EXISTS idx_companies_hubspotId ON public.companies(hubspotId);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON public.companies(industry);
CREATE INDEX IF NOT EXISTS idx_companies_size ON public.companies(size);
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON public.companies(created_at DESC);

-- Billing indexes
CREATE INDEX IF NOT EXISTS idx_user_billing_plans_user_id ON public.user_billing_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_billing_plans_active ON public.user_billing_plans(user_id, is_active);

-- AI usage indexes
CREATE INDEX IF NOT EXISTS idx_ai_model_usage_user_timestamp ON public.ai_model_usage(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ai_cost_allocations_user_timestamp ON public.ai_cost_allocations(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ai_budget_tracking_user_month ON public.ai_budget_tracking(user_id, month_year);

-- Business intelligence indexes
CREATE INDEX IF NOT EXISTS idx_business_health_company ON public.business_health(company_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_user ON public.ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_integration_status_user ON public.integration_status(user_id);

-- UI indexes
CREATE INDEX IF NOT EXISTS idx_component_usages_user_id ON public.component_usages(user_id);
CREATE INDEX IF NOT EXISTS idx_component_usages_company_id ON public.component_usages(company_id);
CREATE INDEX IF NOT EXISTS idx_component_usages_timestamp ON public.component_usages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_recent_user_visited ON public."Recent"(user_id, visited_at DESC);
CREATE INDEX IF NOT EXISTS idx_pin_user ON public."Pin"(user_id);

-- Application-specific indexes
CREATE INDEX IF NOT EXISTS idx_debug_logs_user_timestamp ON public.debug_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_debug_logs_level ON public.debug_logs(level);
CREATE INDEX IF NOT EXISTS idx_activities_user_status ON public.activities(user_id, status);
CREATE INDEX IF NOT EXISTS idx_activities_due_date ON public.activities(due_date);
CREATE INDEX IF NOT EXISTS idx_goal_assessments_user_type ON public.goal_assessments(user_id, goal_type);
CREATE INDEX IF NOT EXISTS idx_manual_tasks_user_status ON public.manual_tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_manual_tasks_assigned_to ON public.manual_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_contacts_user_company ON public.contacts(user_id, company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON public.contacts(email);
CREATE INDEX IF NOT EXISTS idx_deals_user_stage ON public.deals(user_id, stage);
CREATE INDEX IF NOT EXISTS idx_deals_contact_id ON public.deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_status ON public.chat_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_created ON public.chat_messages(session_id, created_at);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS)
-- ====================================================================

-- Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_billing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_model_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_cost_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_billing_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_budget_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_model_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_optimization_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.component_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Recent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Pin" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_health_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_action_card_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debug_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- RLS POLICIES
-- ====================================================================

-- Companies policies
CREATE POLICY "Users can view own companies" ON public.companies FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert companies" ON public.companies FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own companies" ON public.companies FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Billing policies
CREATE POLICY "Anyone can view billing plans" ON public.billing_plans FOR SELECT USING (true);
CREATE POLICY "Users can view own billing plans" ON public.user_billing_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own billing plans" ON public.user_billing_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own billing plans" ON public.user_billing_plans FOR UPDATE USING (auth.uid() = user_id);

-- AI usage policies
CREATE POLICY "Users can view own ai model usage" ON public.ai_model_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ai model usage" ON public.ai_model_usage FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own ai cost allocations" ON public.ai_cost_allocations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ai cost allocations" ON public.ai_cost_allocations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own ai billing records" ON public.ai_billing_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ai billing records" ON public.ai_billing_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own ai budget tracking" ON public.ai_budget_tracking FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own ai budget tracking" ON public.ai_budget_tracking FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own ai optimization suggestions" ON public.ai_optimization_suggestions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own ai optimization suggestions" ON public.ai_optimization_suggestions FOR ALL USING (auth.uid() = user_id);

-- Business intelligence policies
CREATE POLICY "Users can view own business health" ON public.business_health FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own business health" ON public.business_health FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own business health" ON public.business_health FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own ai insights" ON public.ai_insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ai insights" ON public.ai_insights FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Integration policies
CREATE POLICY "Users can view own integration status" ON public.integration_status FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own integration status" ON public.integration_status FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own integration status" ON public.integration_status FOR UPDATE USING (auth.uid() = user_id);

-- UI policies
CREATE POLICY "Users can view own component usages" ON public.component_usages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own component usages" ON public.component_usages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own recent items" ON public."Recent" FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own recent items" ON public."Recent" FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recent items" ON public."Recent" FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own recent items" ON public."Recent" FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own pins" ON public."Pin" FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pins" ON public."Pin" FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pins" ON public."Pin" FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pins" ON public."Pin" FOR DELETE USING (auth.uid() = user_id);

-- Service monitoring policies
CREATE POLICY "Admins can view service health logs" ON public.service_health_logs FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role IN ('admin', 'owner')
    )
);

-- AI action card templates policies
CREATE POLICY "Everyone can view active action card templates" ON public.ai_action_card_templates FOR SELECT USING (is_active = true);

-- Application-specific policies
CREATE POLICY "Users can view own debug logs" ON public.debug_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own debug logs" ON public.debug_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own activities" ON public.activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own activities" ON public.activities FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own goal assessments" ON public.goal_assessments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own goal assessments" ON public.goal_assessments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own manual tasks" ON public.manual_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own manual tasks" ON public.manual_tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own contacts" ON public.contacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own contacts" ON public.contacts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own deals" ON public.deals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own deals" ON public.deals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own chat sessions" ON public.chat_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own chat sessions" ON public.chat_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own chat messages" ON public.chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own chat messages" ON public.chat_messages FOR ALL USING (auth.uid() = user_id);

-- ====================================================================
-- TRIGGERS FOR UPDATED_AT
-- ====================================================================

-- Create triggers for all tables with updated_at columns
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_billing_plans_updated_at BEFORE UPDATE ON public.billing_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_billing_plans_updated_at BEFORE UPDATE ON public.user_billing_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_billing_records_updated_at BEFORE UPDATE ON public.ai_billing_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_model_performance_updated_at BEFORE UPDATE ON public.ai_model_performance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_action_card_templates_updated_at BEFORE UPDATE ON public.ai_action_card_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_business_health_updated_at BEFORE UPDATE ON public.business_health FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_insights_updated_at BEFORE UPDATE ON public.ai_insights FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_integration_status_updated_at BEFORE UPDATE ON public.integration_status FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_component_usages_updated_at BEFORE UPDATE ON public.component_usages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON public.activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_goal_assessments_updated_at BEFORE UPDATE ON public.goal_assessments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_manual_tasks_updated_at BEFORE UPDATE ON public.manual_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON public.chat_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================================================
-- GRANT PERMISSIONS
-- ====================================================================

-- Grant permissions to authenticated users
GRANT ALL ON public.companies TO authenticated;
GRANT ALL ON public.billing_plans TO authenticated;
GRANT ALL ON public.user_billing_plans TO authenticated;
GRANT ALL ON public.ai_model_usage TO authenticated;
GRANT ALL ON public.ai_cost_allocations TO authenticated;
GRANT ALL ON public.ai_billing_records TO authenticated;
GRANT ALL ON public.ai_performance_metrics TO authenticated;
GRANT ALL ON public.ai_budget_tracking TO authenticated;
GRANT ALL ON public.ai_model_performance TO authenticated;
GRANT ALL ON public.ai_optimization_suggestions TO authenticated;
GRANT ALL ON public.business_health TO authenticated;
GRANT ALL ON public.ai_insights TO authenticated;
GRANT ALL ON public.integration_status TO authenticated;
GRANT ALL ON public.component_usages TO authenticated;
GRANT ALL ON public."Recent" TO authenticated;
GRANT ALL ON public."Pin" TO authenticated;
GRANT ALL ON public.service_health_logs TO authenticated;
GRANT ALL ON public.ai_action_card_templates TO authenticated;
GRANT ALL ON public.debug_logs TO authenticated;
GRANT ALL ON public.activities TO authenticated;
GRANT ALL ON public.goal_assessments TO authenticated;
GRANT ALL ON public.manual_tasks TO authenticated;
GRANT ALL ON public.contacts TO authenticated;
GRANT ALL ON public.deals TO authenticated;
GRANT ALL ON public.chat_sessions TO authenticated;
GRANT ALL ON public.chat_messages TO authenticated;

-- ====================================================================
-- INSERT DEFAULT DATA
-- ====================================================================

-- Insert default action card templates
INSERT INTO public.ai_action_card_templates (slug, title, description, category, template_data) VALUES
('follow-up-email', 'Follow-up Email', 'Send a follow-up email to a prospect', 'communication', '{"type": "email", "subject": "Following up", "body": "Hi {{name}}, I wanted to follow up on our conversation..."}'),
('schedule-meeting', 'Schedule Meeting', 'Schedule a meeting with a client', 'scheduling', '{"type": "calendar", "duration": 30, "title": "Meeting with {{name}}"}'),
('create-task', 'Create Task', 'Create a new task or to-do item', 'productivity', '{"type": "task", "title": "{{title}}", "description": "{{description}}"}'),
('send-proposal', 'Send Proposal', 'Send a business proposal', 'sales', '{"type": "document", "template": "proposal", "recipient": "{{email}}"}'),
('update-crm', 'Update CRM', 'Update customer information in CRM', 'data', '{"type": "crm_update", "fields": ["status", "notes", "next_action"]}')
ON CONFLICT (slug) DO NOTHING;

-- ====================================================================
-- COMMENTS FOR DOCUMENTATION
-- ====================================================================

COMMENT ON TABLE public.companies IS 'Company profiles and business information';
COMMENT ON TABLE public.billing_plans IS 'Available billing plans and pricing';
COMMENT ON TABLE public.user_billing_plans IS 'User subscriptions to billing plans';
COMMENT ON TABLE public.ai_model_usage IS 'Tracks AI model usage and costs';
COMMENT ON TABLE public.ai_cost_allocations IS 'Cost allocation for AI usage across departments';
COMMENT ON TABLE public.ai_billing_records IS 'Monthly billing records for AI usage';
COMMENT ON TABLE public.ai_performance_metrics IS 'Performance metrics for AI models and services';
COMMENT ON TABLE public.ai_budget_tracking IS 'Budget tracking for AI costs';
COMMENT ON TABLE public.ai_model_performance IS 'Performance statistics for AI models';
COMMENT ON TABLE public.ai_optimization_suggestions IS 'AI-generated optimization suggestions';
COMMENT ON TABLE public.business_health IS 'Business health scores and metrics';
COMMENT ON TABLE public.ai_insights IS 'AI-generated business insights';
COMMENT ON TABLE public.integration_status IS 'Status of third-party integrations';
COMMENT ON TABLE public.component_usages IS 'Tracks usage analytics for UI components';
COMMENT ON TABLE public."Recent" IS 'User navigation history';
COMMENT ON TABLE public."Pin" IS 'User pinned items';
COMMENT ON TABLE public.service_health_logs IS 'Service health monitoring logs';
COMMENT ON TABLE public.ai_action_card_templates IS 'Templates for AI action cards';
COMMENT ON TABLE public.debug_logs IS 'Application debug logs';
COMMENT ON TABLE public.activities IS 'User activities and tasks';
COMMENT ON TABLE public.goal_assessments IS 'Goal tracking and assessments';
COMMENT ON TABLE public.manual_tasks IS 'Manual task management';
COMMENT ON TABLE public.contacts IS 'Contact management';
COMMENT ON TABLE public.deals IS 'Deal and opportunity management';
COMMENT ON TABLE public.chat_sessions IS 'AI chat sessions';
COMMENT ON TABLE public.chat_messages IS 'Individual chat messages'; 