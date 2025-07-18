-- Core Integrations Foundation Migration
-- 1. Integrations Catalog
CREATE TABLE IF NOT EXISTS integrations (
  id TEXT PRIMARY KEY, -- e.g. 'google-workspace', 'dropbox', etc.
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Data Field to Table/Column Mapping
CREATE TABLE IF NOT EXISTS integration_data_mappings (
  id SERIAL PRIMARY KEY,
  integration_id TEXT REFERENCES integrations(id) ON DELETE CASCADE,
  data_field TEXT NOT NULL, -- e.g. 'emails', 'files', 'tickets'
  nexus_table TEXT NOT NULL, -- e.g. 'emails', 'files', etc.
  nexus_column TEXT NOT NULL DEFAULT 'raw_json', -- column in the table
  transformation TEXT, -- optional transformation/normalization logic
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Sync Status Tracking
CREATE TABLE IF NOT EXISTS integration_sync_status (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  integration_id TEXT REFERENCES integrations(id) ON DELETE CASCADE,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  next_sync_at TIMESTAMP WITH TIME ZONE,
  status TEXT, -- 'idle', 'syncing', 'error'
  error TEXT,
  data_points_synced INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Standard Data Table Template (for auto-generation)
--
-- All integration data tables should use the following standard columns and naming conventions:
--   - Table name: plural, snake_case (e.g., emails, files, contacts)
--   - Columns:
--       id              BIGSERIAL PRIMARY KEY
--       user_id         UUID NOT NULL
--       integration_id  TEXT REFERENCES integrations(id) ON DELETE CASCADE
--       source_id       TEXT -- unique ID from provider
--       raw_json        JSONB NOT NULL -- full provider data
--       created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
--       updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
--       synced_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
--       external_url    TEXT -- (optional) direct link to provider
--       status          TEXT -- (optional) e.g., for tickets, tasks
--       tags            TEXT[] -- (optional)
--
-- Example:
-- CREATE TABLE IF NOT EXISTS emails (
--   id BIGSERIAL PRIMARY KEY,
--   user_id UUID NOT NULL,
--   integration_id TEXT REFERENCES integrations(id) ON DELETE CASCADE,
--   source_id TEXT,
--   raw_json JSONB NOT NULL,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--   synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--   external_url TEXT,
--   status TEXT,
--   tags TEXT[]
-- );
--
-- Utility: To auto-generate a new table, use the above template and replace the table name. 