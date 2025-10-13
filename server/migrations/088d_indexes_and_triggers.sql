-- Migration: Indexes and Triggers for Playbook/Journey System
-- Split from 088_create_unified_playbook_journey_system.sql

-- Playbook system indexes
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

-- Triggers and functions for updated_at
CREATE TRIGGER update_playbook_templates_updated_at
    BEFORE UPDATE ON playbook_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_playbook_items_updated_at
    BEFORE UPDATE ON playbook_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_playbook_progress_updated_at
    BEFORE UPDATE ON user_playbook_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION update_journey_analytics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER journey_analytics_updated_at
  BEFORE UPDATE ON journey_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_journey_analytics_updated_at();

CREATE OR REPLACE FUNCTION update_journey_context_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER journey_context_notes_updated_at
  BEFORE UPDATE ON journey_context_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_journey_context_notes_updated_at();

CREATE OR REPLACE FUNCTION update_playbook_knowledge_mappings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER playbook_knowledge_mappings_updated_at
  BEFORE UPDATE ON playbook_knowledge_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_playbook_knowledge_mappings_updated_at();
