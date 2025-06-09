-- ====================================================================
-- INTEGRATIONS SYSTEM MIGRATION
-- Create comprehensive database schema for real integration data
-- ====================================================================

-- Create integrations table for available integrations
CREATE TABLE IF NOT EXISTS public.integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    auth_type TEXT NOT NULL CHECK (auth_type IN ('oauth', 'api_key', 'webhook', 'credentials')),
    description TEXT,
    icon_url TEXT,
    documentation_url TEXT,
    support_url TEXT,
    
    -- Configuration
    config_schema JSONB DEFAULT '{}',
    default_config JSONB DEFAULT '{}',
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    is_beta BOOLEAN DEFAULT false,
    is_enterprise BOOLEAN DEFAULT false,
    estimated_setup_time TEXT DEFAULT '10 min',
    difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'advanced')),
    
    -- Rate limiting
    rate_limit_requests_per_minute INTEGER DEFAULT 60,
    rate_limit_requests_per_hour INTEGER DEFAULT 1000,
    
    -- Features
    features JSONB DEFAULT '[]',
    prerequisites JSONB DEFAULT '[]',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_integrations table for user-specific integration instances
CREATE TABLE IF NOT EXISTS public.user_integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    integration_id UUID NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
    
    -- User-defined configuration
    name TEXT, -- User-defined name for this integration instance
    config JSONB DEFAULT '{}',
    credentials JSONB DEFAULT '{}', -- Encrypted credentials
    
    -- Status and sync
    status TEXT DEFAULT 'setup' CHECK (status IN ('setup', 'active', 'inactive', 'error', 'paused')),
    last_sync_at TIMESTAMPTZ,
    next_sync_at TIMESTAMPTZ,
    sync_frequency TEXT DEFAULT 'hourly' CHECK (sync_frequency IN ('realtime', 'hourly', 'daily', 'weekly', 'manual')),
    
    -- Error handling
    error_message TEXT,
    error_count INTEGER DEFAULT 0,
    last_error_at TIMESTAMPTZ,
    
    -- Analytics and monitoring
    total_syncs INTEGER DEFAULT 0,
    successful_syncs INTEGER DEFAULT 0,
    failed_syncs INTEGER DEFAULT 0,
    avg_sync_duration_ms INTEGER DEFAULT 0,
    
    -- Permissions
    permissions JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, integration_id, company_id)
);

-- Create integration_data table for storing actual synced data
CREATE TABLE IF NOT EXISTS public.integration_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_integration_id UUID NOT NULL REFERENCES public.user_integrations(id) ON DELETE CASCADE,
    
    -- Data identification
    data_type TEXT NOT NULL, -- e.g., 'users', 'sessions', 'deals', 'contacts'
    external_id TEXT, -- ID from the external system
    
    -- Raw data
    raw_data JSONB NOT NULL,
    processed_data JSONB DEFAULT '{}',
    
    -- Metadata
    sync_batch_id UUID,
    data_timestamp TIMESTAMPTZ, -- When the data was created in the external system
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Composite index for efficient querying
    UNIQUE(user_integration_id, data_type, external_id)
);

-- Create integration_sync_logs table for tracking sync operations
CREATE TABLE IF NOT EXISTS public.integration_sync_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_integration_id UUID NOT NULL REFERENCES public.user_integrations(id) ON DELETE CASCADE,
    
    -- Sync details
    sync_type TEXT NOT NULL CHECK (sync_type IN ('initial', 'incremental', 'full', 'manual')),
    status TEXT NOT NULL CHECK (status IN ('started', 'running', 'completed', 'failed', 'cancelled')),
    
    -- Progress tracking
    total_records INTEGER DEFAULT 0,
    processed_records INTEGER DEFAULT 0,
    failed_records INTEGER DEFAULT 0,
    
    -- Timing
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    
    -- Error details
    error_message TEXT,
    error_details JSONB,
    
    -- Metadata
    batch_id UUID DEFAULT gen_random_uuid(),
    triggered_by TEXT DEFAULT 'system' CHECK (triggered_by IN ('system', 'user', 'webhook', 'api')),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create integration_webhooks table for webhook endpoints
CREATE TABLE IF NOT EXISTS public.integration_webhooks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_integration_id UUID NOT NULL REFERENCES public.user_integrations(id) ON DELETE CASCADE,
    
    -- Webhook configuration
    webhook_url TEXT NOT NULL,
    secret_key TEXT,
    events JSONB DEFAULT '[]', -- Which events to listen for
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_triggered_at TIMESTAMPTZ,
    total_triggers INTEGER DEFAULT 0,
    successful_triggers INTEGER DEFAULT 0,
    failed_triggers INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- INDEXES FOR PERFORMANCE
-- ====================================================================

-- User integrations indexes
CREATE INDEX IF NOT EXISTS idx_user_integrations_user_id ON public.user_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_integrations_company_id ON public.user_integrations(company_id);
CREATE INDEX IF NOT EXISTS idx_user_integrations_integration_id ON public.user_integrations(integration_id);
CREATE INDEX IF NOT EXISTS idx_user_integrations_status ON public.user_integrations(status);
CREATE INDEX IF NOT EXISTS idx_user_integrations_next_sync ON public.user_integrations(next_sync_at) WHERE status = 'active';

-- Integration data indexes
CREATE INDEX IF NOT EXISTS idx_integration_data_user_integration_id ON public.integration_data(user_integration_id);
CREATE INDEX IF NOT EXISTS idx_integration_data_type ON public.integration_data(data_type);
CREATE INDEX IF NOT EXISTS idx_integration_data_timestamp ON public.integration_data(data_timestamp);
CREATE INDEX IF NOT EXISTS idx_integration_data_sync_batch ON public.integration_data(sync_batch_id);

-- Sync logs indexes
CREATE INDEX IF NOT EXISTS idx_sync_logs_user_integration_id ON public.integration_sync_logs(user_integration_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON public.integration_sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_sync_logs_started_at ON public.integration_sync_logs(started_at);

-- ====================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ====================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_integrations_updated_at
    BEFORE UPDATE ON public.integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_integrations_updated_at
    BEFORE UPDATE ON public.user_integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integration_data_updated_at
    BEFORE UPDATE ON public.integration_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integration_webhooks_updated_at
    BEFORE UPDATE ON public.integration_webhooks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ====================================================================
-- ROW LEVEL SECURITY POLICIES
-- ====================================================================

-- Enable RLS on all tables
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_webhooks ENABLE ROW LEVEL SECURITY;

-- Integrations table policies (read-only for users)
CREATE POLICY "Everyone can view active integrations" ON public.integrations
    FOR SELECT USING (is_active = true);

-- User integrations policies
CREATE POLICY "Users can view own integrations" ON public.user_integrations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own integrations" ON public.user_integrations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own integrations" ON public.user_integrations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own integrations" ON public.user_integrations
    FOR DELETE USING (auth.uid() = user_id);

-- Integration data policies
CREATE POLICY "Users can view own integration data" ON public.integration_data
    FOR SELECT USING (
        user_integration_id IN (
            SELECT id FROM public.user_integrations WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert integration data" ON public.integration_data
    FOR INSERT WITH CHECK (
        user_integration_id IN (
            SELECT id FROM public.user_integrations WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "System can update integration data" ON public.integration_data
    FOR UPDATE USING (
        user_integration_id IN (
            SELECT id FROM public.user_integrations WHERE user_id = auth.uid()
        )
    );

-- Sync logs policies
CREATE POLICY "Users can view own sync logs" ON public.integration_sync_logs
    FOR SELECT USING (
        user_integration_id IN (
            SELECT id FROM public.user_integrations WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert sync logs" ON public.integration_sync_logs
    FOR INSERT WITH CHECK (
        user_integration_id IN (
            SELECT id FROM public.user_integrations WHERE user_id = auth.uid()
        )
    );

-- Webhook policies
CREATE POLICY "Users can manage own webhooks" ON public.integration_webhooks
    FOR ALL USING (
        user_integration_id IN (
            SELECT id FROM public.user_integrations WHERE user_id = auth.uid()
        )
    );

-- ====================================================================
-- SEED DATA - AVAILABLE INTEGRATIONS
-- ====================================================================

INSERT INTO public.integrations (name, slug, category, auth_type, description, features, estimated_setup_time, difficulty) VALUES
-- CRM & Sales
('Salesforce', 'salesforce', 'crm', 'oauth', 'World''s #1 CRM platform for sales, service, and marketing automation', 
 '["Contact sync", "Deal tracking", "Sales analytics", "Pipeline data", "Lead scoring"]', '10-15 min', 'medium'),

('HubSpot', 'hubspot', 'crm', 'oauth', 'All-in-one CRM, marketing, sales, and service platform',
 '["Marketing automation", "Contact management", "Sales tracking", "Live chat", "Email sequences"]', '5-10 min', 'easy'),

-- Analytics
('Google Analytics', 'google-analytics', 'analytics', 'oauth', 'Web analytics service that tracks and reports website traffic',
 '["Traffic analytics", "Conversion tracking", "Audience insights", "Goal monitoring", "E-commerce tracking"]', '5 min', 'easy'),

-- Accounting
('QuickBooks Online', 'quickbooks', 'accounting', 'oauth', 'Leading small business accounting software',
 '["Revenue tracking", "Expense management", "Invoice sync", "Financial reports", "Tax preparation"]', '15-20 min', 'medium'),

-- Communication
('Slack', 'slack', 'communication', 'oauth', 'Business communication platform for team collaboration',
 '["Message analytics", "Channel insights", "User activity", "File sharing stats", "Integration usage"]', '5 min', 'easy'),

-- Marketing
('Mailchimp', 'mailchimp', 'marketing', 'oauth', 'All-in-one marketing platform for email campaigns',
 '["Campaign analytics", "Audience insights", "Email performance", "Automation stats", "Revenue tracking"]', '10 min', 'easy'),

-- Productivity
('Google Workspace', 'google-workspace', 'productivity', 'oauth', 'Cloud-based productivity and collaboration suite',
 '["Usage analytics", "Collaboration metrics", "Security insights", "License utilization"]', '15-20 min', 'medium'),

-- Development
('GitHub', 'github', 'development', 'oauth', 'Version control and collaboration platform for developers',
 '["Repository analytics", "Commit activity", "Pull request metrics", "Issue tracking"]', '10-15 min', 'medium')

ON CONFLICT (slug) DO NOTHING;

-- ====================================================================
-- USEFUL FUNCTIONS
-- ====================================================================

-- Function to get integration analytics for a user
CREATE OR REPLACE FUNCTION get_user_integration_analytics(user_uuid UUID)
RETURNS TABLE (
    total_integrations BIGINT,
    active_integrations BIGINT,
    total_data_points BIGINT,
    last_sync TIMESTAMPTZ,
    avg_sync_duration NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_integrations,
        COUNT(CASE WHEN status = 'active' THEN 1 END)::BIGINT as active_integrations,
        COALESCE(SUM(total_syncs), 0)::BIGINT as total_data_points,
        MAX(last_sync_at) as last_sync,
        ROUND(AVG(avg_sync_duration_ms), 2) as avg_sync_duration
    FROM public.user_integrations 
    WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get next scheduled syncs
CREATE OR REPLACE FUNCTION get_scheduled_syncs()
RETURNS TABLE (
    user_integration_id UUID,
    integration_name TEXT,
    next_sync_at TIMESTAMPTZ,
    sync_frequency TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ui.id,
        i.name,
        ui.next_sync_at,
        ui.sync_frequency
    FROM public.user_integrations ui
    JOIN public.integrations i ON i.id = ui.integration_id
    WHERE ui.status = 'active' 
    AND ui.next_sync_at <= NOW() + INTERVAL '1 hour'
    ORDER BY ui.next_sync_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create integrations system for real data connections
CREATE TABLE IF NOT EXISTS public.integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    auth_type TEXT NOT NULL CHECK (auth_type IN ('oauth', 'api_key', 'webhook', 'credentials')),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user integrations for actual connections
CREATE TABLE IF NOT EXISTS public.user_integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    integration_id UUID NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
    config JSONB DEFAULT '{}',
    credentials JSONB DEFAULT '{}',
    status TEXT DEFAULT 'setup' CHECK (status IN ('setup', 'active', 'inactive', 'error')),
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active integrations" ON public.integrations
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can manage own integrations" ON public.user_integrations
    FOR ALL USING (auth.uid() = user_id);

-- Seed basic integrations
INSERT INTO public.integrations (name, slug, category, auth_type, description) VALUES
('Google Analytics', 'google-analytics', 'analytics', 'oauth', 'Web analytics and traffic insights'),
('Salesforce', 'salesforce', 'crm', 'oauth', 'Customer relationship management'),
('QuickBooks', 'quickbooks', 'accounting', 'oauth', 'Financial and accounting data'),
('Slack', 'slack', 'communication', 'oauth', 'Team communication and collaboration')
ON CONFLICT (slug) DO NOTHING; 