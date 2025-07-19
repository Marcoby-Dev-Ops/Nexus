-- Migration: Create missing tables that are causing 404 errors
-- This migration creates all the tables that the application expects to exist

-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

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

-- Create business_health table
CREATE TABLE IF NOT EXISTS public.business_health (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id UUID,
    overall_score INTEGER DEFAULT 0 NOT NULL,
    category_scores JSONB DEFAULT '{}',
    last_calculated TIMESTAMPTZ DEFAULT NOW(),
    data_sources TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    connected_sources INTEGER DEFAULT 0,
    verified_sources INTEGER DEFAULT 0,
    data_quality_score INTEGER DEFAULT 0,
    completion_percentage INTEGER DEFAULT 0,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ai_insights table
CREATE TABLE IF NOT EXISTS public.ai_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    insight_type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    confidence_score DECIMAL(3,2) DEFAULT 0,
    category TEXT,
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ai_action_card_templates table
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

-- Create service_health_logs table
CREATE TABLE IF NOT EXISTS public.service_health_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_name TEXT NOT NULL,
    status TEXT NOT NULL,
    latency_ms INTEGER,
    error_message TEXT,
    checked_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    company TEXT,
    role TEXT,
    preferences JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default billing plans
INSERT INTO public.billing_plans (id, name, description, price_monthly, price_yearly, features, token_limit, is_popular) VALUES
('free', 'Free', 'Basic features for individuals', 0, 0, '["Basic AI Assistant", "Limited Integrations", "5GB Storage"]', 10000, false),
('pro', 'Pro', 'Advanced features for professionals', 29.99, 299.99, '["Advanced AI Assistant", "All Integrations", "100GB Storage", "Priority Support"]', 100000, true),
('enterprise', 'Enterprise', 'Full features for teams', 99.99, 999.99, '["Custom AI Models", "Unlimited Integrations", "1TB Storage", "24/7 Support", "Custom Branding"]', 1000000, false)
ON CONFLICT (id) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_billing_plans_active ON public.billing_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_user_billing_plans_user_id ON public.user_billing_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_integration_status_user_id ON public.integration_status(user_id);
CREATE INDEX IF NOT EXISTS idx_business_health_user_id ON public.business_health(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id ON public.ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_action_card_templates_active ON public.ai_action_card_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_service_health_logs_service_name ON public.service_health_logs(service_name);
CREATE INDEX IF NOT EXISTS idx_service_health_logs_checked_at ON public.service_health_logs(checked_at);

-- Add triggers for updated_at columns
CREATE TRIGGER update_billing_plans_updated_at BEFORE UPDATE ON public.billing_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_billing_plans_updated_at BEFORE UPDATE ON public.user_billing_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_integration_status_updated_at BEFORE UPDATE ON public.integration_status FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_business_health_updated_at BEFORE UPDATE ON public.business_health FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_insights_updated_at BEFORE UPDATE ON public.ai_insights FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_action_card_templates_updated_at BEFORE UPDATE ON public.ai_action_card_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE public.billing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_billing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_action_card_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_health_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Billing plans - readable by all authenticated users
CREATE POLICY "Billing plans are viewable by authenticated users" ON public.billing_plans FOR SELECT USING (auth.role() = 'authenticated');

-- User billing plans - users can only see their own
CREATE POLICY "Users can view own billing plans" ON public.user_billing_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own billing plans" ON public.user_billing_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own billing plans" ON public.user_billing_plans FOR UPDATE USING (auth.uid() = user_id);

-- Integration status - users can only see their own
CREATE POLICY "Users can view own integration status" ON public.integration_status FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own integration status" ON public.integration_status FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own integration status" ON public.integration_status FOR UPDATE USING (auth.uid() = user_id);

-- Business health - users can only see their own
CREATE POLICY "Users can view own business health" ON public.business_health FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own business health" ON public.business_health FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own business health" ON public.business_health FOR UPDATE USING (auth.uid() = user_id);

-- AI insights - users can only see their own
CREATE POLICY "Users can view own ai insights" ON public.ai_insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ai insights" ON public.ai_insights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ai insights" ON public.ai_insights FOR UPDATE USING (auth.uid() = user_id);

-- AI action card templates - readable by all authenticated users
CREATE POLICY "AI action card templates are viewable by authenticated users" ON public.ai_action_card_templates FOR SELECT USING (auth.role() = 'authenticated');

-- Service health logs - readable by all authenticated users (for monitoring)
CREATE POLICY "Service health logs are viewable by authenticated users" ON public.service_health_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Service health logs can be inserted by authenticated users" ON public.service_health_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- User profiles - users can only see their own
CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id); 