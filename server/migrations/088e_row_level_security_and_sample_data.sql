-- Migration: Row Level Security and Sample Data
-- Split from 088_create_unified_playbook_journey_system.sql

-- Enable RLS for journey analytics
ALTER TABLE journey_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for journey analytics
CREATE POLICY "Users can view their own journey analytics" ON journey_analytics
  FOR SELECT USING (user_id = (current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "Users can insert their own journey analytics" ON journey_analytics
  FOR INSERT WITH CHECK (user_id = (current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "Users can update their own journey analytics" ON journey_analytics
  FOR UPDATE USING (user_id = (current_setting('request.jwt.claims', true)::json->>'sub'));

-- Sample playbook templates
-- Ensure playbook_templates has columns expected by sample data (added by other consolidated migrations)
ALTER TABLE playbook_templates ADD COLUMN IF NOT EXISTS estimated_duration_hours INTEGER;
ALTER TABLE playbook_templates ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;
ALTER TABLE playbook_templates ADD COLUMN IF NOT EXISTS complexity VARCHAR(50) DEFAULT 'beginner';

INSERT INTO playbook_templates (name, description, version, category, estimated_duration_hours, priority, complexity) VALUES
('Business Onboarding', 'Complete business setup and onboarding process', '1.0.0', 'onboarding', 24, 1, 'beginner'),
('Sales Process Setup', 'Establish sales processes and tools', '1.0.0', 'sales', 16, 1, 'medium'),
('Marketing Foundation', 'Set up marketing infrastructure and campaigns', '1.0.0', 'marketing', 20, 1, 'medium')
ON CONFLICT (name) DO NOTHING;
