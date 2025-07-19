-- Migration: Create missing tables and ensure proper dependencies
-- This migration creates tables that may be missing and ensures proper foreign key relationships

-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Ensure companies table exists first (in case it was missed)
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT,
    industry TEXT,
    size TEXT CHECK (size IN ('startup', 'small', 'medium', 'large', 'enterprise')),
    logo_url TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create billing_plans table
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

-- Create user_billing_plans table
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

-- Create ai_model_usage table (if not exists from previous migration)
CREATE TABLE IF NOT EXISTS public.ai_model_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    model TEXT NOT NULL,
    provider TEXT NOT NULL,
    tokens_used INTEGER NOT NULL DEFAULT 0,
    cost DECIMAL(10,6) NOT NULL DEFAULT 0,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ai_cost_allocations table
CREATE TABLE IF NOT EXISTS public.ai_cost_allocations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    model TEXT NOT NULL,
    provider TEXT NOT NULL,
    tokens_used INTEGER NOT NULL DEFAULT 0,
    cost DECIMAL(10,6) NOT NULL DEFAULT 0,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create business_health table
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

-- Create ai_insights table
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

-- Create integration_status table
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

-- Create Recent table for navigation history
CREATE TABLE IF NOT EXISTS public."Recent" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    title TEXT,
    visited_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Create Pin table for pinned items
CREATE TABLE IF NOT EXISTS public."Pin" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    title TEXT NOT NULL,
    pinned_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    UNIQUE(user_id, path)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_billing_plans_user_id ON public.user_billing_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_billing_plans_active ON public.user_billing_plans(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_ai_model_usage_user_timestamp ON public.ai_model_usage(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ai_cost_allocations_user_timestamp ON public.ai_cost_allocations(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_business_health_company ON public.business_health(company_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_user ON public.ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_integration_status_user ON public.integration_status(user_id);
CREATE INDEX IF NOT EXISTS idx_recent_user_visited ON public."Recent"(user_id, visited_at DESC);
CREATE INDEX IF NOT EXISTS idx_pin_user ON public."Pin"(user_id);

-- Enable RLS on all tables
ALTER TABLE public.billing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_billing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_model_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_cost_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Recent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Pin" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Billing plans - public read
CREATE POLICY "Anyone can view billing plans" ON public.billing_plans FOR SELECT USING (true);

-- User billing plans - users can only see their own
CREATE POLICY "Users can view own billing plans" ON public.user_billing_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own billing plans" ON public.user_billing_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own billing plans" ON public.user_billing_plans FOR UPDATE USING (auth.uid() = user_id);

-- AI model usage - users can only see their own
CREATE POLICY "Users can view own ai model usage" ON public.ai_model_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ai model usage" ON public.ai_model_usage FOR INSERT WITH CHECK (auth.uid() = user_id);

-- AI cost allocations - users can only see their own
CREATE POLICY "Users can view own ai cost allocations" ON public.ai_cost_allocations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ai cost allocations" ON public.ai_cost_allocations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Business health - users can only see their own
CREATE POLICY "Users can view own business health" ON public.business_health FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own business health" ON public.business_health FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own business health" ON public.business_health FOR UPDATE USING (auth.uid() = user_id);

-- AI insights - users can only see their own
CREATE POLICY "Users can view own ai insights" ON public.ai_insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ai insights" ON public.ai_insights FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Integration status - users can only see their own
CREATE POLICY "Users can view own integration status" ON public.integration_status FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own integration status" ON public.integration_status FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own integration status" ON public.integration_status FOR UPDATE USING (auth.uid() = user_id);

-- Recent - users can only see their own
CREATE POLICY "Users can view own recent items" ON public."Recent" FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own recent items" ON public."Recent" FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recent items" ON public."Recent" FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own recent items" ON public."Recent" FOR DELETE USING (auth.uid() = user_id);

-- Pin - users can only see their own
CREATE POLICY "Users can view own pins" ON public."Pin" FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pins" ON public."Pin" FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pins" ON public."Pin" FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pins" ON public."Pin" FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at triggers
CREATE TRIGGER update_billing_plans_updated_at
    BEFORE UPDATE ON public.billing_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_billing_plans_updated_at
    BEFORE UPDATE ON public.user_billing_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_health_updated_at
    BEFORE UPDATE ON public.business_health
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_insights_updated_at
    BEFORE UPDATE ON public.ai_insights
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integration_status_updated_at
    BEFORE UPDATE ON public.integration_status
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 