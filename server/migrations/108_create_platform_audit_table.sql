-- Migration: create generic platform audit table for recording events across Nexus
CREATE TABLE IF NOT EXISTS platform_audit (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL, -- e.g., 'pii_access', 'apply_suggestion', 'db_insert', 'db_update', 'login', etc.
  object_type text NULL, -- e.g., 'company', 'identity', 'user_profiles'
  object_id uuid NULL,
  actor_id VARCHAR(255) NULL, -- Changed from UUID to match user_profiles.user_id
  target_user_id VARCHAR(255) NULL, -- Changed from UUID to match user_profiles.user_id
  endpoint text NULL,
  ip inet NULL,
  user_agent text NULL,
  data jsonb NULL, -- arbitrary event payload (before/after fields, diff, metadata)
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_audit_event_type_created_at ON platform_audit (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_audit_actor_id ON platform_audit (actor_id);
CREATE INDEX IF NOT EXISTS idx_platform_audit_target_user_id ON platform_audit (target_user_id);
