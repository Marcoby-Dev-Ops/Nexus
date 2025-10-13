-- Nexus Database Initialization Script
-- This script sets up the initial database structure for the Authentik-based system
-- Run this script once to initialize a fresh database

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create migrations table to track applied migrations
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

-- Core Organizations and Users
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'external' CHECK (type IN ('internal', 'external', 'client', 'partner')),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Core Business Tables (create these first for foreign key references)
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

-- User Management
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
    company_id UUID REFERENCES companies(id),
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
    signup_completed BOOLEAN DEFAULT false,
    business_profile_completed BOOLEAN DEFAULT false,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- External user mappings for Authentik integration
CREATE TABLE IF NOT EXISTS user_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_user_id VARCHAR(255) NOT NULL UNIQUE, -- Authentik user ID (hash)
    internal_user_id VARCHAR(255) NOT NULL, -- Internal user reference
    provider VARCHAR(50) DEFAULT 'authentik',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Companies table already created above

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

-- Integrations
CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(100),
    category VARCHAR(100),
    description TEXT,
    icon_url TEXT,
    config_schema JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Platform Audit Table
CREATE TABLE IF NOT EXISTS platform_audit (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_type TEXT NOT NULL,
    object_type TEXT NULL,
    object_id UUID NULL,
    actor_id UUID NULL,
    target_user_id UUID NULL,
    endpoint TEXT NULL,
    ip INET NULL,
    user_agent TEXT NULL,
    data JSONB NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Business Health and Analytics
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_user_organizations_user_id ON user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_org_id ON user_organizations(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mappings_external_id ON user_mappings(external_user_id);
CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(type);
CREATE INDEX IF NOT EXISTS idx_companies_owner_id ON companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_company_members_company_id ON company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_company_members_user_id ON company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_company_id ON user_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_integrations_slug ON integrations(slug);
CREATE INDEX IF NOT EXISTS idx_user_integrations_user_id ON user_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_audit_event_type_created_at ON platform_audit (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_audit_actor_id ON platform_audit (actor_id);
CREATE INDEX IF NOT EXISTS idx_platform_audit_target_user_id ON platform_audit (target_user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user_id ON oauth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_business_health_snapshots_user_id ON business_health_snapshots(user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_mappings_updated_at
    BEFORE UPDATE ON user_mappings
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

-- Journey Tables - REDUNDANT TABLES REMOVED
-- Legacy journey_templates, journey_items, user_journey_progress, user_journey_responses
-- have been removed in favor of the unified playbook system created in migration 088
-- 
-- Current journey system uses:
-- - playbook_templates (replaces journey_templates)
-- - playbook_items (replaces journey_items)  
-- - user_journeys (replaces user_journey_progress)
-- - step_responses (replaces user_journey_responses)

-- Playbook Tables (needed for migration 085)
CREATE TABLE IF NOT EXISTS playbook_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    version VARCHAR(50) DEFAULT '1.0.0',
    is_active BOOLEAN DEFAULT true,
    category VARCHAR(100),
    estimated_duration_hours INTEGER,
    prerequisites JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS playbook_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playbook_id UUID NOT NULL REFERENCES playbook_templates(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('step', 'task', 'milestone', 'checklist')),
    order_index INTEGER NOT NULL,
    is_required BOOLEAN DEFAULT true,
    estimated_duration_minutes INTEGER,
    validation_schema JSONB DEFAULT '{}',
    component_name VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_playbook_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL, -- Authentik user ID (hash)
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    playbook_id UUID NOT NULL REFERENCES playbook_templates(id) ON DELETE CASCADE,
    ticket_id UUID,
    current_item_id UUID REFERENCES playbook_items(id),
    progress_percentage INTEGER NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'paused')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, organization_id, playbook_id)
);

CREATE TABLE IF NOT EXISTS user_playbook_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL, -- Authentik user ID (hash)
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    playbook_id UUID NOT NULL REFERENCES playbook_templates(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES playbook_items(id) ON DELETE CASCADE,
    ticket_id UUID,
    response_data JSONB DEFAULT '{}',
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Building Blocks Tables (needed for migration 080)
CREATE TABLE IF NOT EXISTS building_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    complexity VARCHAR(50) NOT NULL CHECK (complexity IN ('simple', 'medium', 'complex')),
    implementation_time_hours INTEGER NOT NULL,
    risk_level VARCHAR(50) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
    expected_impact VARCHAR(50) NOT NULL CHECK (expected_impact IN ('low', 'medium', 'high')),
    prerequisites JSONB DEFAULT '[]',
    success_metrics JSONB DEFAULT '[]',
    phase_relevance JSONB DEFAULT '[]',
    mental_model_alignment JSONB DEFAULT '[]',
    tags TEXT[] DEFAULT '{}',
    documentation TEXT,
    examples JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_building_block_implementations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL, -- Authentik user ID (hash)
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    building_block_id UUID NOT NULL REFERENCES building_blocks(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'paused', 'cancelled')),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    implementation_notes TEXT,
    success_metrics_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maturity Assessment Tables (needed for migration 080)
CREATE TABLE IF NOT EXISTS maturity_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL, -- Authentik user ID (hash)
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    overall_score DECIMAL(3,2) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 5),
    overall_level INTEGER NOT NULL CHECK (overall_level >= 0 AND overall_level <= 5),
    domain_scores JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',
    last_assessment TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    next_assessment TIMESTAMP WITH TIME ZONE,
    improvement_history JSONB DEFAULT '[]',
    benchmark_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, company_id)
);

CREATE TABLE IF NOT EXISTS maturity_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    weight DECIMAL(3,2) NOT NULL CHECK (weight >= 0 AND weight <= 1),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maturity_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id UUID REFERENCES maturity_domains(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL CHECK (question_type IN ('multiple_choice', 'scale', 'boolean', 'integration_check')),
    options JSONB DEFAULT '[]',
    scale_range JSONB DEFAULT '{}',
    integration_check JSONB DEFAULT '{}',
    weight DECIMAL(3,2) NOT NULL CHECK (weight >= 0 AND weight <= 1),
    order_index INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create additional indexes for new tables
CREATE INDEX IF NOT EXISTS idx_journey_templates_active ON journey_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_journey_items_template_order ON journey_items(journey_template_id, order_index);
CREATE INDEX IF NOT EXISTS idx_user_journey_progress_user ON user_journey_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_journey_progress_template ON user_journey_progress(template_id);
CREATE INDEX IF NOT EXISTS idx_user_journey_responses_user ON user_journey_responses(user_id);

CREATE INDEX IF NOT EXISTS idx_playbook_templates_active ON playbook_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_playbook_templates_category ON playbook_templates(category);
CREATE INDEX IF NOT EXISTS idx_playbook_items_playbook_id ON playbook_items(playbook_id);
CREATE INDEX IF NOT EXISTS idx_playbook_items_order ON playbook_items(playbook_id, order_index);
CREATE INDEX IF NOT EXISTS idx_user_playbook_progress_user_id ON user_playbook_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_playbook_progress_playbook_id ON user_playbook_progress(playbook_id);
CREATE INDEX IF NOT EXISTS idx_user_playbook_responses_user_id ON user_playbook_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_playbook_responses_playbook_id ON user_playbook_responses(playbook_id);

CREATE INDEX IF NOT EXISTS idx_building_blocks_category ON building_blocks(category);
CREATE INDEX IF NOT EXISTS idx_building_blocks_complexity ON building_blocks(complexity);
CREATE INDEX IF NOT EXISTS idx_building_blocks_active ON building_blocks(is_active);
CREATE INDEX IF NOT EXISTS idx_user_building_block_implementations_user_id ON user_building_block_implementations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_building_block_implementations_block_id ON user_building_block_implementations(building_block_id);
CREATE INDEX IF NOT EXISTS idx_user_building_block_implementations_status ON user_building_block_implementations(status);

CREATE INDEX IF NOT EXISTS idx_maturity_assessments_user_id ON maturity_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_maturity_assessments_company_id ON maturity_assessments(company_id);
CREATE INDEX IF NOT EXISTS idx_maturity_domains_active ON maturity_domains(is_active);
CREATE INDEX IF NOT EXISTS idx_maturity_questions_domain_id ON maturity_questions(domain_id);
CREATE INDEX IF NOT EXISTS idx_maturity_questions_active ON maturity_questions(is_active);

-- Create triggers for new tables
CREATE TRIGGER update_journey_templates_updated_at
    BEFORE UPDATE ON journey_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journey_items_updated_at
    BEFORE UPDATE ON journey_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_journey_progress_updated_at
    BEFORE UPDATE ON user_journey_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_journey_responses_updated_at
    BEFORE UPDATE ON user_journey_responses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_playbook_templates_updated_at
    BEFORE UPDATE ON playbook_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_playbook_items_updated_at
    BEFORE UPDATE ON playbook_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_playbook_progress_updated_at
    BEFORE UPDATE ON user_playbook_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_building_blocks_updated_at
    BEFORE UPDATE ON building_blocks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_building_block_implementations_updated_at
    BEFORE UPDATE ON user_building_block_implementations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maturity_assessments_updated_at
    BEFORE UPDATE ON maturity_assessments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maturity_domains_updated_at
    BEFORE UPDATE ON maturity_domains
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maturity_questions_updated_at
    BEFORE UPDATE ON maturity_questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default organization
INSERT INTO organizations (name, slug, description) 
VALUES ('Default Organization', 'default', 'Default organization for new users') 
ON CONFLICT (slug) DO NOTHING;

-- Insert sample data for maturity domains
INSERT INTO maturity_domains (name, description, weight) VALUES
('Sales Maturity', 'Sales process, pipeline management, and revenue generation capabilities', 0.25),
('Marketing Maturity', 'Marketing strategy, lead generation, and brand awareness', 0.20),
('Operations Maturity', 'Process efficiency, automation, and operational excellence', 0.20),
('Finance Maturity', 'Financial management, reporting, and strategic planning', 0.15),
('Leadership Maturity', 'Strategic decision-making, team management, and vision', 0.10),
('People & Culture Maturity', 'Team development, culture, and organizational health', 0.10)
ON CONFLICT (name) DO NOTHING;

-- Insert sample building blocks
INSERT INTO building_blocks (name, description, category, complexity, implementation_time_hours, risk_level, expected_impact, prerequisites, success_metrics, phase_relevance, mental_model_alignment, tags, documentation, examples) VALUES
('Sales Automation Block', 'Automated follow-up sequences and lead nurturing', 'sales', 'simple', 8, 'low', 'high', '["Email marketing tool", "Lead database"]'::jsonb, '["Response rate", "Conversion rate", "Sales cycle length"]'::jsonb, '["focus", "insight", "roadmap", "execute"]'::jsonb, '["successPatternRecognition", "lowHangingFruit"]'::jsonb, '{"automation", "follow-up", "email"}', 'Follow HubSpot''s proven email automation patterns', '["HubSpot sequences", "Mailchimp automation", "ActiveCampaign workflows"]'::jsonb),
('Lead Scoring Block', 'Prioritize leads based on engagement and fit', 'sales', 'medium', 16, 'medium', 'high', '["CRM system", "Lead data", "Analytics"]'::jsonb, '["Lead quality score", "Conversion rate", "Revenue per lead"]'::jsonb, '["insight", "roadmap", "execute"]'::jsonb, '["successPatternRecognition", "riskMinimization"]'::jsonb, '{"scoring", "prioritization", "analytics"}', 'Implement Salesforce-style lead scoring algorithms', '["Salesforce lead scoring", "Pipedrive lead scoring", "HubSpot lead scoring"]'::jsonb),
('Email Marketing Block', 'Automated email campaigns and segmentation', 'marketing', 'simple', 6, 'low', 'high', '["Email marketing tool", "Subscriber list"]'::jsonb, '["Open rate", "Click-through rate", "Conversion rate"]'::jsonb, '["focus", "insight", "roadmap", "execute"]'::jsonb, '["lowHangingFruit", "successPatternRecognition"]'::jsonb, '{"email", "automation", "segmentation"}', 'Follow Mailchimp''s email marketing best practices', '["Mailchimp campaigns", "ConvertKit sequences", "ActiveCampaign automation"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Insert sample playbook templates
INSERT INTO playbook_templates (name, description, version, category, estimated_duration_hours) VALUES
('Business Onboarding', 'Complete business setup and onboarding process', '1.0.0', 'onboarding', 24),
('Sales Process Setup', 'Establish sales processes and tools', '1.0.0', 'sales', 16),
('Marketing Foundation', 'Set up marketing infrastructure and campaigns', '1.0.0', 'marketing', 20)
ON CONFLICT (name) DO NOTHING;

-- Security is handled at the application level, not through RLS policies
