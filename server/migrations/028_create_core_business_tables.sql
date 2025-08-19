-- Migration: Create core business tables for MVP
-- This ensures we have all the tables needed for the business intelligence features

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create business_metrics table
CREATE TABLE IF NOT EXISTS business_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL,
    value NUMERIC NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_activities table
CREATE TABLE IF NOT EXISTS user_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    activity_type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create next_best_actions table
CREATE TABLE IF NOT EXISTS next_best_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT CHECK (priority IN ('critical', 'high', 'medium', 'low')) DEFAULT 'medium',
    category TEXT CHECK (category IN ('sales', 'marketing', 'ops', 'finance', 'general')) DEFAULT 'general',
    status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_action_executions table
CREATE TABLE IF NOT EXISTS user_action_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action_id UUID REFERENCES next_best_actions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    result JSONB DEFAULT '{}',
    value_generated NUMERIC DEFAULT 0,
    execution_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create thoughts table with vector support
CREATE TABLE IF NOT EXISTS thoughts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(1536),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create documents table with vector support
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(1536),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_business_metrics_company_id ON business_metrics(company_id);
CREATE INDEX IF NOT EXISTS idx_business_metrics_metric_type ON business_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_business_metrics_created_at ON business_metrics(created_at);

CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_activity_type ON user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at);

CREATE INDEX IF NOT EXISTS idx_next_best_actions_user_id ON next_best_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_next_best_actions_priority ON next_best_actions(priority);
CREATE INDEX IF NOT EXISTS idx_next_best_actions_status ON next_best_actions(status);
CREATE INDEX IF NOT EXISTS idx_next_best_actions_category ON next_best_actions(category);

CREATE INDEX IF NOT EXISTS idx_user_action_executions_user_id ON user_action_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_action_executions_action_id ON user_action_executions(action_id);

CREATE INDEX IF NOT EXISTS idx_thoughts_user_id ON thoughts(user_id);
CREATE INDEX IF NOT EXISTS idx_thoughts_created_at ON thoughts(created_at);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);

-- Create vector indexes for similarity search
CREATE INDEX IF NOT EXISTS idx_thoughts_embedding ON thoughts USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_documents_embedding ON documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Add comments for documentation
COMMENT ON TABLE business_metrics IS 'Stores business performance metrics and KPIs';
COMMENT ON TABLE user_activities IS 'Tracks user interactions and activities for analytics';
COMMENT ON TABLE next_best_actions IS 'AI-generated recommendations for business actions';
COMMENT ON TABLE user_action_executions IS 'Tracks execution and results of recommended actions';
COMMENT ON TABLE thoughts IS 'User thoughts and insights with vector embeddings for similarity search';
COMMENT ON TABLE documents IS 'Business documents and content with vector embeddings for similarity search';
