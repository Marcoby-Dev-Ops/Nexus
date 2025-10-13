-- Migration: Add Missing Service Tables
-- Description: Add tables that client services expect but are missing from the database

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create maturity_assessments table for MaturityFrameworkService
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

-- Create maturity_domains table for storing domain definitions
CREATE TABLE IF NOT EXISTS maturity_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    weight DECIMAL(3,2) NOT NULL CHECK (weight >= 0 AND weight <= 1),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create maturity_questions table for storing assessment questions
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

-- Create playbook_templates table for PlaybookService
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

-- Create playbook_items table for PlaybookService
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

-- Note: user_playbook_progress table removed - progress is tracked in user_journeys

-- Create user_playbook_responses table for PlaybookService
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

-- Create building_blocks table for BuildingBlocksService
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

-- Note: user_building_block_implementations table removed - progress is tracked in user_journeys

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_maturity_assessments_user_id ON maturity_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_maturity_assessments_company_id ON maturity_assessments(company_id);
CREATE INDEX IF NOT EXISTS idx_maturity_domains_active ON maturity_domains(is_active);
CREATE INDEX IF NOT EXISTS idx_maturity_questions_domain_id ON maturity_questions(domain_id);
CREATE INDEX IF NOT EXISTS idx_maturity_questions_active ON maturity_questions(is_active);

CREATE INDEX IF NOT EXISTS idx_playbook_templates_active ON playbook_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_playbook_templates_category ON playbook_templates(category);
CREATE INDEX IF NOT EXISTS idx_playbook_items_playbook_id ON playbook_items(playbook_id);
CREATE INDEX IF NOT EXISTS idx_playbook_items_order ON playbook_items(playbook_id, order_index);
-- Indexes for user_playbook_progress removed - table no longer exists
CREATE INDEX IF NOT EXISTS idx_user_playbook_responses_user_id ON user_playbook_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_playbook_responses_playbook_id ON user_playbook_responses(playbook_id);

CREATE INDEX IF NOT EXISTS idx_building_blocks_category ON building_blocks(category);
CREATE INDEX IF NOT EXISTS idx_building_blocks_complexity ON building_blocks(complexity);
CREATE INDEX IF NOT EXISTS idx_building_blocks_active ON building_blocks(is_active);
-- Indexes for user_building_block_implementations removed - table no longer exists

-- Create triggers for updated_at
CREATE TRIGGER update_maturity_assessments_updated_at
    BEFORE UPDATE ON maturity_assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maturity_domains_updated_at
    BEFORE UPDATE ON maturity_domains
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maturity_questions_updated_at
    BEFORE UPDATE ON maturity_questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_playbook_templates_updated_at
    BEFORE UPDATE ON playbook_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_playbook_items_updated_at
    BEFORE UPDATE ON playbook_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_building_blocks_updated_at
    BEFORE UPDATE ON building_blocks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

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

-- Migration tracking is handled by the migration runner
