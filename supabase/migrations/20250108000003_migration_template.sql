-- Migration Template with Safety Checks
-- Use this template for future migrations to avoid conflicts

-- Template for adding columns safely
CREATE OR REPLACE FUNCTION safe_add_column(
    table_name TEXT,
    column_name TEXT,
    column_definition TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    -- Check if table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = safe_add_column.table_name
    ) THEN
        RAISE NOTICE 'Table % does not exist, skipping column addition', table_name;
        RETURN FALSE;
    END IF;
    
    -- Check if column already exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = safe_add_column.table_name
        AND column_name = safe_add_column.column_name
    ) THEN
        RAISE NOTICE 'Column %.% already exists, skipping', table_name, column_name;
        RETURN FALSE;
    END IF;
    
    -- Add the column
    EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s', table_name, column_name, column_definition);
    RAISE NOTICE 'Successfully added column %.%', table_name, column_name;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Template for creating policies safely
CREATE OR REPLACE FUNCTION safe_create_policy(
    table_name TEXT,
    policy_name TEXT,
    operation TEXT,
    using_clause TEXT,
    with_check_clause TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    -- Check if table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = safe_create_policy.table_name
    ) THEN
        RAISE NOTICE 'Table % does not exist, skipping policy creation', table_name;
        RETURN FALSE;
    END IF;
    
    -- Check if policy already exists
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = safe_create_policy.table_name
        AND policyname = safe_create_policy.policy_name
    ) THEN
        RAISE NOTICE 'Policy % already exists on table %, skipping', policy_name, table_name;
        RETURN FALSE;
    END IF;
    
    -- Create the policy
    EXECUTE format(
        'CREATE POLICY %I ON %I FOR %s USING (%s)',
        policy_name, table_name, operation, using_clause
    );
    
    IF with_check_clause IS NOT NULL THEN
        EXECUTE format(
            'ALTER POLICY %I ON %I WITH CHECK (%s)',
            policy_name, table_name, with_check_clause
        );
    END IF;
    
    RAISE NOTICE 'Successfully created policy % on table %', policy_name, table_name;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- SELECT safe_add_column('companies', 'new_field', 'TEXT');
-- SELECT safe_create_policy('companies', 'test_policy', 'SELECT', 'true');

-- Clean up template functions (uncomment when done)
-- DROP FUNCTION IF EXISTS safe_add_column(TEXT, TEXT, TEXT);
-- DROP FUNCTION IF EXISTS safe_create_policy(TEXT, TEXT, TEXT, TEXT, TEXT); 