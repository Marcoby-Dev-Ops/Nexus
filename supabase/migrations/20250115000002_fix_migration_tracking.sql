-- Fix migration tracking for 20250115000001_production_chat_optimization.sql
-- This migration ensures that the previous migration is properly tracked as applied

-- Insert the migration record if it doesn't exist
INSERT INTO supabase_migrations.schema_migrations(version, name, statements)
SELECT 
    '20250115000001',
    'production_chat_optimization',
    '-- Migration already applied'
WHERE NOT EXISTS (
    SELECT 1 FROM supabase_migrations.schema_migrations 
    WHERE version = '20250115000001'
); 