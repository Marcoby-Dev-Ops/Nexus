-- Create base journey tables if they don't exist
-- This migration creates the basic journey tables structure

-- Create journey_templates table
CREATE TABLE IF NOT EXISTS journey_templates (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  version VARCHAR(50) DEFAULT '1.0.0',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  playbook_id VARCHAR(255),
  estimated_duration_minutes INTEGER DEFAULT 30,
  complexity VARCHAR(50) DEFAULT 'beginner',
  prerequisites TEXT[] DEFAULT ARRAY[]::text[],
  success_metrics TEXT[] DEFAULT ARRAY[]::text[],
  priority INTEGER DEFAULT 0
);

-- Create journey_items table
CREATE TABLE IF NOT EXISTS journey_items (
  id SERIAL PRIMARY KEY,
  journey_template_id VARCHAR(255) REFERENCES journey_templates(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  item_type VARCHAR(50) DEFAULT 'question',
  is_required BOOLEAN DEFAULT true,
  required BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_journey_progress table
CREATE TABLE IF NOT EXISTS user_journey_progress (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  organization_id VARCHAR(255),
  journey_id VARCHAR(255),
  template_id VARCHAR(255),
  journey_template_id VARCHAR(255),
  current_step INTEGER DEFAULT 0,
  total_steps INTEGER DEFAULT 0,
  progress_percentage INTEGER DEFAULT 0,
  current_item_index INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'in_progress',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  maturity_assessment JSONB,
  playbook_progress_id VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_journey_responses table
CREATE TABLE IF NOT EXISTS user_journey_responses (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  organization_id VARCHAR(255),
  journey_id VARCHAR(255),
  step_id VARCHAR(255),
  journey_template_id VARCHAR(255),
  item_id VARCHAR(255),
  response_data JSONB DEFAULT '{}',
  playbook_response_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_journey_templates_active ON journey_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_journey_items_template_order ON journey_items(journey_template_id, order_index);
CREATE INDEX IF NOT EXISTS idx_user_journey_progress_user ON user_journey_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_journey_progress_template ON user_journey_progress(template_id);
CREATE INDEX IF NOT EXISTS idx_user_journey_progress_journey_id ON user_journey_progress(journey_id);
CREATE INDEX IF NOT EXISTS idx_user_journey_responses_user ON user_journey_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_journey_responses_journey_id ON user_journey_responses(journey_id);
CREATE INDEX IF NOT EXISTS idx_user_journey_responses_step_id ON user_journey_responses(step_id);
