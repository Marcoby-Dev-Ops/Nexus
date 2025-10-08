-- Renamed from 20251001_create_platform_audit_table.sql
-- Generic platform audit table for recording events across Nexus

CREATE TABLE IF NOT EXISTS platform_audit (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL,
  object_type text NULL,
  object_id uuid NULL,
  actor_id uuid NULL,
  target_user_id uuid NULL,
  endpoint text NULL,
  ip inet NULL,
  user_agent text NULL,
  data jsonb NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_audit_event_type_created_at ON platform_audit (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_audit_actor_id ON platform_audit (actor_id);
CREATE INDEX IF NOT EXISTS idx_platform_audit_target_user_id ON platform_audit (target_user_id);
