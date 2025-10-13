-- Migration: Indexes and Triggers for Playbook/Journey System
-- Split from 088_create_unified_playbook_journey_system.sql

-- Playbook system indexes (created only if table/column exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'playbook_templates') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='playbook_templates' AND column_name='is_active') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_playbook_templates_active ON playbook_templates(is_active)';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='playbook_templates' AND column_name='category') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_playbook_templates_category ON playbook_templates(category)';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='playbook_templates' AND column_name='priority') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_playbook_templates_priority ON playbook_templates(priority)';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='playbook_templates' AND column_name='complexity') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_playbook_templates_complexity ON playbook_templates(complexity)';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'playbook_items') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='playbook_items' AND column_name='playbook_id') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_playbook_items_playbook_id ON playbook_items(playbook_id)';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='playbook_items' AND column_name='order_index') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_playbook_items_order ON playbook_items(playbook_id, order_index)';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_playbook_progress') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_user_playbook_progress_user_id ON user_playbook_progress(user_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_user_playbook_progress_playbook_id ON user_playbook_progress(playbook_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_user_playbook_progress_user_playbook ON user_playbook_progress(user_id, playbook_id)';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_playbook_responses') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_user_playbook_responses_user_id ON user_playbook_responses(user_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_user_playbook_responses_playbook_id ON user_playbook_responses(playbook_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_user_playbook_responses_user_playbook ON user_playbook_responses(user_id, playbook_id)';
  END IF;

  -- Journey system indexes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_journeys') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_user_journeys_user_id ON user_journeys(user_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_user_journeys_playbook_id ON user_journeys(playbook_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_user_journeys_status ON user_journeys(status)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_user_journeys_created_at ON user_journeys(created_at)';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'step_responses') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_step_responses_journey_id ON step_responses(journey_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_step_responses_step_id ON step_responses(step_id)';
  END IF;

  -- Analytics indexes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'journey_analytics') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_journey_analytics_user_id ON journey_analytics(user_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_journey_analytics_organization_id ON journey_analytics(organization_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_journey_analytics_journey_id ON journey_analytics(journey_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_journey_analytics_completed_at ON journey_analytics(completed_at)';
  END IF;

  -- Context notes indexes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'journey_context_notes') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_journey_context_notes_company_id ON journey_context_notes(company_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_journey_context_notes_journey_id ON journey_context_notes(journey_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_journey_context_notes_note_type ON journey_context_notes(note_type)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_journey_context_notes_created_at ON journey_context_notes(created_at)';
  END IF;

  -- Knowledge mapping indexes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'playbook_knowledge_mappings') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_playbook_knowledge_mappings_playbook_id ON playbook_knowledge_mappings(playbook_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_playbook_knowledge_mappings_item_id ON playbook_knowledge_mappings(item_id)';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'knowledge_update_triggers') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_knowledge_update_triggers_mapping_id ON knowledge_update_triggers(mapping_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_knowledge_update_triggers_organization_id ON knowledge_update_triggers(organization_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_knowledge_update_triggers_status ON knowledge_update_triggers(status)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_knowledge_update_triggers_created_at ON knowledge_update_triggers(created_at)';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'monitoring_alerts') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_organization_id ON monitoring_alerts(organization_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_status ON monitoring_alerts(status)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_severity ON monitoring_alerts(severity)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_created_at ON monitoring_alerts(created_at)';
  END IF;
END$$;

-- Triggers and functions for updated_at (ensure idempotent creation)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'playbook_templates') THEN
  PERFORM 1;
  END IF;
END$$;

-- Drop existing triggers before creating to prevent duplicate trigger errors
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
