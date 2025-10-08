-- Script to simplify user management by removing external user mapping table
-- This script should be run after the migration file is applied

-- Check if external_user_mappings table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'external_user_mappings') THEN
        RAISE NOTICE 'External user mappings table exists - running migration...';
        
        -- Run the migration
        \i server/src/database/migrations/005_simplify_user_management.sql;
        
        RAISE NOTICE 'Migration completed successfully!';
    ELSE
        RAISE NOTICE 'External user mappings table does not exist - migration not needed.';
    END IF;
END $$;

-- Verify the changes
SELECT 
    'users' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('id', 'external_user_id', 'email')
ORDER BY column_name;

SELECT 
    'user_profiles' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN ('id', 'user_id', 'external_user_id')
ORDER BY column_name;

-- Check if external_user_mappings table was dropped
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'external_user_mappings') 
        THEN 'WARNING: external_user_mappings table still exists!'
        ELSE 'SUCCESS: external_user_mappings table was dropped successfully.'
    END as migration_status;
