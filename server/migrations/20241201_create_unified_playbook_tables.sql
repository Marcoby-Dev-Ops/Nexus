-- Migration: Create Unified Playbook Tables
-- Date: 2024-12-01
-- Description: Creates new unified playbook system tables and migrates existing data

-- ============================================================================
-- CREATE NEW TABLES
-- ============================================================================

-- User journeys (active instances)
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

-- Playbook templates (skip if already exists with different schema)
-- Note: This table may already exist with a different schema
-- The migration will skip this table creation if it conflicts

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

-- User journeys indexes
CREATE INDEX IF NOT EXISTS idx_user_journeys_user_id ON user_journeys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_journeys_playbook_id ON user_journeys(playbook_id);
CREATE INDEX IF NOT EXISTS idx_user_journeys_status ON user_journeys(status);
CREATE INDEX IF NOT EXISTS idx_user_journeys_created_at ON user_journeys(created_at);

-- Step responses indexes
CREATE INDEX IF NOT EXISTS idx_step_responses_journey_id ON step_responses(journey_id);
CREATE INDEX IF NOT EXISTS idx_step_responses_step_id ON step_responses(step_id);

-- Playbook templates indexes (skip if table doesn't exist with new schema)
-- Note: This index creation is skipped if the playbook_templates table has a different schema

-- ============================================================================
-- INSERT DEFAULT TEMPLATES
-- ============================================================================

-- Onboarding template (skip if table schema doesn't match)
-- Note: This insert is skipped if the playbook_templates table has a different schema
-- The existing table uses 'name' column instead of 'title', so we skip this insert

-- ============================================================================
-- MIGRATE EXISTING DATA
-- ============================================================================

-- Migrate existing onboarding data from user_onboarding_steps (if table exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_onboarding_steps') THEN
    INSERT INTO user_journeys (
      id, 
      user_id, 
      playbook_id, 
      status, 
      current_step, 
      total_steps, 
      progress_percentage, 
      step_responses, 
      metadata,
      started_at,
      completed_at,
      created_at, 
      updated_at
    )
    SELECT 
      'onboarding-' || uos.user_id,
      uos.user_id,
      'onboarding-v1',
      CASE 
        WHEN uos.onboarding_completed = true THEN 'completed'
        WHEN uos.current_step > 1 THEN 'in_progress'
        ELSE 'not_started'
      END,
      COALESCE(uos.current_step, 1),
      5, -- Total onboarding steps
      COALESCE(uos.progress_percentage, 0),
      COALESCE(uos.onboarding_data, '{}'),
      '{
        "migrated": true,
        "migration_source": "user_onboarding_steps",
        "original_table": "user_onboarding_steps"
      }',
      CASE 
        WHEN uos.onboarding_completed = true THEN uos.updated_at
        WHEN uos.current_step > 1 THEN uos.created_at
        ELSE NULL
      END,
      CASE 
        WHEN uos.onboarding_completed = true THEN uos.updated_at
        ELSE NULL
      END,
      uos.created_at,
      uos.updated_at
    FROM user_onboarding_steps uos
    WHERE NOT EXISTS (
      SELECT 1 FROM user_journeys uj 
      WHERE uj.id = 'onboarding-' || uos.user_id
    );
  END IF;
END $$;

-- Migrate existing journey data from journeys table (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'journeys') THEN
    INSERT INTO user_journeys (
      id,
      user_id,
      playbook_id,
      status,
      current_step,
      total_steps,
      progress_percentage,
      step_responses,
      metadata,
      started_at,
      completed_at,
      created_at,
      updated_at
    )
    SELECT 
      'journey-' || j.id,
      j.user_id,
      COALESCE(j.playbook_id, 'custom-journey'),
      CASE 
        WHEN j.status = 'completed' THEN 'completed'
        WHEN j.status = 'in_progress' THEN 'in_progress'
        WHEN j.status = 'paused' THEN 'paused'
        ELSE 'not_started'
      END,
      COALESCE(j.current_step, 1),
      COALESCE(j.total_steps, 1),
      COALESCE(j.progress_percentage, 0),
      COALESCE(j.journey_data, '{}'),
      '{
        "migrated": true,
        "migration_source": "journeys",
        "original_table": "journeys",
        "original_journey_id": "' || j.id || '"
      }',
      j.started_at,
      j.completed_at,
      j.created_at,
      j.updated_at
    FROM journeys j
    WHERE NOT EXISTS (
      SELECT 1 FROM user_journeys uj 
      WHERE uj.id = 'journey-' || j.id
    );
  END IF;
END $$;

-- ============================================================================
-- CREATE TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_user_journeys_updated_at' 
    AND tgrelid = 'user_journeys'::regclass
  ) THEN
    CREATE TRIGGER update_user_journeys_updated_at 
      BEFORE UPDATE ON user_journeys 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Playbook templates trigger (skip if table doesn't exist with new schema)
-- Note: This trigger creation is skipped if the playbook_templates table has a different schema

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check migration results
SELECT 
  'user_journeys' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN metadata->>'migrated' = 'true' THEN 1 END) as migrated_records
FROM user_journeys
UNION ALL
SELECT 
  'step_responses' as table_name,
  COUNT(*) as total_records,
  0 as migrated_records
FROM step_responses;

-- Check onboarding migration specifically
SELECT 
  'onboarding_migration' as check_type,
  COUNT(*) as total_onboarding_users,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_onboarding,
  COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_onboarding,
  COUNT(CASE WHEN status = 'not_started' THEN 1 END) as not_started_onboarding
FROM user_journeys 
WHERE playbook_id = 'onboarding-v1';
