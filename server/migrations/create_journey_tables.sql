-- Update journey-related tables for the journeys edge function
-- This migration works with existing schema and adds missing data

-- Update journey_templates table structure if needed
ALTER TABLE journey_templates 
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;

-- Update journey_items table structure if needed  
ALTER TABLE journey_items 
ADD COLUMN IF NOT EXISTS required BOOLEAN DEFAULT true;

-- Update user_journey_progress table structure if needed
ALTER TABLE user_journey_progress 
ADD COLUMN IF NOT EXISTS current_item_index INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'in_progress';

-- Update user_journey_responses table structure if needed
ALTER TABLE user_journey_responses 
ADD COLUMN IF NOT EXISTS response_data JSONB DEFAULT '{}';

-- Create indexes for performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_journey_templates_active ON journey_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_journey_items_template_order ON journey_items(journey_template_id, order_index);
CREATE INDEX IF NOT EXISTS idx_user_journey_progress_user ON user_journey_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_journey_progress_template ON user_journey_progress(journey_template_id);
CREATE INDEX IF NOT EXISTS idx_user_journey_responses_user ON user_journey_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_journey_responses_template ON user_journey_responses(journey_template_id);

-- Update existing journey templates with priority if they don't have it
UPDATE journey_templates 
SET priority = 1 
WHERE priority IS NULL OR priority = 0;

-- Insert sample journey items for the first existing template (if none exist)
INSERT INTO journey_items (journey_template_id, name, description, order_index, item_type, is_required) 
SELECT 
  jt.id,
  'Welcome to Nexus',
  'Let us know about your business goals',
  1,
  'question',
  true
FROM journey_templates jt 
WHERE jt.title = 'Nexus Business Onboarding Journey'
AND NOT EXISTS (
  SELECT 1 FROM journey_items ji 
  WHERE ji.journey_template_id = jt.id 
  AND ji.name = 'Welcome to Nexus'
);

INSERT INTO journey_items (journey_template_id, name, description, order_index, item_type, is_required) 
SELECT 
  jt.id,
  'Business Profile',
  'Tell us about your business',
  2,
  'question',
  true
FROM journey_templates jt 
WHERE jt.title = 'Nexus Business Onboarding Journey'
AND NOT EXISTS (
  SELECT 1 FROM journey_items ji 
  WHERE ji.journey_template_id = jt.id 
  AND ji.name = 'Business Profile'
);

INSERT INTO journey_items (journey_template_id, name, description, order_index, item_type, is_required) 
SELECT 
  jt.id,
  'Team Setup',
  'Set up your team structure',
  3,
  'task',
  true
FROM journey_templates jt 
WHERE jt.title = 'Nexus Business Onboarding Journey'
AND NOT EXISTS (
  SELECT 1 FROM journey_items ji 
  WHERE ji.journey_template_id = jt.id 
  AND ji.name = 'Team Setup'
);

INSERT INTO journey_items (journey_template_id, name, description, order_index, item_type, is_required) 
SELECT 
  jt.id,
  'First Integration',
  'Connect your first business tool',
  4,
  'task',
  true
FROM journey_templates jt 
WHERE jt.title = 'Nexus Business Onboarding Journey'
AND NOT EXISTS (
  SELECT 1 FROM journey_items ji 
  WHERE ji.journey_template_id = jt.id 
  AND ji.name = 'First Integration'
);

INSERT INTO journey_items (journey_template_id, name, description, order_index, item_type, is_required) 
SELECT 
  jt.id,
  'Complete Setup',
  'Review and complete your setup',
  5,
  'milestone',
  true
FROM journey_templates jt 
WHERE jt.title = 'Nexus Business Onboarding Journey'
AND NOT EXISTS (
  SELECT 1 FROM journey_items ji 
  WHERE ji.journey_template_id = jt.id 
  AND ji.name = 'Complete Setup'
);
