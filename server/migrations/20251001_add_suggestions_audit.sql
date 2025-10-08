-- Migration: Add suggestions audit table for AI-applied changes
CREATE TABLE IF NOT EXISTS suggestions_audit (
  id BIGSERIAL PRIMARY KEY,
  source_message_id UUID,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  user_id UUID NOT NULL,
  suggested_changes JSONB NOT NULL,
  before_snapshot JSONB,
  after_snapshot JSONB,
  confidence NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_suggestions_audit_target ON suggestions_audit (target_type, target_id);
