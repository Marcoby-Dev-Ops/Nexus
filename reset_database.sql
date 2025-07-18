-- Complete Database Reset Script
-- This will drop ALL tables, functions, and data
-- WARNING: This will permanently delete all data!

-- Disable triggers temporarily
SET session_replication_role = replica;

-- Drop all tables (this will cascade to dependent objects)
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Drop all tables in public schema
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
    
    -- Drop all views
    FOR r IN (SELECT viewname FROM pg_views WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP VIEW IF EXISTS public.' || quote_ident(r.viewname) || ' CASCADE';
    END LOOP;
    
    -- Drop all functions
    FOR r IN (SELECT proname FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public') LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(r.proname) || ' CASCADE';
    END LOOP;
    
    -- Drop all sequences
    FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS public.' || quote_ident(r.sequence_name) || ' CASCADE';
    END LOOP;
    
    -- Drop all types
    FOR r IN (SELECT typname FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typtype = 'c') LOOP
        EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.typname) || ' CASCADE';
    END LOOP;
END $$;

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Reset sequences
ALTER SEQUENCE IF EXISTS auth.users_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS auth.identities_id_seq RESTART WITH 1;

-- Clean up any remaining objects
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Grant necessary permissions
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Create basic extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create essential tables for your app
-- 1. User Profiles
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    display_name VARCHAR(200),
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'user',
    department VARCHAR(100),
    company_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Companies
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    description TEXT,
    industry VARCHAR(100),
    size VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Activities (for analytics)
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    user_id UUID NOT NULL,
    source VARCHAR(100) DEFAULT 'web',
    source_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    occurred_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. User Licenses (for billing)
CREATE TABLE IF NOT EXISTS user_licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    org_id UUID,
    tier VARCHAR(50) DEFAULT 'free',
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Chat Usage Tracking
CREATE TABLE IF NOT EXISTS chat_usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    org_id UUID,
    date DATE NOT NULL,
    message_count INTEGER DEFAULT 0,
    token_count INTEGER DEFAULT 0,
    cost DECIMAL(10,4) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Communication Events
CREATE TABLE IF NOT EXISTS communication_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(255) NOT NULL,
    user_id UUID NOT NULL,
    company_id UUID,
    platform VARCHAR(100) DEFAULT 'web',
    event_data JSONB DEFAULT '{}',
    channel_id VARCHAR(255),
    message_id VARCHAR(255),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Company Status
CREATE TABLE IF NOT EXISTS company_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
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

-- 8. Debug Logs
CREATE TABLE IF NOT EXISTS debug_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level VARCHAR(20) NOT NULL DEFAULT 'info',
    message TEXT NOT NULL,
    context JSONB DEFAULT '{}',
    user_id UUID,
    session_id VARCHAR(255),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    source VARCHAR(100) DEFAULT 'web',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Analytics Events
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(255) NOT NULL,
    user_id UUID,
    session_id VARCHAR(255),
    properties JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    source VARCHAR(100) DEFAULT 'web',
    version VARCHAR(20) DEFAULT '1.0.0',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Service Health
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_company_id ON user_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_occurred_at ON activities(occurred_at);
CREATE INDEX IF NOT EXISTS idx_user_licenses_user_id ON user_licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_usage_tracking_user_id ON chat_usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_usage_tracking_date ON chat_usage_tracking(date);
CREATE INDEX IF NOT EXISTS idx_communication_events_user_id ON communication_events(user_id);
CREATE INDEX IF NOT EXISTS idx_communication_events_event_type ON communication_events(event_type);
CREATE INDEX IF NOT EXISTS idx_communication_events_timestamp ON communication_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_company_status_company_id ON company_status(company_id);
CREATE INDEX IF NOT EXISTS idx_debug_logs_user_id ON debug_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_debug_logs_level ON debug_logs(level);
CREATE INDEX IF NOT EXISTS idx_debug_logs_timestamp ON debug_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_service_health_service_name ON service_health(service_name);
CREATE INDEX IF NOT EXISTS idx_service_health_status ON service_health(status);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE debug_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_health ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies
-- User Profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Activities
CREATE POLICY "Users can view their own activities" ON activities
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own activities" ON activities
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- User Licenses
CREATE POLICY "Users can view their own licenses" ON user_licenses
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Chat Usage Tracking
CREATE POLICY "Users can view their own usage" ON chat_usage_tracking
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own usage" ON chat_usage_tracking
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Communication Events
CREATE POLICY "Users can view their own communication events" ON communication_events
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own communication events" ON communication_events
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Debug Logs
CREATE POLICY "Users can view their own debug logs" ON debug_logs
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own debug logs" ON debug_logs
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Analytics Events
CREATE POLICY "Users can view their own analytics events" ON analytics_events
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own analytics events" ON analytics_events
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Company Status (users can view their company's status)
CREATE POLICY "Users can view their company status" ON company_status
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.company_id = company_status.company_id
        )
    );

-- Service Health (admin only)
CREATE POLICY "Admin can manage service health" ON service_health
    FOR ALL USING (auth.uid() IN (
        SELECT user_id FROM user_profiles WHERE role = 'admin'
    ));

-- Insert some basic test data
INSERT INTO companies (id, name, domain, description, industry, size) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', 'Marcoby', 'marcoby.com', 'AI-powered business intelligence platform', 'Technology', 'Small');

INSERT INTO user_profiles (id, email, first_name, last_name, display_name, role, company_id) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'admin@marcoby.com', 'Admin', 'User', 'Admin User', 'admin', '550e8400-e29b-41d4-a716-446655440000');

-- Success message
SELECT 'Database reset completed successfully!' as status; 