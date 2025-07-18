/**
 * Utility to generate SQL for a new integration data table with standard columns.
 * Usage: generateDataTableSQL('emails')
 */
export function generateDataTableSQL(tableName: string): string {
  return `CREATE TABLE IF NOT EXISTS ${tableName} (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    integration_id TEXT REFERENCES integrations(id) ON DELETE CASCADE,
    source_id TEXT,
    raw_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    external_url TEXT,
    status TEXT,
    tags TEXT[]
  );`;
} 