-- Migration: create table to audit PII access events
CREATE TABLE IF NOT EXISTS pii_access_audit (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL, -- Changed from UUID to match user_profiles.user_id
  actor_id VARCHAR(255) NULL, -- Changed from UUID to match user_profiles.user_id
  endpoint text NOT NULL,
  field text NOT NULL,
  exposed boolean NOT NULL DEFAULT false,
  ip inet NULL,
  user_agent text NULL,
  meta jsonb NULL,
  created_at timestamptz DEFAULT now()
);

-- Index to query recent access by user
CREATE INDEX IF NOT EXISTS idx_pii_audit_user_id_created_at ON pii_access_audit (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pii_audit_actor_id ON pii_access_audit (actor_id);
