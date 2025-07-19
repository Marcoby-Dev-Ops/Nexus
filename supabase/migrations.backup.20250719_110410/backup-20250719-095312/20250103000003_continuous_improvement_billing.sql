-- Continuous Improvement Tracking Tables
CREATE TABLE IF NOT EXISTS ai_user_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL,
    message_id UUID NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('accuracy', 'helpfulness', 'speed', 'relevance', 'overall')),
    comment TEXT,
    agent_id TEXT NOT NULL,
    model_used TEXT NOT NULL,
    provider TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_quality_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL,
    message_id UUID NOT NULL,
    assessment_type TEXT NOT NULL CHECK (assessment_type IN ('automated', 'human', 'hybrid')),
    relevance_score DECIMAL(3,2) NOT NULL CHECK (relevance_score >= 0 AND relevance_score <= 1),
    accuracy_score DECIMAL(3,2) NOT NULL CHECK (accuracy_score >= 0 AND accuracy_score <= 1),
    helpfulness_score DECIMAL(3,2) NOT NULL CHECK (helpfulness_score >= 0 AND helpfulness_score <= 1),
    completeness_score DECIMAL(3,2) NOT NULL CHECK (completeness_score >= 0 AND completeness_score <= 1),
    clarity_score DECIMAL(3,2) NOT NULL CHECK (clarity_score >= 0 AND clarity_score <= 1),
    overall_score DECIMAL(3,2) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 1),
    flags TEXT[] DEFAULT '{}',
    improvements TEXT[] DEFAULT '{}',
    model_used TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_improvement_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('model_optimization', 'workflow_improvement', 'user_experience', 'cost_reduction', 'performance_boost')),
    priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    expected_impact JSONB NOT NULL,
    implementation_steps TEXT[] NOT NULL,
    estimated_effort TEXT NOT NULL CHECK (estimated_effort IN ('low', 'medium', 'high')),
    potential_savings DECIMAL(10,2),
    risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
    confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    based_on_data TEXT[] NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'dismissed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_ab_test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id TEXT NOT NULL,
    variant TEXT NOT NULL CHECK (variant IN ('A', 'B')),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    metric_name TEXT NOT NULL,
    metric_value DECIMAL(10,4) NOT NULL,
    metadata JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Billing Model Accounting Tables
CREATE TABLE IF NOT EXISTS billing_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('free', 'pro', 'enterprise', 'custom')),
    monthly_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    included_tokens INTEGER NOT NULL DEFAULT 0,
    overage_rate_per_token DECIMAL(8,6) NOT NULL DEFAULT 0,
    features TEXT[] NOT NULL DEFAULT '{}',
    limits JSONB NOT NULL DEFAULT '{}',
    ai_model_access JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_billing_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID,
    plan_id TEXT NOT NULL REFERENCES billing_plans(id),
    is_active BOOLEAN NOT NULL DEFAULT true,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_cost_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID,
    department_id TEXT,
    agent_id TEXT NOT NULL,
    model TEXT NOT NULL,
    provider TEXT NOT NULL,
    tokens_used INTEGER NOT NULL,
    cost DECIMAL(10,6) NOT NULL,
    billing_category TEXT NOT NULL CHECK (billing_category IN ('operations', 'development', 'research', 'customer_support', 'sales', 'marketing')),
    cost_center TEXT,
    project_id TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_billing_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID,
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    plan_id TEXT NOT NULL REFERENCES billing_plans(id),
    base_amount DECIMAL(10,2) NOT NULL,
    token_usage_included INTEGER NOT NULL DEFAULT 0,
    token_usage_overage INTEGER NOT NULL DEFAULT 0,
    token_usage_total INTEGER NOT NULL DEFAULT 0,
    overage_charges DECIMAL(10,2) NOT NULL DEFAULT 0,
    additional_fees JSONB NOT NULL DEFAULT '[]',
    total_amount DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'finalized', 'paid', 'overdue')),
    payment_due DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance Metrics Tables
CREATE TABLE IF NOT EXISTS ai_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_type TEXT NOT NULL CHECK (metric_type IN ('model_performance', 'user_satisfaction', 'cost_efficiency', 'response_quality', 'latency', 'error_rate')),
    metric_value DECIMAL(10,4) NOT NULL,
    previous_value DECIMAL(10,4),
    trend TEXT NOT NULL CHECK (trend IN ('improving', 'stable', 'degrading')),
    change_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    agent_id TEXT,
    model TEXT,
    provider TEXT,
    timeframe TEXT NOT NULL CHECK (timeframe IN ('hour', 'day', 'week', 'month')),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_user_feedback_user_id ON ai_user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_user_feedback_agent_id ON ai_user_feedback(agent_id);
CREATE INDEX IF NOT EXISTS idx_ai_user_feedback_timestamp ON ai_user_feedback(timestamp);
CREATE INDEX IF NOT EXISTS idx_ai_user_feedback_rating ON ai_user_feedback(rating);

CREATE INDEX IF NOT EXISTS idx_ai_quality_assessments_overall_score ON ai_quality_assessments(overall_score);
CREATE INDEX IF NOT EXISTS idx_ai_quality_assessments_timestamp ON ai_quality_assessments(timestamp);
CREATE INDEX IF NOT EXISTS idx_ai_quality_assessments_agent_id ON ai_quality_assessments(agent_id);

CREATE INDEX IF NOT EXISTS idx_ai_improvement_recommendations_priority ON ai_improvement_recommendations(priority);
CREATE INDEX IF NOT EXISTS idx_ai_improvement_recommendations_status ON ai_improvement_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_ai_improvement_recommendations_type ON ai_improvement_recommendations(type);

CREATE INDEX IF NOT EXISTS idx_ai_ab_test_results_test_id ON ai_ab_test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_ai_ab_test_results_user_id ON ai_ab_test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_ab_test_results_timestamp ON ai_ab_test_results(timestamp);

CREATE INDEX IF NOT EXISTS idx_ai_cost_allocations_user_id ON ai_cost_allocations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_cost_allocations_timestamp ON ai_cost_allocations(timestamp);
CREATE INDEX IF NOT EXISTS idx_ai_cost_allocations_billing_category ON ai_cost_allocations(billing_category);
CREATE INDEX IF NOT EXISTS idx_ai_cost_allocations_agent_id ON ai_cost_allocations(agent_id);

CREATE INDEX IF NOT EXISTS idx_ai_billing_records_user_id ON ai_billing_records(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_billing_records_billing_period ON ai_billing_records(billing_period_start, billing_period_end);
CREATE INDEX IF NOT EXISTS idx_ai_billing_records_status ON ai_billing_records(status);

CREATE INDEX IF NOT EXISTS idx_ai_performance_metrics_metric_type ON ai_performance_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_ai_performance_metrics_timestamp ON ai_performance_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_ai_performance_metrics_agent_id ON ai_performance_metrics(agent_id);

-- Unique index for user_billing_plans to ensure only one active plan per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_billing_plans_active_unique ON user_billing_plans(user_id) WHERE is_active = true;

-- Row Level Security
ALTER TABLE ai_user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_quality_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_improvement_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_ab_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_billing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_cost_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_billing_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_performance_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own feedback" ON ai_user_feedback;
CREATE POLICY "Users can view their own feedback" ON ai_user_feedback
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own feedback" ON ai_user_feedback;
CREATE POLICY "Users can insert their own feedback" ON ai_user_feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own quality assessments" ON ai_quality_assessments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ai_user_feedback 
            WHERE ai_user_feedback.conversation_id = ai_quality_assessments.conversation_id 
            AND ai_user_feedback.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all improvement recommendations" ON ai_improvement_recommendations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Users can view their own A/B test results" ON ai_ab_test_results
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own A/B test results" ON ai_ab_test_results
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Everyone can view billing plans" ON billing_plans
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view their own billing plan" ON user_billing_plans
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own cost allocations" ON ai_cost_allocations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cost allocations" ON ai_cost_allocations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own billing records" ON ai_billing_records
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all performance metrics" ON ai_performance_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Functions for analytics and reporting
CREATE OR REPLACE FUNCTION get_performance_trends(
    metric_name TEXT,
    timeframe_type TEXT,
    agent_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
    "timestamp" TIMESTAMPTZ,
    value DECIMAL,
    count INTEGER,
    agent_id TEXT,
    model TEXT,
    provider TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pm.timestamp,
        pm.metric_value as value,
        1 as count,
        pm.agent_id,
        pm.model,
        pm.provider
    FROM ai_performance_metrics pm
    WHERE pm.metric_type = metric_name
    AND pm.timeframe = timeframe_type
    AND (agent_filter IS NULL OR pm.agent_id = agent_filter)
    ORDER BY pm.timestamp DESC
    LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_cost_allocation_breakdown(
    user_id_param UUID,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    group_by_param TEXT
)
RETURNS TABLE (
    category TEXT,
    total_cost DECIMAL,
    total_tokens INTEGER,
    request_count INTEGER,
    avg_cost_per_request DECIMAL,
    top_models JSONB,
    trend TEXT
) AS $$
BEGIN
    RETURN QUERY
    EXECUTE format('
        SELECT 
            CASE 
                WHEN %L = ''department'' THEN COALESCE(department_id, ''unassigned'')
                WHEN %L = ''agent'' THEN agent_id
                WHEN %L = ''model'' THEN model || '' ('' || provider || '')''
                WHEN %L = ''project'' THEN COALESCE(project_id, ''unassigned'')
                WHEN %L = ''cost_center'' THEN COALESCE(cost_center, ''unassigned'')
                ELSE ''other''
            END as category,
            SUM(cost)::DECIMAL as total_cost,
            SUM(tokens_used)::INTEGER as total_tokens,
            COUNT(*)::INTEGER as request_count,
            (SUM(cost) / COUNT(*))::DECIMAL as avg_cost_per_request,
            jsonb_agg(DISTINCT jsonb_build_object(''model'', model, ''provider'', provider)) as top_models,
            ''stable''::TEXT as trend
        FROM ai_cost_allocations
        WHERE user_id = %L
        AND timestamp >= %L
        AND timestamp <= %L
        GROUP BY category
        ORDER BY total_cost DESC
    ', group_by_param, group_by_param, group_by_param, group_by_param, group_by_param, user_id_param, start_date, end_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION generate_billing_analytics(
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    organization_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    total_revenue DECIMAL;
    total_costs DECIMAL;
    customer_count INTEGER;
    usage_stats JSONB;
    cost_breakdown JSONB;
BEGIN
    -- Calculate total revenue
    SELECT COALESCE(SUM(total_amount), 0) INTO total_revenue
    FROM ai_billing_records
    WHERE billing_period_start >= start_date::DATE
    AND billing_period_end <= end_date::DATE
    AND (organization_id IS NULL OR ai_billing_records.organization_id = organization_id);

    -- Calculate total costs
    SELECT COALESCE(SUM(cost), 0) INTO total_costs
    FROM ai_cost_allocations
    WHERE timestamp >= start_date
    AND timestamp <= end_date
    AND (organization_id IS NULL OR ai_cost_allocations.organization_id = organization_id);

    -- Get customer count
    SELECT COUNT(DISTINCT user_id) INTO customer_count
    FROM ai_cost_allocations
    WHERE timestamp >= start_date
    AND timestamp <= end_date
    AND (organization_id IS NULL OR ai_cost_allocations.organization_id = organization_id);

    -- Get usage statistics
    SELECT jsonb_build_object(
        'total_tokens', COALESCE(SUM(tokens_used), 0),
        'total_requests', COUNT(*),
        'avg_tokens_per_request', COALESCE(AVG(tokens_used), 0)
    ) INTO usage_stats
    FROM ai_cost_allocations
    WHERE timestamp >= start_date
    AND timestamp <= end_date
    AND (organization_id IS NULL OR ai_cost_allocations.organization_id = organization_id);

    -- Get cost breakdown
    SELECT jsonb_build_object(
        'openai_costs', COALESCE(SUM(CASE WHEN provider = 'openai' THEN cost ELSE 0 END), 0),
        'openrouter_costs', COALESCE(SUM(CASE WHEN provider = 'openrouter' THEN cost ELSE 0 END), 0),
        'infrastructure_costs', total_costs * 0.1,
        'operational_costs', total_costs * 0.05
    ) INTO cost_breakdown
    FROM ai_cost_allocations
    WHERE timestamp >= start_date
    AND timestamp <= end_date
    AND (organization_id IS NULL OR ai_cost_allocations.organization_id = organization_id);

    -- Build result
    result := jsonb_build_object(
        'total_revenue', total_revenue,
        'total_costs', total_costs,
        'gross_margin', (total_revenue - total_costs) / NULLIF(total_revenue, 0),
        'customer_metrics', jsonb_build_object(
            'total_customers', customer_count,
            'average_revenue_per_user', total_revenue / NULLIF(customer_count, 0)
        ),
        'usage_metrics', usage_stats,
        'cost_breakdown', cost_breakdown
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION analyze_ab_test(test_id_param TEXT)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    variant_a_stats JSONB;
    variant_b_stats JSONB;
    significance DECIMAL;
BEGIN
    -- Get variant A statistics
    SELECT jsonb_build_object(
        'count', COUNT(*),
        'mean', AVG(metric_value),
        'stddev', STDDEV(metric_value)
    ) INTO variant_a_stats
    FROM ai_ab_test_results
    WHERE test_id = test_id_param AND variant = 'A';

    -- Get variant B statistics
    SELECT jsonb_build_object(
        'count', COUNT(*),
        'mean', AVG(metric_value),
        'stddev', STDDEV(metric_value)
    ) INTO variant_b_stats
    FROM ai_ab_test_results
    WHERE test_id = test_id_param AND variant = 'B';

    -- Calculate statistical significance (simplified)
    significance := ABS((variant_a_stats->>'mean')::DECIMAL - (variant_b_stats->>'mean')::DECIMAL) / 
                   SQRT(POWER((variant_a_stats->>'stddev')::DECIMAL, 2) + POWER((variant_b_stats->>'stddev')::DECIMAL, 2));

    result := jsonb_build_object(
        'variants', jsonb_build_object('A', variant_a_stats, 'B', variant_b_stats),
        'significance', significance,
        'recommendation', CASE 
            WHEN significance > 1.96 THEN 'Significant difference detected'
            ELSE 'No significant difference'
        END,
        'confidence', CASE 
            WHEN significance > 1.96 THEN 0.95
            ELSE 0.50
        END
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default billing plans (using existing table structure)
INSERT INTO billing_plans (id, name, type, monthly_fee, included_tokens, overage_rate_per_token, features, limits, ai_model_access) VALUES
('free', 'Free Plan', 'free', 0, 10000, 0.000001, ARRAY['Basic AI chat', 'Limited models', 'Community support'], '{"max_conversations": 100, "max_storage": "1GB"}', '["gpt-3.5-turbo"]'),
('pro', 'Pro Plan', 'pro', 29.99, 100000, 0.000001, ARRAY['Advanced AI chat', 'All models', 'Priority support', 'Analytics dashboard'], '{"max_conversations": 1000, "max_storage": "10GB"}', '["gpt-4o", "gpt-4-turbo", "claude-3-5-sonnet"]'),
('enterprise', 'Enterprise Plan', 'enterprise', 99.99, 500000, 0.000001, ARRAY['Enterprise AI chat', 'All models', 'Dedicated support', 'Advanced analytics', 'Custom integrations'], '{"max_conversations": 10000, "max_storage": "100GB"}', '["gpt-4o", "gpt-4-turbo", "claude-3-5-sonnet", "claude-3-opus"]')
ON CONFLICT (id) DO NOTHING;

-- Triggers for automatic tracking
CREATE OR REPLACE FUNCTION update_billing_tracking()
RETURNS TRIGGER AS $$
BEGIN
    -- Update monthly tracking when new cost allocation is added
    INSERT INTO ai_budget_tracking (user_id, month_year, current_spend, request_count)
    VALUES (
        NEW.user_id,
        TO_CHAR(NEW.timestamp, 'YYYY-MM'),
        NEW.cost,
        1
    )
    ON CONFLICT (user_id, month_year) DO UPDATE SET
        current_spend = ai_budget_tracking.current_spend + NEW.cost,
        request_count = ai_budget_tracking.request_count + 1,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_billing_tracking
    AFTER INSERT ON ai_cost_allocations
    FOR EACH ROW
    EXECUTE FUNCTION update_billing_tracking();

-- Performance monitoring trigger
CREATE OR REPLACE FUNCTION track_performance_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Track user satisfaction metrics when feedback is added
    INSERT INTO ai_performance_metrics (
        metric_type,
        metric_value,
        agent_id,
        model,
        provider,
        timeframe,
        metadata
    ) VALUES (
        'user_satisfaction',
        NEW.rating / 5.0,
        NEW.agent_id,
        NEW.model_used,
        NEW.provider,
        'day',
        jsonb_build_object('feedback_type', NEW.feedback_type, 'comment', NEW.comment)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_track_performance_metrics
    AFTER INSERT ON ai_user_feedback
    FOR EACH ROW
    EXECUTE FUNCTION track_performance_metrics(); 