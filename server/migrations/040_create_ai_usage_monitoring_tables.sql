-- Migration: Create AI Usage Monitoring Tables
-- Description: Tables for tracking AI API usage, costs, credits, alerts, and budgets

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- AI Provider Usage Table
CREATE TABLE IF NOT EXISTS ai_provider_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    org_id UUID,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('openai', 'openrouter', 'local')),
    model VARCHAR(100) NOT NULL,
    task_type VARCHAR(50) NOT NULL CHECK (task_type IN ('chat', 'embed', 'completion', 'image')),
    prompt_tokens INTEGER NOT NULL DEFAULT 0,
    completion_tokens INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    cost_cents INTEGER NOT NULL DEFAULT 0,
    cost_usd DECIMAL(10,6) NOT NULL DEFAULT 0,
    request_id VARCHAR(255),
    response_time_ms DECIMAL(10,3),
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Provider Credits Table
CREATE TABLE IF NOT EXISTS ai_provider_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL UNIQUE CHECK (provider IN ('openai', 'openrouter')),
    current_balance_usd DECIMAL(10,6) NOT NULL DEFAULT 0,
    total_spent_usd DECIMAL(10,6) NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    api_key_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (api_key_status IN ('active', 'expired', 'quota_exceeded')),
    quota_limit_usd DECIMAL(10,6),
    quota_reset_date DATE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Usage Alerts Table
CREATE TABLE IF NOT EXISTS ai_usage_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('low_balance', 'high_usage', 'quota_exceeded', 'error_rate')),
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('openai', 'openrouter')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    threshold_value DECIMAL(10,6),
    current_value DECIMAL(10,6),
    is_active BOOLEAN NOT NULL DEFAULT true,
    acknowledged_by UUID,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- AI Usage Budgets Table
CREATE TABLE IF NOT EXISTS ai_usage_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('openai', 'openrouter')),
    budget_type VARCHAR(20) NOT NULL CHECK (budget_type IN ('daily', 'weekly', 'monthly')),
    budget_amount_usd DECIMAL(10,6) NOT NULL,
    current_spend_usd DECIMAL(10,6) NOT NULL DEFAULT 0,
    reset_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(org_id, provider, budget_type)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_provider_usage_user_id ON ai_provider_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_provider_usage_org_id ON ai_provider_usage(org_id);
CREATE INDEX IF NOT EXISTS idx_ai_provider_usage_provider ON ai_provider_usage(provider);
CREATE INDEX IF NOT EXISTS idx_ai_provider_usage_created_at ON ai_provider_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_provider_usage_success ON ai_provider_usage(success);

CREATE INDEX IF NOT EXISTS idx_ai_usage_alerts_provider ON ai_usage_alerts(provider);
CREATE INDEX IF NOT EXISTS idx_ai_usage_alerts_is_active ON ai_usage_alerts(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_usage_alerts_created_at ON ai_usage_alerts(created_at);

CREATE INDEX IF NOT EXISTS idx_ai_usage_budgets_org_id ON ai_usage_budgets(org_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_budgets_provider ON ai_usage_budgets(provider);
CREATE INDEX IF NOT EXISTS idx_ai_usage_budgets_is_active ON ai_usage_budgets(is_active);

-- Add RLS policies if RLS is enabled
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'ai_provider_usage' AND schemaname = 'public') THEN
        -- Enable RLS on tables
        ALTER TABLE ai_provider_usage ENABLE ROW LEVEL SECURITY;
        ALTER TABLE ai_provider_credits ENABLE ROW LEVEL SECURITY;
        ALTER TABLE ai_usage_alerts ENABLE ROW LEVEL SECURITY;
        ALTER TABLE ai_usage_budgets ENABLE ROW LEVEL SECURITY;
        
        -- Create policies for ai_provider_usage
        DROP POLICY IF EXISTS "Users can view their own usage" ON ai_provider_usage;
        CREATE POLICY "Users can view their own usage" ON ai_provider_usage
            FOR SELECT USING (auth.uid()::text = user_id::text);
            
        DROP POLICY IF EXISTS "Users can insert their own usage" ON ai_provider_usage;
        CREATE POLICY "Users can insert their own usage" ON ai_provider_usage
            FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
            
        DROP POLICY IF EXISTS "Admins can view all usage" ON ai_provider_usage;
        CREATE POLICY "Admins can view all usage" ON ai_provider_usage
            FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
            
        -- Create policies for ai_provider_credits (admin only)
        DROP POLICY IF EXISTS "Admins can manage credits" ON ai_provider_credits;
        CREATE POLICY "Admins can manage credits" ON ai_provider_credits
            FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
            
        -- Create policies for ai_usage_alerts (admin only)
        DROP POLICY IF EXISTS "Admins can manage alerts" ON ai_usage_alerts;
        CREATE POLICY "Admins can manage alerts" ON ai_usage_alerts
            FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
            
        -- Create policies for ai_usage_budgets
        DROP POLICY IF EXISTS "Users can view their org budgets" ON ai_usage_budgets;
        CREATE POLICY "Users can view their org budgets" ON ai_usage_budgets
            FOR SELECT USING (
                org_id::text IN (
                    SELECT org_id::text FROM user_organizations 
                    WHERE user_id::text = auth.uid()::text
                )
            );
            
        DROP POLICY IF EXISTS "Admins can manage budgets" ON ai_usage_budgets;
        CREATE POLICY "Admins can manage budgets" ON ai_usage_budgets
            FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
    END IF;
END $$;

-- Insert initial provider credits records
INSERT INTO ai_provider_credits (provider, current_balance_usd, total_spent_usd, api_key_status)
VALUES 
    ('openai', 0, 0, 'active'),
    ('openrouter', 0, 0, 'active')
ON CONFLICT (provider) DO NOTHING;
