-- AI Model Usage Tracking Tables
-- This migration adds support for tracking AI model performance, costs, and optimization

-- Table for tracking individual AI model usage
CREATE TABLE IF NOT EXISTS ai_model_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'openrouter')),
  tokens_used INTEGER NOT NULL DEFAULT 0,
  cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
  latency INTEGER NOT NULL DEFAULT 0, -- milliseconds
  success BOOLEAN NOT NULL DEFAULT true,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id TEXT,
  query_type TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table for tracking monthly AI budgets and spending
CREATE TABLE IF NOT EXISTS ai_budget_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID,
  month_year TEXT NOT NULL, -- Format: YYYY-MM
  budget_limit DECIMAL(10, 2) NOT NULL DEFAULT 100.00,
  current_spend DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  request_count INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, month_year)
);

-- Table for storing model performance metrics
CREATE TABLE IF NOT EXISTS ai_model_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model TEXT NOT NULL,
  provider TEXT NOT NULL,
  success_rate DECIMAL(5, 4) NOT NULL DEFAULT 0.0000,
  average_latency DECIMAL(8, 2) NOT NULL DEFAULT 0.00,
  average_cost DECIMAL(10, 6) NOT NULL DEFAULT 0.000000,
  total_usage INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  last_used TIMESTAMPTZ,
  trend TEXT CHECK (trend IN ('improving', 'stable', 'degrading')) DEFAULT 'stable',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(model, provider)
);

-- Table for storing cost optimization suggestions
CREATE TABLE IF NOT EXISTS ai_optimization_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('model_switch', 'usage_reduction', 'budget_increase', 'tier_optimization')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  potential_savings DECIMAL(10, 2) DEFAULT 0.00,
  implementation_effort TEXT CHECK (implementation_effort IN ('low', 'medium', 'high')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_model_usage_user_timestamp ON ai_model_usage(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ai_model_usage_model_provider ON ai_model_usage(model, provider);
CREATE INDEX IF NOT EXISTS idx_ai_model_usage_timestamp ON ai_model_usage(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ai_budget_tracking_user_month ON ai_budget_tracking(user_id, month_year);
CREATE INDEX IF NOT EXISTS idx_ai_model_performance_model ON ai_model_performance(model, provider);
CREATE INDEX IF NOT EXISTS idx_ai_optimization_suggestions_user ON ai_optimization_suggestions(user_id, is_active);

-- Function to update budget tracking automatically
CREATE OR REPLACE FUNCTION update_ai_budget_tracking()
RETURNS TRIGGER AS $$
DECLARE
  month_key TEXT;
BEGIN
  -- Get the month key (YYYY-MM format)
  month_key := TO_CHAR(NEW.timestamp, 'YYYY-MM');
  
  -- Update or insert budget tracking record
  INSERT INTO ai_budget_tracking (user_id, month_year, current_spend, request_count)
  VALUES (NEW.user_id, month_key, NEW.cost, 1)
  ON CONFLICT (user_id, month_year)
  DO UPDATE SET
    current_spend = ai_budget_tracking.current_spend + NEW.cost,
    request_count = ai_budget_tracking.request_count + 1,
    last_updated = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update model performance metrics
CREATE OR REPLACE FUNCTION update_ai_model_performance()
RETURNS TRIGGER AS $$
DECLARE
  current_performance RECORD;
  new_success_rate DECIMAL(5, 4);
  new_avg_latency DECIMAL(8, 2);
  new_avg_cost DECIMAL(10, 6);
  new_total_usage INTEGER;
  new_error_count INTEGER;
BEGIN
  -- Get current performance metrics
  SELECT * INTO current_performance
  FROM ai_model_performance
  WHERE model = NEW.model AND provider = NEW.provider;
  
  IF current_performance IS NULL THEN
    -- First time tracking this model
    INSERT INTO ai_model_performance (
      model, provider, success_rate, average_latency, average_cost,
      total_usage, error_count, last_used
    ) VALUES (
      NEW.model, NEW.provider,
      CASE WHEN NEW.success THEN 1.0000 ELSE 0.0000 END,
      NEW.latency,
      NEW.cost,
      1,
      CASE WHEN NEW.success THEN 0 ELSE 1 END,
      NEW.timestamp
    );
  ELSE
    -- Update existing metrics
    new_total_usage := current_performance.total_usage + 1;
    new_error_count := current_performance.error_count + CASE WHEN NEW.success THEN 0 ELSE 1 END;
    
    -- Calculate new averages
    new_success_rate := (current_performance.total_usage - current_performance.error_count + 
                        CASE WHEN NEW.success THEN 1 ELSE 0 END)::DECIMAL / new_total_usage;
    new_avg_latency := (current_performance.average_latency * current_performance.total_usage + NEW.latency) / new_total_usage;
    new_avg_cost := (current_performance.average_cost * current_performance.total_usage + NEW.cost) / new_total_usage;
    
    UPDATE ai_model_performance SET
      success_rate = new_success_rate,
      average_latency = new_avg_latency,
      average_cost = new_avg_cost,
      total_usage = new_total_usage,
      error_count = new_error_count,
      last_used = NEW.timestamp,
      updated_at = NOW()
    WHERE model = NEW.model AND provider = NEW.provider;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update tracking
DROP TRIGGER IF EXISTS ai_model_usage_budget_trigger ON ai_model_usage;
CREATE TRIGGER ai_model_usage_budget_trigger
  AFTER INSERT ON ai_model_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_budget_tracking();

DROP TRIGGER IF EXISTS ai_model_usage_performance_trigger ON ai_model_usage;
CREATE TRIGGER ai_model_usage_performance_trigger
  AFTER INSERT ON ai_model_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_model_performance();

-- Function to get budget status for a user
CREATE OR REPLACE FUNCTION get_ai_budget_status(user_uuid UUID, target_month TEXT DEFAULT NULL)
RETURNS TABLE(
  budget_limit DECIMAL(10, 2),
  current_spend DECIMAL(10, 2),
  remaining_budget DECIMAL(10, 2),
  utilization_percent DECIMAL(5, 2),
  request_count INTEGER,
  is_over_budget BOOLEAN
) AS $$
DECLARE
  month_key TEXT;
BEGIN
  -- Use current month if not specified
  month_key := COALESCE(target_month, TO_CHAR(NOW(), 'YYYY-MM'));
  
  RETURN QUERY
  SELECT 
    bt.budget_limit,
    bt.current_spend,
    (bt.budget_limit - bt.current_spend) as remaining_budget,
    ROUND((bt.current_spend / bt.budget_limit * 100)::DECIMAL, 2) as utilization_percent,
    bt.request_count,
    (bt.current_spend > bt.budget_limit) as is_over_budget
  FROM ai_budget_tracking bt
  WHERE bt.user_id = user_uuid AND bt.month_year = month_key
  UNION ALL
  SELECT 
    100.00::DECIMAL(10, 2) as budget_limit,
    0.00::DECIMAL(10, 2) as current_spend,
    100.00::DECIMAL(10, 2) as remaining_budget,
    0.00::DECIMAL(5, 2) as utilization_percent,
    0 as request_count,
    false as is_over_budget
  WHERE NOT EXISTS (
    SELECT 1 FROM ai_budget_tracking 
    WHERE user_id = user_uuid AND month_year = month_key
  )
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get model performance analytics
CREATE OR REPLACE FUNCTION get_ai_model_analytics(
  user_uuid UUID DEFAULT NULL,
  days_back INTEGER DEFAULT 30
)
RETURNS TABLE(
  model TEXT,
  provider TEXT,
  total_requests BIGINT,
  total_cost DECIMAL(10, 6),
  average_latency DECIMAL(8, 2),
  success_rate DECIMAL(5, 4),
  last_used TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    usage.model,
    usage.provider,
    COUNT(*)::BIGINT as total_requests,
    SUM(usage.cost)::DECIMAL(10, 6) as total_cost,
    AVG(usage.latency)::DECIMAL(8, 2) as average_latency,
    (COUNT(CASE WHEN usage.success THEN 1 END)::DECIMAL / COUNT(*))::DECIMAL(5, 4) as success_rate,
    MAX(usage.timestamp) as last_used
  FROM ai_model_usage usage
  WHERE 
    (user_uuid IS NULL OR usage.user_id = user_uuid)
    AND usage.timestamp >= NOW() - INTERVAL '1 day' * days_back
  GROUP BY usage.model, usage.provider
  ORDER BY total_requests DESC;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) policies
ALTER TABLE ai_model_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_budget_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_optimization_suggestions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own usage data
DROP POLICY IF EXISTS "Users can view own AI usage" ON ai_model_usage;
CREATE POLICY "Users can view own AI usage" ON ai_model_usage
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own AI usage" ON ai_model_usage;
CREATE POLICY "Users can insert own AI usage" ON ai_model_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only see their own budget data
DROP POLICY IF EXISTS "Users can view own budget tracking" ON ai_budget_tracking;
CREATE POLICY "Users can view own budget tracking" ON ai_budget_tracking
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own budget tracking" ON ai_budget_tracking;
CREATE POLICY "Users can manage own budget tracking" ON ai_budget_tracking
  FOR ALL USING (auth.uid() = user_id);

-- Users can only see their own optimization suggestions
DROP POLICY IF EXISTS "Users can view own optimization suggestions" ON ai_optimization_suggestions;
CREATE POLICY "Users can view own optimization suggestions" ON ai_optimization_suggestions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own optimization suggestions" ON ai_optimization_suggestions;
CREATE POLICY "Users can manage own optimization suggestions" ON ai_optimization_suggestions
  FOR ALL USING (auth.uid() = user_id);

-- Model performance is readable by all authenticated users (aggregated data)
DROP POLICY IF EXISTS "Authenticated users can view model performance" ON ai_model_performance;
CREATE POLICY "Authenticated users can view model performance" ON ai_model_performance
  FOR SELECT USING (auth.role() = 'authenticated');

-- Grant necessary permissions
GRANT SELECT, INSERT ON ai_model_usage TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ai_budget_tracking TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ai_optimization_suggestions TO authenticated;
GRANT SELECT ON ai_model_performance TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated; 