-- Schema Cleanup Migration
-- Add missing tables for core services

-- 1. Communication Analytics Service
CREATE TABLE IF NOT EXISTS communication_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(255) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id VARCHAR(255),
  properties JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  source VARCHAR(100) DEFAULT 'web',
  version VARCHAR(20) DEFAULT '1.0.0',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for communication_events
CREATE INDEX IF NOT EXISTS idx_communication_events_user_id ON communication_events(user_id);
CREATE INDEX IF NOT EXISTS idx_communication_events_timestamp ON communication_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_communication_events_event_type ON communication_events(event_type);

-- 2. Company Status Service
CREATE TABLE IF NOT EXISTS company_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  overall_score DECIMAL(3,2) DEFAULT 0.00,
  financial_health DECIMAL(3,2) DEFAULT 0.00,
  operational_efficiency DECIMAL(3,2) DEFAULT 0.00,
  market_position DECIMAL(3,2) DEFAULT 0.00,
  customer_satisfaction DECIMAL(3,2) DEFAULT 0.00,
  employee_engagement DECIMAL(3,2) DEFAULT 0.00,
  risk_assessment JSONB DEFAULT '{}',
  recommendations JSONB DEFAULT '[]',
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for company_status
CREATE INDEX IF NOT EXISTS idx_company_status_company_id ON company_status(company_id);
CREATE INDEX IF NOT EXISTS idx_company_status_overall_score ON company_status(overall_score);

-- 3. Debug Logs Service
CREATE TABLE IF NOT EXISTS debug_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level VARCHAR(20) NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  context JSONB DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id VARCHAR(255),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  source VARCHAR(100) DEFAULT 'web',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for debug_logs
CREATE INDEX IF NOT EXISTS idx_debug_logs_level ON debug_logs(level);
CREATE INDEX IF NOT EXISTS idx_debug_logs_timestamp ON debug_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_debug_logs_user_id ON debug_logs(user_id);

-- 4. Analytics Events Table (Proper Implementation)
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(255) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id VARCHAR(255),
  properties JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  source VARCHAR(100) DEFAULT 'web',
  version VARCHAR(20) DEFAULT '1.0.0',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics_events
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);

-- 5. Real-time Sync Events
CREATE TABLE IF NOT EXISTS realtime_sync_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department VARCHAR(100) NOT NULL,
  system VARCHAR(100) NOT NULL,
  data_type VARCHAR(100) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'pending',
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for realtime_sync_events
CREATE INDEX IF NOT EXISTS idx_realtime_sync_events_department ON realtime_sync_events(department);
CREATE INDEX IF NOT EXISTS idx_realtime_sync_events_status ON realtime_sync_events(status);
CREATE INDEX IF NOT EXISTS idx_realtime_sync_events_created_at ON realtime_sync_events(created_at);

-- 6. Service Health Monitoring
CREATE TABLE IF NOT EXISTS service_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'healthy',
  response_time_ms INTEGER,
  error_count INTEGER DEFAULT 0,
  last_check TIMESTAMPTZ DEFAULT NOW(),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for service_health
CREATE INDEX IF NOT EXISTS idx_service_health_service_name ON service_health(service_name);
CREATE INDEX IF NOT EXISTS idx_service_health_status ON service_health(status);
CREATE INDEX IF NOT EXISTS idx_service_health_last_check ON service_health(last_check);

-- Enable Row Level Security (RLS)
ALTER TABLE communication_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE debug_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE realtime_sync_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_health ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Communication Events
CREATE POLICY "Users can view their own communication events" ON communication_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own communication events" ON communication_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Company Status
CREATE POLICY "Users can view company status for their company" ON company_status
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.company_id = company_status.company_id
    )
  );

-- Debug Logs
CREATE POLICY "Users can view their own debug logs" ON debug_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own debug logs" ON debug_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Analytics Events
CREATE POLICY "Users can view their own analytics events" ON analytics_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics events" ON analytics_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Real-time Sync Events (admin only for now)
CREATE POLICY "Admin can manage realtime sync events" ON realtime_sync_events
  FOR ALL USING (auth.uid() IN (
    SELECT user_id FROM user_profiles WHERE role = 'admin'
  ));

-- Service Health (admin only)
CREATE POLICY "Admin can manage service health" ON service_health
  FOR ALL USING (auth.uid() IN (
    SELECT user_id FROM user_profiles WHERE role = 'admin'
  )); 