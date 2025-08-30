-- Create playbook knowledge mapping tables for linking playbooks to knowledge base updates

-- Knowledge mappings table
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

-- Create indexes for performance
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

-- Note: RLS policies will be added separately once auth.uid() function is available
-- For now, tables are created without RLS to ensure migration succeeds

-- Create functions to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_playbook_knowledge_mappings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS playbook_knowledge_mappings_updated_at ON playbook_knowledge_mappings;
CREATE TRIGGER playbook_knowledge_mappings_updated_at
  BEFORE UPDATE ON playbook_knowledge_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_playbook_knowledge_mappings_updated_at();

-- Note: Sample data insertion removed to avoid dependencies on existing tables
-- Foreign key constraints will be added in a separate migration once referenced tables are confirmed to exist
