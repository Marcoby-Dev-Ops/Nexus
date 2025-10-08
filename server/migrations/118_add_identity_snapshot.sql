-- 118_add_identity_snapshot.sql
-- Adds identity_snapshot JSONB column to user_profiles for storing raw external identity payloads.

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS identity_snapshot JSONB;

COMMENT ON COLUMN user_profiles.identity_snapshot IS 'Raw latest external identity (e.g., Authentik userinfo) for auditing/debugging.';
