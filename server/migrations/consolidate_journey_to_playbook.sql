-- Consolidate Journey Templates into Playbook System
-- This migration aligns the journey system with the playbook system
-- since "Journey Templates are playbooks"

-- Step 1: Migrate journey templates to playbook templates
INSERT INTO playbook_templates (id, name, description, version, is_active, category, estimated_duration_hours, prerequisites, created_at, updated_at)
SELECT 
  id,
  title as name,
  description,
  version,
  is_active,
  CASE 
    WHEN title LIKE '%Onboarding%' THEN 'onboarding'
    WHEN title LIKE '%Building Blocks%' THEN 'foundation'
    WHEN title LIKE '%Revenue%' THEN 'revenue'
    WHEN title LIKE '%Automation%' THEN 'automation'
    ELSE 'general'
  END as category,
  CASE 
    WHEN title LIKE '%Onboarding%' THEN 1
    WHEN title LIKE '%Building Blocks%' THEN 2
    WHEN title LIKE '%Revenue%' THEN 3
    WHEN title LIKE '%Automation%' THEN 2
    ELSE 1
  END as estimated_duration_hours,
  '[]'::jsonb as prerequisites,
  created_at,
  updated_at
FROM journey_templates 
WHERE id NOT IN (SELECT id FROM playbook_templates);

-- Step 2: Migrate journey items to playbook items
-- Map 'question' type to 'step' to comply with playbook_items check constraint
INSERT INTO playbook_items (id, playbook_id, name, description, item_type, order_index, is_required, estimated_duration_minutes, validation_schema, component_name, metadata, created_at, updated_at)
SELECT 
  ji.id,
  ji.journey_template_id as playbook_id,
  ji.name,
  ji.description,
  CASE 
    WHEN ji.item_type = 'question' THEN 'step'
    ELSE ji.item_type
  END as item_type,
  ji.order_index,
  COALESCE(ji.is_required, ji.required, true) as is_required,
  ji.estimated_duration_minutes,
  COALESCE(ji.validation_schema, '{}'::jsonb) as validation_schema,
  ji.component_name,
  COALESCE(ji.metadata, '{}'::jsonb) as metadata,
  ji.created_at,
  ji.updated_at
FROM journey_items ji
WHERE ji.journey_template_id IN (SELECT id FROM playbook_templates)
AND ji.id NOT IN (SELECT id FROM playbook_items);

-- Step 3: Migrate user journey progress to user playbook progress
-- Note: user_playbook_progress uses current_item_id instead of current_item_index
INSERT INTO user_playbook_progress (id, user_id, organization_id, playbook_id, current_item_id, progress_percentage, status, started_at, completed_at, metadata, created_at, updated_at)
SELECT 
  ujp.id,
  ujp.user_id,
  ujp.organization_id,
  ujp.journey_template_id as playbook_id,
  -- Try to find the current item based on current_step/current_item_index
  (SELECT pi.id FROM playbook_items pi 
   WHERE pi.playbook_id = ujp.journey_template_id 
   AND pi.order_index = COALESCE(ujp.current_item_index, ujp.current_step, 0)
   LIMIT 1) as current_item_id,
  COALESCE(ujp.progress_percentage, 0) as progress_percentage,
  COALESCE(ujp.status, 'in_progress') as status,
  ujp.started_at,
  ujp.completed_at,
  COALESCE(ujp.metadata, '{}'::jsonb) as metadata,
  ujp.created_at,
  ujp.updated_at
FROM user_journey_progress ujp
WHERE ujp.journey_template_id IN (SELECT id FROM playbook_templates)
AND ujp.id NOT IN (SELECT id FROM user_playbook_progress);

-- Step 4: Migrate user journey responses to user playbook responses
-- Note: user_playbook_responses doesn't have updated_at column
INSERT INTO user_playbook_responses (id, user_id, organization_id, playbook_id, item_id, response_data, completed_at, created_at)
SELECT 
  ujr.id,
  ujr.user_id,
  ujr.organization_id,
  ujr.journey_template_id as playbook_id,
  ujr.item_id as item_id, -- Use item_id directly since it's the correct UUID type
  COALESCE(ujr.response_data, '{}'::jsonb) as response_data,
  ujr.completed_at,
  ujr.created_at
FROM user_journey_responses ujr
WHERE ujr.journey_template_id IN (SELECT id FROM playbook_templates)
AND ujr.id NOT IN (SELECT id FROM user_playbook_responses);

-- Step 5: Update any existing references in the system
-- (This will be handled by the application code)

-- Step 6: Create a mapping table for backward compatibility (optional)
CREATE TABLE IF NOT EXISTS journey_playbook_mapping (
  journey_template_id UUID PRIMARY KEY,
  playbook_template_id UUID NOT NULL REFERENCES playbook_templates(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO journey_playbook_mapping (journey_template_id, playbook_template_id)
SELECT 
  jt.id as journey_template_id,
  jt.id as playbook_template_id
FROM journey_templates jt
WHERE jt.id IN (SELECT id FROM playbook_templates)
ON CONFLICT (journey_template_id) DO NOTHING;

-- Step 7: Add any missing columns to playbook_templates to support journey features
ALTER TABLE playbook_templates 
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS complexity VARCHAR(50) DEFAULT 'beginner',
ADD COLUMN IF NOT EXISTS success_metrics JSONB DEFAULT '[]'::jsonb;

-- Update the migrated templates with journey-specific data
UPDATE playbook_templates 
SET 
  priority = jt.priority,
  complexity = 'beginner',
  success_metrics = '[]'::jsonb
FROM journey_templates jt
WHERE playbook_templates.id = jt.id;

-- Step 8: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_playbook_templates_priority ON playbook_templates(priority);
CREATE INDEX IF NOT EXISTS idx_playbook_templates_complexity ON playbook_templates(complexity);
CREATE INDEX IF NOT EXISTS idx_user_playbook_progress_user_playbook ON user_playbook_progress(user_id, playbook_id);
CREATE INDEX IF NOT EXISTS idx_user_playbook_responses_user_playbook ON user_playbook_responses(user_id, playbook_id);
