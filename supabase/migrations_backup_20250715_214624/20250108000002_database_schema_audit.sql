-- Database Schema Audit Migration
-- This migration will audit your current database schema and report what exists

-- Create a function to audit the database schema
CREATE OR REPLACE FUNCTION audit_database_schema()
RETURNS TABLE (
    table_name TEXT,
    column_name TEXT,
    data_type TEXT,
    is_nullable TEXT,
    column_default TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.table_name::TEXT,
        c.column_name::TEXT,
        c.data_type::TEXT,
        c.is_nullable::TEXT,
        COALESCE(c.column_default::TEXT, 'NULL') as column_default
    FROM information_schema.tables t
    JOIN information_schema.columns c ON t.table_name = c.table_name
    WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
    AND c.table_schema = 'public'
    ORDER BY t.table_name, c.ordinal_position;
END;
$$ LANGUAGE plpgsql;

-- Create a function to check RLS status
CREATE OR REPLACE FUNCTION check_rls_status()
RETURNS TABLE (
    table_name TEXT,
    rls_enabled BOOLEAN,
    policy_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.tablename::TEXT,
        t.rowsecurity as rls_enabled,
        COALESCE(p.policy_count, 0)::INTEGER as policy_count
    FROM pg_tables t
    LEFT JOIN (
        SELECT tablename, COUNT(*) as policy_count
        FROM pg_policies 
        WHERE schemaname = 'public'
        GROUP BY tablename
    ) p ON t.tablename = p.tablename
    WHERE t.schemaname = 'public'
    ORDER BY t.tablename;
END;
$$ LANGUAGE plpgsql;

-- Run the audit and display results
DO $$
DECLARE
    audit_record RECORD;
    rls_record RECORD;
BEGIN
    RAISE NOTICE '=== DATABASE SCHEMA AUDIT ===';
    RAISE NOTICE '';
    
    -- Show all tables and their columns
    RAISE NOTICE 'Tables and Columns:';
    FOR audit_record IN 
        SELECT * FROM audit_database_schema()
        ORDER BY table_name, column_name
    LOOP
        RAISE NOTICE 'Table: %, Column: %, Type: %, Nullable: %, Default: %', 
            audit_record.table_name, 
            audit_record.column_name, 
            audit_record.data_type, 
            audit_record.is_nullable, 
            audit_record.column_default;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== RLS STATUS ===';
    
    -- Show RLS status for each table
    FOR rls_record IN 
        SELECT * FROM check_rls_status()
        ORDER BY table_name
    LOOP
        RAISE NOTICE 'Table: %, RLS Enabled: %, Policy Count: %', 
            rls_record.table_name, 
            rls_record.rls_enabled, 
            rls_record.policy_count;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== RECOMMENDATIONS ===';
    RAISE NOTICE '1. Review the schema above to identify which tables need RLS policies';
    RAISE NOTICE '2. Note the column naming conventions (snake_case vs camelCase)';
    RAISE NOTICE '3. Create targeted policies based on the actual schema';
END $$;

-- Clean up audit functions
DROP FUNCTION IF EXISTS audit_database_schema();
DROP FUNCTION IF EXISTS check_rls_status(); 