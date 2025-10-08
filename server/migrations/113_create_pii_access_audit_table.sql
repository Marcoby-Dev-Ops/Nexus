-- Renamed from 20251001_create_pii_access_audit_table.sql
-- Table to audit PII access events

CREATE TABLE IF NOT EXISTS pii_access_audit (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  actor_id uuid NULL,
  endpoint text NOT NULL,
  field text NOT NULL,
  exposed boolean NOT NULL DEFAULT false,
  ip inet NULL,
  user_agent text NULL,
  meta jsonb NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pii_audit_user_id_created_at ON pii_access_audit (user_id, created_at DESC);
