-- Migration: Knowledge Mapping System Tables
-- Split from 088_create_unified_playbook_journey_system.sql

-- Playbook Knowledge Mappings
CREATE TABLE IF NOT EXISTS playbook_knowledge_mappings (
  id TEXT PRIMARY KEY,
  playbook_id UUID NOT NULL,
  item_id TEXT NOT NULL,
  knowledge_fields JSONB NOT NULL DEFAULT '[]',
  update_triggers JSONB NOT NULL DEFAULT '{}',
  validation_rules JSONB NOT NULL DEFAULT '{}',
  monitoring_config JSONB NOT NULL DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Knowledge Update Triggers
CREATE TABLE IF NOT EXISTS knowledge_update_triggers (
  id TEXT PRIMARY KEY,
  mapping_id TEXT NOT NULL REFERENCES playbook_knowledge_mappings(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('start', 'progress', 'complete', 'update', 'monitor')),
  playbook_id UUID NOT NULL,
  item_id TEXT NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  organization_id UUID NOT NULL,
  response_data JSONB NOT NULL DEFAULT '{}',
  previous_state JSONB DEFAULT '{}',
  knowledge_changes JSONB NOT NULL DEFAULT '{}',
  confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Monitoring Alerts
CREATE TABLE IF NOT EXISTS monitoring_alerts (
  id TEXT PRIMARY KEY,
  organization_id UUID NOT NULL,
  playbook_id UUID NOT NULL,
  item_id TEXT NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('threshold_exceeded', 'data_stale', 'inconsistency_detected', 'completion_milestone')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL CHECK (status IN ('active', 'acknowledged', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Journey Playbook Mapping
CREATE TABLE IF NOT EXISTS journey_playbook_mapping (
  journey_template_id VARCHAR PRIMARY KEY,
  playbook_template_id UUID NOT NULL REFERENCES playbook_templates(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
