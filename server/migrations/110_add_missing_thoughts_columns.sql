-- Renamed from 104_add_missing_thoughts_columns.sql
-- Purpose: Add missing non-destructive columns and indexes to thoughts table

BEGIN;

ALTER TABLE IF EXISTS thoughts
  ADD COLUMN IF NOT EXISTS personal_or_professional TEXT DEFAULT 'professional',
  ADD COLUMN IF NOT EXISTS main_sub_categories JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS initiative BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS impact TEXT;

ALTER TABLE IF EXISTS thoughts
  ADD COLUMN IF NOT EXISTS parent_idea_id UUID,
  ADD COLUMN IF NOT EXISTS workflow_stage TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS estimated_effort TEXT;

ALTER TABLE IF EXISTS thoughts
  ADD COLUMN IF NOT EXISTS ai_clarification_data JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS ai_insights JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS interaction_method TEXT DEFAULT 'text';

ALTER TABLE IF EXISTS thoughts
  ADD COLUMN IF NOT EXISTS fire_phase TEXT,
  ADD COLUMN IF NOT EXISTS fire_assessment JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS initiative_type TEXT,
  ADD COLUMN IF NOT EXISTS estimated_completion TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS actual_completion TIMESTAMPTZ;

ALTER TABLE IF EXISTS thoughts
  ADD COLUMN IF NOT EXISTS blockers TEXT[],
  ADD COLUMN IF NOT EXISTS next_steps TEXT[],
  ADD COLUMN IF NOT EXISTS success_metrics TEXT[],
  ADD COLUMN IF NOT EXISTS business_impact TEXT,
  ADD COLUMN IF NOT EXISTS risk_assessment TEXT,
  ADD COLUMN IF NOT EXISTS cost_estimate NUMERIC,
  ADD COLUMN IF NOT EXISTS timeline_estimate TEXT,
  ADD COLUMN IF NOT EXISTS stakeholder_analysis JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS resource_requirements JSONB DEFAULT '{}'::jsonb;

ALTER TABLE IF EXISTS thoughts
  ADD COLUMN IF NOT EXISTS dependencies UUID[],
  ADD COLUMN IF NOT EXISTS related_initiatives UUID[],
  ADD COLUMN IF NOT EXISTS confidence_score NUMERIC,
  ADD COLUMN IF NOT EXISTS progress_percentage NUMERIC,
  ADD COLUMN IF NOT EXISTS velocity_score NUMERIC,
  ADD COLUMN IF NOT EXISTS quality_score NUMERIC,
  ADD COLUMN IF NOT EXISTS last_assessment_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS assessment_version INTEGER;

ALTER TABLE IF EXISTS thoughts
  ADD COLUMN IF NOT EXISTS creation_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_updated TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS createdat TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updatedat TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'idx_thoughts_parent_idea_id'
  ) THEN
    CREATE INDEX idx_thoughts_parent_idea_id ON thoughts(parent_idea_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'idx_thoughts_company_id'
  ) THEN
    CREATE INDEX idx_thoughts_company_id ON thoughts(company_id);
  END IF;
END$$;

COMMIT;
