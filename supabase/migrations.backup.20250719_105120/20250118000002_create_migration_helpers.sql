-- Migration Helpers for Safer Database Changes
-- Provides utility functions to handle partial migrations and rollbacks

-- Function to safely add columns
CREATE OR REPLACE FUNCTION safe_add_column(
    p_table_name TEXT,
    p_column_name TEXT,
    p_column_definition TEXT
)
RETURNS VOID AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = p_table_name
        AND column_name = p_column_name
    ) THEN
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN %I %s', 
                      p_table_name, p_column_name, p_column_definition);
        RAISE NOTICE 'Added column % to table %', p_column_name, p_table_name;
    ELSE
        RAISE NOTICE 'Column % already exists in table %, skipping', p_column_name, p_table_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to safely add constraints
CREATE OR REPLACE FUNCTION safe_add_constraint(
    p_table_name TEXT,
    p_constraint_name TEXT,
    p_constraint_definition TEXT
)
RETURNS VOID AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = p_constraint_name
        AND conrelid = format('public.%I', p_table_name)::regclass
    ) THEN
        EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I %s', 
                      p_table_name, p_constraint_name, p_constraint_definition);
        RAISE NOTICE 'Added constraint % to table %', p_constraint_name, p_table_name;
    ELSE
        RAISE NOTICE 'Constraint % already exists on table %, skipping', p_constraint_name, p_table_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to safely create tables
CREATE OR REPLACE FUNCTION safe_create_table(
    p_table_name TEXT,
    p_table_definition TEXT
)
RETURNS VOID AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = p_table_name
    ) THEN
        EXECUTE format('CREATE TABLE public.%I (%s)', p_table_name, p_table_definition);
        RAISE NOTICE 'Created table %', p_table_name;
    ELSE
        RAISE NOTICE 'Table % already exists, skipping', p_table_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to safely create indexes
CREATE OR REPLACE FUNCTION safe_create_index(
    p_index_name TEXT,
    p_table_name TEXT,
    p_index_definition TEXT
)
RETURNS VOID AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = p_index_name
        AND tablename = p_table_name
        AND schemaname = 'public'
    ) THEN
        EXECUTE format('CREATE INDEX %I ON public.%I (%s)', 
                      p_index_name, p_table_name, p_index_definition);
        RAISE NOTICE 'Created index % on table %', p_index_name, p_table_name;
    ELSE
        RAISE NOTICE 'Index % already exists on table %, skipping', p_index_name, p_table_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to check migration status
CREATE OR REPLACE FUNCTION check_migration_status(migration_name TEXT)
RETURNS TABLE(
    table_exists BOOLEAN,
    columns_missing TEXT[],
    constraints_missing TEXT[],
    indexes_missing TEXT[]
) AS $$
DECLARE
    expected_columns TEXT[] := ARRAY[]::TEXT[];
    expected_constraints TEXT[] := ARRAY[]::TEXT[];
    expected_indexes TEXT[] := ARRAY[]::TEXT[];
    missing_columns TEXT[] := ARRAY[]::TEXT[];
    missing_constraints TEXT[] := ARRAY[]::TEXT[];
    missing_indexes TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- This would be populated based on the specific migration
    -- For now, return empty arrays
    RETURN QUERY SELECT 
        true as table_exists,
        missing_columns as columns_missing,
        missing_constraints as constraints_missing,
        missing_indexes as indexes_missing;
END;
$$ LANGUAGE plpgsql;

-- Migration tracking table for better visibility
CREATE TABLE IF NOT EXISTS public.migration_checks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    migration_name TEXT NOT NULL,
    check_type TEXT NOT NULL, -- 'table', 'column', 'constraint', 'index'
    target_name TEXT NOT NULL,
    status TEXT NOT NULL, -- 'exists', 'missing', 'error'
    checked_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

-- Function to record migration check results
CREATE OR REPLACE FUNCTION record_migration_check(
    migration_name TEXT,
    check_type TEXT,
    target_name TEXT,
    status TEXT,
    notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.migration_checks (
        migration_name, check_type, target_name, status, notes
    ) VALUES (
        migration_name, check_type, target_name, status, notes
    );
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION safe_add_column(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION safe_add_constraint(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION safe_create_table(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION safe_create_index(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_migration_status(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION record_migration_check(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION safe_add_column(TEXT, TEXT, TEXT) IS 'Safely adds a column to a table if it does not exist';
COMMENT ON FUNCTION safe_add_constraint(TEXT, TEXT, TEXT) IS 'Safely adds a constraint to a table if it does not exist';
COMMENT ON FUNCTION safe_create_table(TEXT, TEXT) IS 'Safely creates a table if it does not exist';
COMMENT ON FUNCTION safe_create_index(TEXT, TEXT, TEXT) IS 'Safely creates an index if it does not exist';
COMMENT ON TABLE public.migration_checks IS 'Tracks the status of migration checks for debugging and monitoring'; 