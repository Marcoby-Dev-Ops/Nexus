-- =============================================================================
-- NEXUS DATABASE INITIALIZATION SCRIPT
-- =============================================================================
-- This script creates a fresh database schema for the Nexus application
-- Run this script once to initialize a new database
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create migrations tracking table
CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    version VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(64),
    execution_time_ms INTEGER
);

-- Function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- CORE USER MANAGEMENT
-- =============================================================================

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles (Authentik integration)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL UNIQUE, -- Authentik user ID (hash)
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    business_email VARCHAR(255),
    personal_email VARCHAR(255),
    phone VARCHAR(20),
    mobile VARCHAR(20),
    work_phone VARCHAR(20),
    avatar_url TEXT,
    bio TEXT,
    company_name VARCHAR(255),
    job_title VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('owner', 'admin', 'manager', 'user')),
    department VARCHAR(100),
    display_name VARCHAR(255),
    location VARCHAR(255),
    timezone VARCHAR(50) DEFAULT 'UTC',
    work_location VARCHAR(50) CHECK (work_location IN ('office', 'remote', 'hybrid')),
    website VARCHAR(255),
    linkedin_url VARCHAR(255),
    github_url VARCHAR(255),
    twitter_url VARCHAR(255),
    social_links JSONB,
    skills TEXT[] DEFAULT '{}',
    certifications TEXT[] DEFAULT '{}',
    languages JSONB DEFAULT '[]',
    address JSONB DEFAULT '{}',
    emergency_contact JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
    onboarding_completed BOOLEAN DEFAULT false,
    profile_completion_percentage INTEGER DEFAULT 0,
    subscription_tier VARCHAR(50) DEFAULT 'free',
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User preferences
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL UNIQUE, -- Authentik user ID (hash)
    theme VARCHAR(50) DEFAULT 'system',
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    notifications_enabled BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User-Organization relationships
CREATE TABLE IF NOT EXISTS user_organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL, -- Authentik user ID (hash)
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    permissions JSONB DEFAULT '{}',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, organization_id)
);

-- =============================================================================
-- BUSINESS MANAGEMENT
-- =============================================================================

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    industry VARCHAR(100),
    size VARCHAR(50),
    description TEXT,
    website VARCHAR(255),
    logo_url TEXT,
    address JSONB DEFAULT '{}',
    contact_info JSONB DEFAULT '{}',
    tax_info JSONB DEFAULT '{}',
    billing_info JSONB DEFAULT '{}',
    owner_id VARCHAR(255) NOT NULL, -- Authentik user ID (hash)
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    subscription_plan VARCHAR(50) DEFAULT 'free',
    max_users INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Company members
CREATE TABLE IF NOT EXISTS company_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL, -- Authentik user ID (hash)
    role VARCHAR(50) DEFAULT 'member',
    permissions JSONB DEFAULT '{}',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(company_id, user_id)
);

-- =============================================================================
-- INTEGRATIONS
-- =============================================================================

-- Available integrations
CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(100),
    description TEXT,
    icon_url TEXT,
    config_schema JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User integrations
CREATE TABLE IF NOT EXISTS user_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL, -- Authentik user ID (hash)
    integration_name VARCHAR(100) NOT NULL,
    integration_id UUID REFERENCES integrations(id),
    credentials JSONB,
    settings JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'active',
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, integration_name)
);

-- OAuth tokens
CREATE TABLE IF NOT EXISTS oauth_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL, -- Authentik user ID (hash)
    integration_slug VARCHAR(100) NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_type VARCHAR(50) DEFAULT 'Bearer',
    expires_at TIMESTAMP WITH TIME ZONE,
    scope TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- BUSINESS ANALYTICS & HEALTH
-- =============================================================================

-- Business health snapshots
CREATE TABLE IF NOT EXISTS business_health_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL, -- Authentik user ID (hash)
    org_id UUID REFERENCES companies(id),
    overall_score INTEGER NOT NULL DEFAULT 0,
    category_scores JSONB DEFAULT '{}',
    last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_sources TEXT[] DEFAULT '{}',
    connected_sources INTEGER DEFAULT 0,
    verified_sources INTEGER DEFAULT 0,
    data_quality_score INTEGER DEFAULT 0,
    completion_percentage INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- =============================================================================
-- AI & CHAT SYSTEM
-- =============================================================================

-- Chat conversations
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL, -- Authentik user ID (hash)
    title VARCHAR(255),
    context JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI memory/knowledge base
CREATE TABLE IF NOT EXISTS ai_memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL, -- Authentik user ID (hash)
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    embedding VECTOR(1536), -- OpenAI embedding dimension
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- PERFORMANCE INDEXES
-- =============================================================================

-- Organizations indexes
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);

-- User indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_user_id ON user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_org_id ON user_organizations(organization_id);

-- Company indexes
CREATE INDEX IF NOT EXISTS idx_companies_owner_id ON companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_company_members_company_id ON company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_company_members_user_id ON company_members(user_id);

-- Integration indexes
CREATE INDEX IF NOT EXISTS idx_integrations_slug ON integrations(slug);
CREATE INDEX IF NOT EXISTS idx_user_integrations_user_id ON user_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user_id ON oauth_tokens(user_id);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_business_health_snapshots_user_id ON business_health_snapshots(user_id);

-- Chat indexes
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_memories_user_id ON ai_memories(user_id);

-- Vector similarity search index for AI memories
CREATE INDEX IF NOT EXISTS idx_ai_memories_embedding ON ai_memories USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================================================

CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at
    BEFORE UPDATE ON integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_integrations_updated_at
    BEFORE UPDATE ON user_integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_oauth_tokens_updated_at
    BEFORE UPDATE ON oauth_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_health_snapshots_updated_at
    BEFORE UPDATE ON business_health_snapshots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_memories_updated_at
    BEFORE UPDATE ON ai_memories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- DEFAULT DATA
-- =============================================================================

-- Insert default organization
INSERT INTO organizations (name, slug, description) 
VALUES ('Default Organization', 'default', 'Default organization for new users') 
ON CONFLICT (slug) DO NOTHING;

-- Insert default integrations
INSERT INTO integrations (name, slug, category, description, is_active) VALUES
('Google Workspace', 'google-workspace', 'productivity', 'Google Workspace integration for Gmail, Drive, Calendar, and more', true),
('Microsoft 365', 'microsoft-365', 'productivity', 'Microsoft 365 integration for Outlook, Teams, OneDrive, and more', true),
('HubSpot', 'hubspot', 'crm', 'HubSpot CRM integration for contacts, deals, and marketing automation', true),
('Slack', 'slack', 'communication', 'Slack integration for team communication and notifications', true),
('PayPal', 'paypal', 'payments', 'PayPal integration for payment processing and financial data', true),
('Stripe', 'stripe', 'payments', 'Stripe integration for payment processing and subscription management', true)
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Nexus database initialization completed successfully!';
    RAISE NOTICE '📊 Created % tables with proper indexes and triggers', (
        SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    );
    RAISE NOTICE '🔧 Extensions enabled: uuid-ossp, vector, pgcrypto';
    RAISE NOTICE '🚀 Database is ready for the Nexus application!';
END $$;
