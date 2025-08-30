-- Migration: Migrate Remaining Legacy Data to Unified Playbook System
-- Date: 2024-12-01
-- Description: Migrates remaining legacy tables to the unified playbook system
-- ============================================================================
-- PHASE 1: MIGRATE JOURNEY TEMPLATES TO PLAYBOOK TEMPLATES
-- ============================================================================

-- Migrate journey_templates to playbook_templates
INSERT INTO playbook_templates (id, title, description, steps, metadata, created_at, updated_at)
SELECT 
  jt.id,
  jt.title,
  jt.description,
  -- Convert journey_items to unified steps format
  COALESCE(
    (SELECT jsonb_agg(
      jsonb_build_object(
        'id', ji.id::text,
        'title', ji.name,
        'description', ji.description,
        'component', ji.component_name,
        'isRequired', COALESCE(ji.is_required, false),
        'orderIndex', ji.order_index,
        'estimatedDuration', ji.estimated_duration_minutes,
        'validationSchema', COALESCE(ji.validation_schema, '{}'::jsonb),
        'metadata', COALESCE(ji.metadata, '{}'::jsonb)
      ) ORDER BY ji.order_index
    )
    FROM journey_items ji 
    WHERE ji.journey_template_id = jt.id),
    '[]'::jsonb
  ) as steps,
  jsonb_build_object(
    'version', jt.version,
    'isActive', jt.is_active,
    'priority', jt.priority,
    'migratedFrom', 'journey_templates',
    'migrationDate', now()::text,
    'originalId', jt.id::text
  ) as metadata,
  jt.created_at,
  jt.updated_at
FROM journey_templates jt
WHERE NOT EXISTS (
  SELECT 1 FROM playbook_templates pt WHERE pt.id = jt.id
);

-- ============================================================================
-- PHASE 2: MIGRATE PLAYBOOK ITEMS TO UNIFIED TEMPLATES
-- ============================================================================

-- Migrate playbook_items to existing playbook_templates
UPDATE playbook_templates 
SET 
  steps = COALESCE(
    (SELECT jsonb_agg(
      jsonb_build_object(
        'id', pi.id::text,
        'title', pi.name,
        'description', pi.description,
        'component', pi.component_name,
        'isRequired', COALESCE(pi.is_required, false),
        'orderIndex', pi.order_index,
        'estimatedDuration', pi.estimated_duration_minutes,
        'validationSchema', COALESCE(pi.validation_schema, '{}'::jsonb),
        'metadata', COALESCE(pi.metadata, '{}'::jsonb)
      ) ORDER BY pi.order_index
    )
    FROM playbook_items pi 
    WHERE pi.playbook_id = playbook_templates.id),
    steps
  ),
  metadata = metadata || jsonb_build_object(
    'migratedPlaybookItems', true,
    'playbookItemsMigrationDate', now()::text
  ),
  updated_at = now()
WHERE EXISTS (
  SELECT 1 FROM playbook_items pi WHERE pi.playbook_id = playbook_templates.id
);

-- ============================================================================
-- PHASE 3: MIGRATE USER PROGRESS DATA
-- ============================================================================

-- Migrate user_playbook_progress to user_journeys
INSERT INTO user_journeys (id, user_id, playbook_id, status, current_step, total_steps, progress_percentage, step_responses, metadata, started_at, created_at, updated_at)
SELECT 
  gen_random_uuid()::text as id,
  upp.user_id::text,
  'legacy-playbook-' || upp.playbook_id::text as playbook_id,
  CASE 
    WHEN upp.completed_at IS NOT NULL THEN 'completed'
    WHEN upp.started_at IS NOT NULL THEN 'in_progress'
    ELSE 'not_started'
  END as status,
  COALESCE(upp.current_step, 1) as current_step,
  COALESCE(upp.total_steps, 1) as total_steps,
  COALESCE(upp.progress_percentage, 0.0) as progress_percentage,
  COALESCE(upp.responses, '{}'::jsonb) as step_responses,
  jsonb_build_object(
    'migratedFrom', 'user_playbook_progress',
    'migrationDate', now()::text,
    'originalId', upp.id::text,
    'startedAt', upp.started_at::text,
    'completedAt', upp.completed_at::text
  ) as metadata,
  upp.started_at,
  upp.created_at,
  upp.updated_at
FROM user_playbook_progress upp
WHERE NOT EXISTS (
  SELECT 1 FROM user_journeys uj 
  WHERE uj.metadata->>'originalId' = upp.id::text
);

-- Migrate user_onboarding_completions to user_journeys
INSERT INTO user_journeys (id, user_id, playbook_id, status, current_step, total_steps, progress_percentage, step_responses, metadata, started_at, completed_at, created_at, updated_at)
SELECT 
  gen_random_uuid()::text as id,
  uoc.user_id::text,
  'onboarding-v1' as playbook_id,
  CASE 
    WHEN uoc.completed_at IS NOT NULL THEN 'completed'
    ELSE 'in_progress'
  END as status,
  1 as current_step,
  1 as total_steps,
  100.0 as progress_percentage,
  '{}'::jsonb as step_responses,
  jsonb_build_object(
    'migratedFrom', 'user_onboarding_completions',
    'migrationDate', now()::text,
    'originalId', uoc.id::text,
    'completionType', uoc.completion_type,
    'completedAt', uoc.completed_at::text
  ) as metadata,
  uoc.created_at as started_at,
  uoc.completed_at,
  uoc.created_at,
  uoc.updated_at
FROM user_onboarding_completions uoc
WHERE NOT EXISTS (
  SELECT 1 FROM user_journeys uj 
  WHERE uj.metadata->>'originalId' = uoc.id::text
);

-- Migrate user_onboarding_phases to user_journeys
INSERT INTO user_journeys (id, user_id, playbook_id, status, current_step, total_steps, progress_percentage, step_responses, metadata, started_at, created_at, updated_at)
SELECT 
  gen_random_uuid()::text as id,
  uop.user_id::text,
  'onboarding-v1' as playbook_id,
  CASE 
    WHEN uop.completed_at IS NOT NULL THEN 'completed'
    WHEN uop.started_at IS NOT NULL THEN 'in_progress'
    ELSE 'not_started'
  END as status,
  COALESCE(uop.current_phase, 1) as current_step,
  COALESCE(uop.total_phases, 1) as total_steps,
  COALESCE(uop.progress_percentage, 0.0) as progress_percentage,
  COALESCE(uop.phase_responses, '{}'::jsonb) as step_responses,
  jsonb_build_object(
    'migratedFrom', 'user_onboarding_phases',
    'migrationDate', now()::text,
    'originalId', uop.id::text,
    'phaseType', uop.phase_type,
    'startedAt', uop.started_at::text,
    'completedAt', uop.completed_at::text
  ) as metadata,
  uop.started_at,
  uop.created_at,
  uop.updated_at
FROM user_onboarding_phases uop
WHERE NOT EXISTS (
  SELECT 1 FROM user_journeys uj 
  WHERE uj.metadata->>'originalId' = uop.id::text
);

-- ============================================================================
-- PHASE 4: MIGRATE MAPPING AND KNOWLEDGE DATA
-- ============================================================================

-- Migrate journey_playbook_mapping to playbook_templates metadata
UPDATE playbook_templates 
SET 
  metadata = metadata || jsonb_build_object(
    'journeyMappings', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'journeyId', jpm.journey_id::text,
          'playbookId', jpm.playbook_id::text,
          'mappingType', jpm.mapping_type,
          'priority', jpm.priority,
          'isActive', jpm.is_active
        )
      )
      FROM journey_playbook_mapping jpm 
      WHERE jpm.playbook_id = playbook_templates.id
    ),
    'journeyMappingsMigrationDate', now()::text
  ),
  updated_at = now()
WHERE EXISTS (
  SELECT 1 FROM journey_playbook_mapping jpm WHERE jpm.playbook_id = playbook_templates.id
);

-- Migrate playbook_knowledge_mappings to playbook_templates metadata
UPDATE playbook_templates 
SET 
  metadata = metadata || jsonb_build_object(
    'knowledgeMappings', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'knowledgeId', pkm.knowledge_id::text,
          'playbookId', pkm.playbook_id::text,
          'mappingType', pkm.mapping_type,
          'relevanceScore', pkm.relevance_score,
          'isActive', pkm.is_active
        )
      )
      FROM playbook_knowledge_mappings pkm 
      WHERE pkm.playbook_id = playbook_templates.id
    ),
    'knowledgeMappingsMigrationDate', now()::text
  ),
  updated_at = now()
WHERE EXISTS (
  SELECT 1 FROM playbook_knowledge_mappings pkm WHERE pkm.playbook_id = playbook_templates.id
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check migration results
SELECT 
  'journey_templates_migration' as migration_type,
  COUNT(*) as source_records,
  (SELECT COUNT(*) FROM playbook_templates WHERE metadata->>'migratedFrom' = 'journey_templates') as migrated_records
FROM journey_templates
UNION ALL
SELECT 
  'playbook_items_migration' as migration_type,
  COUNT(*) as source_records,
  (SELECT COUNT(*) FROM playbook_templates WHERE metadata->>'migratedPlaybookItems' = 'true') as migrated_records
FROM playbook_items
UNION ALL
SELECT 
  'user_playbook_progress_migration' as migration_type,
  COUNT(*) as source_records,
  (SELECT COUNT(*) FROM user_journeys WHERE metadata->>'migratedFrom' = 'user_playbook_progress') as migrated_records
FROM user_playbook_progress
UNION ALL
SELECT 
  'user_onboarding_completions_migration' as migration_type,
  COUNT(*) as source_records,
  (SELECT COUNT(*) FROM user_journeys WHERE metadata->>'migratedFrom' = 'user_onboarding_completions') as migrated_records
FROM user_onboarding_completions
UNION ALL
SELECT 
  'user_onboarding_phases_migration' as migration_type,
  COUNT(*) as source_records,
  (SELECT COUNT(*) FROM user_journeys WHERE metadata->>'migratedFrom' = 'user_onboarding_phases') as migrated_records
FROM user_onboarding_phases;

-- Check unified system totals
SELECT 
  'unified_playbook_templates' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN metadata->>'migratedFrom' IS NOT NULL THEN 1 END) as migrated_records
FROM playbook_templates
UNION ALL
SELECT 
  'unified_user_journeys' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN metadata->>'migratedFrom' IS NOT NULL THEN 1 END) as migrated_records
FROM user_journeys;
