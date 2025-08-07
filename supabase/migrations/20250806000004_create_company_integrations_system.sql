-- Migration: Create Company Integrations System
-- This migration creates a comprehensive company integrations table that serves as the single source of truth
-- for all integrations connected to a company, managed by multiple people

-- ====================================================================
-- STEP 1: CREATE COMPANY INTEGRATIONS TABLE
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.company_integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    
    -- Integration Identity
    integration_name TEXT NOT NULL,
    integration_category TEXT NOT NULL,
    integration_slug TEXT NOT NULL,
    integration_description TEXT,
    integration_icon_url TEXT,
    
    -- Connection Details
    connection_status TEXT DEFAULT 'disconnected' CHECK (connection_status IN ('connected', 'disconnected', 'error', 'pending', 'maintenance')),
    connection_method TEXT CHECK (connection_method IN ('oauth', 'api_key', 'webhook', 'manual', 'sso')),
    connection_owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    connection_created_by UUID NOT NULL REFERENCES auth.users(id),
    connection_created_at TIMESTAMPTZ DEFAULT NOW(),
    connection_updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Authentication & Configuration
    auth_credentials JSONB DEFAULT '{}',
    config_settings JSONB DEFAULT '{}',
    webhook_endpoints JSONB DEFAULT '[]',
    api_permissions JSONB DEFAULT '[]',
    
    -- Data & Sync Information
    data_sync_status TEXT DEFAULT 'idle' CHECK (data_sync_status IN ('idle', 'syncing', 'error', 'completed')),
    last_sync_at TIMESTAMPTZ,
    next_sync_at TIMESTAMPTZ,
    sync_frequency TEXT DEFAULT 'daily',
    sync_scope JSONB DEFAULT '{}',
    
    -- Data Coverage & Quality
    data_coverage_percentage INTEGER DEFAULT 0,
    data_quality_score INTEGER DEFAULT 0,
    data_freshness_hours INTEGER,
    error_count INTEGER DEFAULT 0,
    last_error_at TIMESTAMPTZ,
    last_error_message TEXT,
    
    -- Business Impact
    business_impact_score INTEGER DEFAULT 0,
    usage_frequency TEXT DEFAULT 'low' CHECK (usage_frequency IN ('low', 'medium', 'high', 'critical')),
    user_adoption_percentage INTEGER DEFAULT 0,
    department_usage JSONB DEFAULT '{}',
    
    -- Integration Health
    health_status TEXT DEFAULT 'healthy' CHECK (health_status IN ('healthy', 'warning', 'critical', 'maintenance')),
    performance_metrics JSONB DEFAULT '{}',
    reliability_score INTEGER DEFAULT 0,
    uptime_percentage DECIMAL(5,2) DEFAULT 100.00,
    
    -- Security & Compliance
    security_status TEXT DEFAULT 'secure' CHECK (security_status IN ('secure', 'warning', 'critical', 'review_needed')),
    compliance_status JSONB DEFAULT '{}',
    data_retention_policy TEXT,
    encryption_status TEXT DEFAULT 'encrypted',
    
    -- Cost & Licensing
    cost_per_month DECIMAL(10,2),
    license_type TEXT,
    license_expiry_date DATE,
    auto_renewal BOOLEAN DEFAULT true,
    
    -- Management & Governance
    admin_contacts JSONB DEFAULT '[]',
    support_contacts JSONB DEFAULT '[]',
    documentation_url TEXT,
    vendor_contact_info JSONB DEFAULT '{}',
    
    -- Integration Intelligence
    ai_insights JSONB DEFAULT '[]',
    optimization_recommendations JSONB DEFAULT '[]',
    risk_assessment JSONB DEFAULT '{}',
    performance_trends JSONB DEFAULT '{}',
    
    -- Metadata
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    internal_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(company_id, integration_slug)
);

-- ====================================================================
-- STEP 2: CREATE COMPANY INTEGRATION USERS TABLE
-- ====================================================================

-- Track which users have access to which integrations
CREATE TABLE IF NOT EXISTS public.company_integration_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_integration_id UUID NOT NULL REFERENCES public.company_integrations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Access Control
    access_level TEXT NOT NULL DEFAULT 'user' CHECK (access_level IN ('admin', 'manager', 'user', 'viewer')),
    permissions JSONB DEFAULT '{}',
    
    -- Usage Tracking
    last_accessed_at TIMESTAMPTZ,
    usage_frequency TEXT DEFAULT 'low' CHECK (usage_frequency IN ('low', 'medium', 'high')),
    favorite BOOLEAN DEFAULT false,
    
    -- Metadata
    added_by UUID REFERENCES auth.users(id),
    added_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(company_integration_id, user_id)
);

-- ====================================================================
-- STEP 3: CREATE COMPANY INTEGRATION LOGS TABLE
-- ====================================================================

-- Track all activities and changes related to company integrations
CREATE TABLE IF NOT EXISTS public.company_integration_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_integration_id UUID NOT NULL REFERENCES public.company_integrations(id) ON DELETE CASCADE,
    
    -- Log Details
    log_type TEXT NOT NULL CHECK (log_type IN ('connection', 'sync', 'error', 'config_change', 'access_change', 'health_check', 'maintenance')),
    log_level TEXT NOT NULL DEFAULT 'info' CHECK (log_level IN ('debug', 'info', 'warning', 'error', 'critical')),
    message TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    
    -- Actor Information
    actor_id UUID REFERENCES auth.users(id),
    actor_type TEXT CHECK (actor_type IN ('user', 'system', 'integration', 'webhook')),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- ====================================================================
-- STEP 4: CREATE COMPANY INTEGRATION METRICS TABLE
-- ====================================================================

-- Store historical metrics and performance data
CREATE TABLE IF NOT EXISTS public.company_integration_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_integration_id UUID NOT NULL REFERENCES public.company_integrations(id) ON DELETE CASCADE,
    
    -- Metric Details
    metric_name TEXT NOT NULL,
    metric_value DECIMAL(10,4),
    metric_unit TEXT,
    metric_category TEXT NOT NULL CHECK (metric_category IN ('performance', 'usage', 'quality', 'business', 'security')),
    
    -- Time Tracking
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    time_period TEXT DEFAULT 'instant' CHECK (time_period IN ('instant', 'hourly', 'daily', 'weekly', 'monthly')),
    
    -- Context
    context JSONB DEFAULT '{}',
    
    -- Constraints
    UNIQUE(company_integration_id, metric_name, recorded_at)
);

-- ====================================================================
-- STEP 5: CREATE INDEXES FOR PERFORMANCE
-- ====================================================================

-- Company integrations indexes
CREATE INDEX IF NOT EXISTS idx_company_integrations_company_id ON public.company_integrations(company_id);
CREATE INDEX IF NOT EXISTS idx_company_integrations_status ON public.company_integrations(connection_status);
CREATE INDEX IF NOT EXISTS idx_company_integrations_category ON public.company_integrations(integration_category);
CREATE INDEX IF NOT EXISTS idx_company_integrations_health ON public.company_integrations(health_status);
CREATE INDEX IF NOT EXISTS idx_company_integrations_last_sync ON public.company_integrations(last_sync_at DESC);
CREATE INDEX IF NOT EXISTS idx_company_integrations_owner ON public.company_integrations(connection_owner_id);

-- Company integration users indexes
CREATE INDEX IF NOT EXISTS idx_company_integration_users_integration_id ON public.company_integration_users(company_integration_id);
CREATE INDEX IF NOT EXISTS idx_company_integration_users_user_id ON public.company_integration_users(user_id);
CREATE INDEX IF NOT EXISTS idx_company_integration_users_access_level ON public.company_integration_users(access_level);

-- Company integration logs indexes
CREATE INDEX IF NOT EXISTS idx_company_integration_logs_integration_id ON public.company_integration_logs(company_integration_id);
CREATE INDEX IF NOT EXISTS idx_company_integration_logs_type ON public.company_integration_logs(log_type);
CREATE INDEX IF NOT EXISTS idx_company_integration_logs_level ON public.company_integration_logs(log_level);
CREATE INDEX IF NOT EXISTS idx_company_integration_logs_created_at ON public.company_integration_logs(created_at DESC);

-- Company integration metrics indexes
CREATE INDEX IF NOT EXISTS idx_company_integration_metrics_integration_id ON public.company_integration_metrics(company_integration_id);
CREATE INDEX IF NOT EXISTS idx_company_integration_metrics_name ON public.company_integration_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_company_integration_metrics_category ON public.company_integration_metrics(metric_category);
CREATE INDEX IF NOT EXISTS idx_company_integration_metrics_recorded_at ON public.company_integration_metrics(recorded_at DESC);

-- ====================================================================
-- STEP 6: CREATE TRIGGERS FOR AUTOMATION
-- ====================================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_company_integration_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_company_integration_updated_at
    BEFORE UPDATE ON public.company_integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_company_integration_updated_at();

-- Trigger to log integration changes
CREATE OR REPLACE FUNCTION log_company_integration_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the change
    INSERT INTO public.company_integration_logs (
        company_integration_id,
        log_type,
        log_level,
        message,
        details,
        actor_id,
        actor_type
    ) VALUES (
        NEW.id,
        'config_change',
        'info',
        'Integration configuration updated',
        jsonb_build_object(
            'old_status', OLD.connection_status,
            'new_status', NEW.connection_status,
            'old_health', OLD.health_status,
            'new_health', NEW.health_status
        ),
        NEW.connection_updated_by,
        'user'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_company_integration_changes
    AFTER UPDATE ON public.company_integrations
    FOR EACH ROW
    EXECUTE FUNCTION log_company_integration_changes();

-- ====================================================================
-- STEP 7: CREATE FUNCTIONS FOR INTELLIGENCE
-- ====================================================================

-- Function to calculate integration health score
CREATE OR REPLACE FUNCTION calculate_integration_health_score(integration_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    health_score INTEGER := 0;
    integration_record RECORD;
BEGIN
    SELECT * INTO integration_record FROM public.company_integrations WHERE id = integration_uuid;
    
    -- Base score from connection status
    CASE integration_record.connection_status
        WHEN 'connected' THEN health_score := health_score + 30;
        WHEN 'pending' THEN health_score := health_score + 15;
        WHEN 'error' THEN health_score := health_score + 5;
        ELSE health_score := health_score + 0;
    END CASE;
    
    -- Add score from data quality
    health_score := health_score + COALESCE(integration_record.data_quality_score, 0);
    
    -- Add score from reliability
    health_score := health_score + COALESCE(integration_record.reliability_score, 0);
    
    -- Deduct points for errors
    health_score := health_score - (COALESCE(integration_record.error_count, 0) * 2);
    
    -- Ensure score is between 0 and 100
    RETURN GREATEST(0, LEAST(100, health_score));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get company integration summary
CREATE OR REPLACE FUNCTION get_company_integration_summary(company_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    summary JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_integrations', COUNT(*),
        'connected_integrations', COUNT(*) FILTER (WHERE connection_status = 'connected'),
        'error_integrations', COUNT(*) FILTER (WHERE connection_status = 'error'),
        'pending_integrations', COUNT(*) FILTER (WHERE connection_status = 'pending'),
        'average_health_score', AVG(calculate_integration_health_score(id)),
        'total_users', (
            SELECT COUNT(DISTINCT user_id) 
            FROM public.company_integration_users ciu
            JOIN public.company_integrations ci ON ciu.company_integration_id = ci.id
            WHERE ci.company_id = company_uuid
        ),
        'categories', (
            SELECT jsonb_object_agg(integration_category, count)
            FROM (
                SELECT integration_category, COUNT(*) as count
                FROM public.company_integrations
                WHERE company_id = company_uuid
                GROUP BY integration_category
            ) categories
        )
    ) INTO summary
    FROM public.company_integrations
    WHERE company_id = company_uuid;
    
    RETURN summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- STEP 8: CREATE RLS POLICIES
-- ====================================================================

-- Enable RLS on all tables
ALTER TABLE public.company_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_integration_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_integration_metrics ENABLE ROW LEVEL SECURITY;

-- Company integrations policies
CREATE POLICY "Company members can view company integrations" ON public.company_integrations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid() AND up.company_id = company_integrations.company_id
        )
    );

CREATE POLICY "Company admins can manage company integrations" ON public.company_integrations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid() 
            AND up.company_id = company_integrations.company_id
            AND up.role IN ('owner', 'admin')
        )
    );

-- Company integration users policies
CREATE POLICY "Users can view their own integration access" ON public.company_integration_users
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Company admins can manage integration users" ON public.company_integration_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.company_integrations ci
            JOIN public.user_profiles up ON up.company_id = ci.company_id
            WHERE ci.id = company_integration_users.company_integration_id
            AND up.id = auth.uid()
            AND up.role IN ('owner', 'admin')
        )
    );

-- Company integration logs policies
CREATE POLICY "Company members can view integration logs" ON public.company_integration_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.company_integrations ci
            JOIN public.user_profiles up ON up.company_id = ci.company_id
            WHERE ci.id = company_integration_logs.company_integration_id
            AND up.id = auth.uid()
        )
    );

-- Company integration metrics policies
CREATE POLICY "Company members can view integration metrics" ON public.company_integration_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.company_integrations ci
            JOIN public.user_profiles up ON up.company_id = ci.company_id
            WHERE ci.id = company_integration_metrics.company_integration_id
            AND up.id = auth.uid()
        )
    );

-- ====================================================================
-- STEP 9: ADD COMMENTS FOR DOCUMENTATION
-- ====================================================================

COMMENT ON TABLE public.company_integrations IS 'Comprehensive company integrations table serving as single source of truth for all company integrations';
COMMENT ON COLUMN public.company_integrations.connection_status IS 'Current connection status of the integration';
COMMENT ON COLUMN public.company_integrations.connection_method IS 'Method used to connect to the integration';
COMMENT ON COLUMN public.company_integrations.connection_owner_id IS 'Primary owner/administrator of this integration';
COMMENT ON COLUMN public.company_integrations.auth_credentials IS 'Encrypted authentication credentials for the integration';
COMMENT ON COLUMN public.company_integrations.config_settings IS 'Configuration settings and parameters for the integration';
COMMENT ON COLUMN public.company_integrations.data_sync_status IS 'Current status of data synchronization';
COMMENT ON COLUMN public.company_integrations.data_coverage_percentage IS 'Percentage of available data that is being synced';
COMMENT ON COLUMN public.company_integrations.data_quality_score IS 'Quality score of the data from this integration (0-100)';
COMMENT ON COLUMN public.company_integrations.business_impact_score IS 'Impact score of this integration on business operations (0-100)';
COMMENT ON COLUMN public.company_integrations.health_status IS 'Overall health status of the integration';
COMMENT ON COLUMN public.company_integrations.reliability_score IS 'Reliability score based on uptime and error rates (0-100)';
COMMENT ON COLUMN public.company_integrations.security_status IS 'Security status of the integration';
COMMENT ON COLUMN public.company_integrations.cost_per_month IS 'Monthly cost of this integration';
COMMENT ON COLUMN public.company_integrations.ai_insights IS 'AI-generated insights about this integration';
COMMENT ON COLUMN public.company_integrations.optimization_recommendations IS 'Recommendations for optimizing this integration';

COMMENT ON TABLE public.company_integration_users IS 'Track which users have access to which company integrations';
COMMENT ON COLUMN public.company_integration_users.access_level IS 'Access level for the user (admin, manager, user, viewer)';
COMMENT ON COLUMN public.company_integration_users.permissions IS 'Detailed permissions for the user';

COMMENT ON TABLE public.company_integration_logs IS 'Audit log of all activities and changes related to company integrations';
COMMENT ON COLUMN public.company_integration_logs.log_type IS 'Type of log entry (connection, sync, error, config_change, etc.)';
COMMENT ON COLUMN public.company_integration_logs.log_level IS 'Log level (debug, info, warning, error, critical)';

COMMENT ON TABLE public.company_integration_metrics IS 'Historical metrics and performance data for company integrations';
COMMENT ON COLUMN public.company_integration_metrics.metric_name IS 'Name of the metric being tracked';
COMMENT ON COLUMN public.company_integration_metrics.metric_category IS 'Category of the metric (performance, usage, quality, business, security)'; 