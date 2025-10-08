-- 005_core_functions.sql
-- Foundational database functions & extensions used by later migrations.
-- This file should run very early so triggers defined in subsequent migrations succeed.

-- Enable required extensions (idempotent).
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- provides gen_random_uuid()
-- If any legacy migrations rely on uuid_generate_v4(), also enable uuid-ossp (safe to include)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Generic trigger function to keep updated_at current.
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 'Generic trigger function to auto-bump updated_at timestamp on row update.';
