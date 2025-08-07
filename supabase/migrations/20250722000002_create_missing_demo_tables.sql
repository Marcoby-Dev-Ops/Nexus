-- Create Missing Demo Tables Migration
-- This migration creates tables that are referenced in the seed demo data migration

-- ====================================================================
-- COMPANY MEMBERS TABLE
-- ====================================================================

-- Company Members (for user-company relationships)
CREATE TABLE IF NOT EXISTS public.company_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'manager', 'member', 'viewer')),
    permissions TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, user_id)
);

-- Create indexes for company_members
CREATE INDEX IF NOT EXISTS idx_company_members_company_id ON public.company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_company_members_user_id ON public.company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_company_members_role ON public.company_members(role);

-- Enable RLS on company_members
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for company_members
CREATE POLICY "Users can view company members" ON public.company_members
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM public.company_members cm 
            WHERE cm.company_id = company_members.company_id 
            AND cm.user_id = auth.uid() 
            AND cm.role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Admins can manage company members" ON public.company_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.company_members cm 
            WHERE cm.company_id = company_members.company_id 
            AND cm.user_id = auth.uid() 
            AND cm.role = 'admin'
        )
    );

-- ====================================================================
-- BUSINESS METRICS TABLE
-- ====================================================================

-- Business Metrics (for tracking company KPIs)
CREATE TABLE IF NOT EXISTS public.business_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL,
    value DECIMAL(15,2) NOT NULL,
    period TEXT NOT NULL DEFAULT 'monthly' CHECK (period IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    target_value DECIMAL(15,2),
    unit TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for business_metrics
CREATE INDEX IF NOT EXISTS idx_business_metrics_company_id ON public.business_metrics(company_id);
CREATE INDEX IF NOT EXISTS idx_business_metrics_type ON public.business_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_business_metrics_period ON public.business_metrics(period);
CREATE INDEX IF NOT EXISTS idx_business_metrics_created_at ON public.business_metrics(created_at);

-- Enable RLS on business_metrics
ALTER TABLE public.business_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for business_metrics
CREATE POLICY "Users can view own company metrics" ON public.business_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.company_members cm 
            WHERE cm.company_id = business_metrics.company_id 
            AND cm.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage company metrics" ON public.business_metrics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.company_members cm 
            WHERE cm.company_id = business_metrics.company_id 
            AND cm.user_id = auth.uid() 
            AND cm.role = 'admin'
        )
    );

-- ====================================================================
-- ANALYTICS EVENTS TABLE (if not exists)
-- ====================================================================

-- Analytics Events (for tracking user behavior)
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    event_data JSONB DEFAULT '{}',
    session_id TEXT,
    source TEXT DEFAULT 'web',
    version TEXT DEFAULT '1.0',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for analytics_events
CREATE INDEX IF NOT EXISTS idx_analytics_events_company_id ON public.analytics_events(company_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON public.analytics_events(session_id);

-- Enable RLS on analytics_events
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for analytics_events
CREATE POLICY "Users can view own analytics events" ON public.analytics_events
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.company_members cm 
            WHERE cm.company_id = analytics_events.company_id 
            AND cm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own analytics events" ON public.analytics_events
    FOR INSERT WITH CHECK (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.company_members cm 
            WHERE cm.company_id = analytics_events.company_id 
            AND cm.user_id = auth.uid()
        )
    );

-- ====================================================================
-- UPDATE TRIGGERS
-- ====================================================================

-- Create triggers to update updated_at columns
CREATE TRIGGER update_company_members_updated_at
    BEFORE UPDATE ON public.company_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_metrics_updated_at
    BEFORE UPDATE ON public.business_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ====================================================================
-- GRANT PERMISSIONS
-- ====================================================================

-- Grant service role access to all tables
GRANT ALL PRIVILEGES ON TABLE public.company_members TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.business_metrics TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.analytics_events TO service_role; 