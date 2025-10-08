-- Migration: Create Unified Playbook/Journey System (Consolidated)
-- Description: Creates complete playbook and journey system with analytics and knowledge mapping

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PLAYBOOK SYSTEM TABLES
-- ============================================================================

-- Playbook Templates - Structured business improvement playbooks for systematic implementation
CREATE TABLE IF NOT EXISTS playbook_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    version VARCHAR(50) DEFAULT '1.0.0',
    is_active BOOLEAN DEFAULT true,
    category VARCHAR(100),
    estimated_duration_hours INTEGER,
    prerequisites JSONB DEFAULT '[]',
    priority INTEGER DEFAULT 0,
    complexity VARCHAR(50) DEFAULT 'beginner',
    success_metrics JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Playbook Items - Individual steps and tasks within playbooks for systematic implementation
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

-- User playbook responses (if not already exists from migration 080)
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

-- ============================================================================
-- JOURNEY SYSTEM TABLES (Unified with Playbooks)
-- ============================================================================

-- User journeys (active instances) - unified with playbook system
CREATE TABLE IF NOT EXISTS user_journeys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  playbook_id TEXT NOT NULL,
  status TEXT CHECK (status IN ('not_started', 'in_progress', 'completed', 'paused')) DEFAULT 'not_started',
  current_step INTEGER DEFAULT 1,
  total_steps INTEGER NOT NULL,
  progress_percentage REAL DEFAULT 0,
  step_responses JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Step responses
CREATE TABLE IF NOT EXISTS step_responses (
  id TEXT PRIMARY KEY,
  journey_id TEXT NOT NULL REFERENCES user_journeys(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL,
  response JSONB NOT NULL,
  completed_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Journey analytics table for tracking user journey patterns
CREATE TABLE IF NOT EXISTS journey_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL, -- Authentik user ID (hash)
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  journey_id TEXT NOT NULL,
  completion_duration INTEGER, -- Duration in minutes
  response_count INTEGER DEFAULT 0,
  maturity_assessment JSONB,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Journey context notes table for storing knowledge enhancements
CREATE TABLE IF NOT EXISTS journey_context_notes (
  id TEXT PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  journey_id TEXT NOT NULL,
  step_id TEXT NOT NULL,
  note_type TEXT NOT NULL CHECK (note_type IN ('insight', 'pattern', 'recommendation', 'learning')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- KNOWLEDGE MAPPING SYSTEM
-- ============================================================================

-- Knowledge mappings table for linking playbooks to knowledge base updates
CREATE TABLE IF NOT EXISTS playbook_knowledge_mappings (
  id TEXT PRIMARY KEY,
  playbook_id UUID NOT NULL, -- Will add foreign key constraint later
  item_id TEXT NOT NULL,
  knowledge_fields JSONB NOT NULL DEFAULT '[]',
  update_triggers JSONB NOT NULL DEFAULT '{}',
  validation_rules JSONB NOT NULL DEFAULT '{}',
  monitoring_config JSONB NOT NULL DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Knowledge update triggers table
CREATE TABLE IF NOT EXISTS knowledge_update_triggers (
  id TEXT PRIMARY KEY,
  mapping_id TEXT NOT NULL REFERENCES playbook_knowledge_mappings(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('start', 'progress', 'complete', 'update', 'monitor')),
  playbook_id UUID NOT NULL, -- Will add foreign key constraint later
  item_id TEXT NOT NULL,
  user_id VARCHAR(255) NOT NULL, -- Authentik user ID (hash)
  organization_id UUID NOT NULL, -- Will add foreign key constraint later
  response_data JSONB NOT NULL DEFAULT '{}',
  previous_state JSONB DEFAULT '{}',
  knowledge_changes JSONB NOT NULL DEFAULT '{}',
  confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Monitoring alerts table
CREATE TABLE IF NOT EXISTS monitoring_alerts (
  id TEXT PRIMARY KEY,
  organization_id UUID NOT NULL, -- Will add foreign key constraint later
  playbook_id UUID NOT NULL, -- Will add foreign key constraint later
  item_id TEXT NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('threshold_exceeded', 'data_stale', 'inconsistency_detected', 'completion_milestone')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL CHECK (status IN ('active', 'acknowledged', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Journey playbook mapping table for backward compatibility
CREATE TABLE IF NOT EXISTS journey_playbook_mapping (
  journey_template_id VARCHAR PRIMARY KEY,
  playbook_template_id UUID NOT NULL REFERENCES playbook_templates(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- COMPREHENSIVE INDEXES
-- ============================================================================

-- Playbook system indexes
ALTER TABLE playbook_templates
    ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS complexity VARCHAR(50) DEFAULT 'beginner',
    ADD COLUMN IF NOT EXISTS success_metrics JSONB DEFAULT '[]';

CREATE INDEX IF NOT EXISTS idx_playbook_templates_active ON playbook_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_playbook_templates_category ON playbook_templates(category);
CREATE INDEX IF NOT EXISTS idx_playbook_templates_priority ON playbook_templates(priority);
CREATE INDEX IF NOT EXISTS idx_playbook_templates_complexity ON playbook_templates(complexity);
CREATE INDEX IF NOT EXISTS idx_playbook_items_playbook_id ON playbook_items(playbook_id);
CREATE INDEX IF NOT EXISTS idx_playbook_items_order ON playbook_items(playbook_id, order_index);
CREATE INDEX IF NOT EXISTS idx_user_playbook_progress_user_id ON user_playbook_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_playbook_progress_playbook_id ON user_playbook_progress(playbook_id);
CREATE INDEX IF NOT EXISTS idx_user_playbook_progress_user_playbook ON user_playbook_progress(user_id, playbook_id);
CREATE INDEX IF NOT EXISTS idx_user_playbook_responses_user_id ON user_playbook_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_playbook_responses_playbook_id ON user_playbook_responses(playbook_id);
CREATE INDEX IF NOT EXISTS idx_user_playbook_responses_user_playbook ON user_playbook_responses(user_id, playbook_id);

-- Journey system indexes
CREATE INDEX IF NOT EXISTS idx_user_journeys_user_id ON user_journeys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_journeys_playbook_id ON user_journeys(playbook_id);
CREATE INDEX IF NOT EXISTS idx_user_journeys_status ON user_journeys(status);
CREATE INDEX IF NOT EXISTS idx_user_journeys_created_at ON user_journeys(created_at);
CREATE INDEX IF NOT EXISTS idx_step_responses_journey_id ON step_responses(journey_id);
CREATE INDEX IF NOT EXISTS idx_step_responses_step_id ON step_responses(step_id);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_journey_analytics_user_id ON journey_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_journey_analytics_organization_id ON journey_analytics(organization_id);
CREATE INDEX IF NOT EXISTS idx_journey_analytics_journey_id ON journey_analytics(journey_id);
CREATE INDEX IF NOT EXISTS idx_journey_analytics_completed_at ON journey_analytics(completed_at);

-- Context notes indexes
CREATE INDEX IF NOT EXISTS idx_journey_context_notes_company_id ON journey_context_notes(company_id);
CREATE INDEX IF NOT EXISTS idx_journey_context_notes_journey_id ON journey_context_notes(journey_id);
CREATE INDEX IF NOT EXISTS idx_journey_context_notes_note_type ON journey_context_notes(note_type);
CREATE INDEX IF NOT EXISTS idx_journey_context_notes_created_at ON journey_context_notes(created_at);

-- Knowledge mapping indexes
CREATE INDEX IF NOT EXISTS idx_playbook_knowledge_mappings_playbook_id ON playbook_knowledge_mappings(playbook_id);
CREATE INDEX IF NOT EXISTS idx_playbook_knowledge_mappings_item_id ON playbook_knowledge_mappings(item_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_update_triggers_mapping_id ON knowledge_update_triggers(mapping_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_update_triggers_organization_id ON knowledge_update_triggers(organization_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_update_triggers_status ON knowledge_update_triggers(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_update_triggers_created_at ON knowledge_update_triggers(created_at);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_organization_id ON monitoring_alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_status ON monitoring_alerts(status);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_severity ON monitoring_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_created_at ON monitoring_alerts(created_at);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_playbook_templates_updated_at ON playbook_templates;
CREATE TRIGGER update_playbook_templates_updated_at
    BEFORE UPDATE ON playbook_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_playbook_items_updated_at ON playbook_items;
CREATE TRIGGER update_playbook_items_updated_at
    BEFORE UPDATE ON playbook_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_playbook_progress_updated_at ON user_playbook_progress;
CREATE TRIGGER update_user_playbook_progress_updated_at
    BEFORE UPDATE ON user_playbook_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Journey analytics trigger
CREATE OR REPLACE FUNCTION update_journey_analytics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS journey_analytics_updated_at ON journey_analytics;
CREATE TRIGGER journey_analytics_updated_at
  BEFORE UPDATE ON journey_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_journey_analytics_updated_at();

-- Journey context notes trigger
CREATE OR REPLACE FUNCTION update_journey_context_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS journey_context_notes_updated_at ON journey_context_notes;
CREATE TRIGGER journey_context_notes_updated_at
  BEFORE UPDATE ON journey_context_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_journey_context_notes_updated_at();

-- Knowledge mappings trigger
CREATE OR REPLACE FUNCTION update_playbook_knowledge_mappings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS playbook_knowledge_mappings_updated_at ON playbook_knowledge_mappings;
CREATE TRIGGER playbook_knowledge_mappings_updated_at
  BEFORE UPDATE ON playbook_knowledge_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_playbook_knowledge_mappings_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS for journey analytics
ALTER TABLE journey_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for journey analytics
CREATE POLICY "Users can view their own journey analytics" ON journey_analytics
  FOR SELECT USING (user_id = (current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "Users can insert their own journey analytics" ON journey_analytics
  FOR INSERT WITH CHECK (user_id = (current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "Users can update their own journey analytics" ON journey_analytics
  FOR UPDATE USING (user_id = (current_setting('request.jwt.claims', true)::json->>'sub'));

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- Insert sample playbook templates if they don't exist
INSERT INTO playbook_templates (name, description, version, category, estimated_duration_hours, priority, complexity) VALUES
('Business Onboarding', 'Complete business setup and onboarding process', '1.0.0', 'onboarding', 24, 1, 'beginner'),
('Sales Process Setup', 'Establish sales processes and tools', '1.0.0', 'sales', 16, 1, 'medium'),
('Marketing Foundation', 'Set up marketing infrastructure and campaigns', '1.0.0', 'marketing', 20, 1, 'medium')
ON CONFLICT (name) DO NOTHING;
