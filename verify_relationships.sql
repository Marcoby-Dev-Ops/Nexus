-- =====================================================
-- MANUAL RELATIONSHIP VERIFICATION QUERIES
-- Run these queries to verify your database relationships
-- =====================================================

-- =====================================================
-- 1. CHECK ALL TABLES AND THEIR RELATIONSHIPS
-- =====================================================

-- Get all tables with their relationship status
SELECT 
    t.table_name,
    CASE 
        WHEN fk.table_name IS NOT NULL THEN 'HAS_RELATIONSHIPS'
        ELSE 'NO_RELATIONSHIPS'
    END as relationship_status,
    COUNT(fk.table_name) as relationship_count
FROM information_schema.tables t
LEFT JOIN (
    SELECT DISTINCT tc.table_name
    FROM information_schema.table_constraints tc
    WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
) fk ON t.table_name = fk.table_name
WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
    AND t.table_name NOT IN ('pg_stat_statements', 'pg_stat_statements_info')
GROUP BY t.table_name, fk.table_name
ORDER BY relationship_status, table_name;

-- =====================================================
-- 2. CHECK ALL FOREIGN KEY RELATIONSHIPS
-- =====================================================

-- Get all foreign key relationships
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_schema AS foreign_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- =====================================================
-- 3. CHECK USER_ID RELATIONSHIPS SPECIFICALLY
-- =====================================================

-- Check which tables have user_id columns
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND column_name = 'user_id'
ORDER BY table_name;

-- Check user_id foreign key constraints
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_schema AS foreign_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    CASE 
        WHEN ccu.table_schema = 'auth' AND ccu.table_name = 'users' THEN 'CORRECT'
        ELSE 'INCORRECT'
    END as user_relationship_status
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND kcu.column_name = 'user_id'
ORDER BY tc.table_name;

-- =====================================================
-- 4. CHECK COMPANY_ID RELATIONSHIPS
-- =====================================================

-- Check company_id foreign key constraints
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_schema AS foreign_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    CASE 
        WHEN ccu.table_name = 'companies' THEN 'CORRECT'
        ELSE 'INCORRECT'
    END as company_relationship_status
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND kcu.column_name = 'company_id'
ORDER BY tc.table_name;

-- =====================================================
-- 5. CHECK RLS POLICIES
-- =====================================================

-- Check which tables have RLS enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Count policies per table
SELECT 
    tablename,
    COUNT(*) as policy_count,
    STRING_AGG(policyname, ', ' ORDER BY policyname) as policies
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- =====================================================
-- 6. CHECK INDEXES FOR PERFORMANCE
-- =====================================================

-- Check indexes on user_id columns
SELECT 
    t.table_name,
    i.indexname,
    i.indexdef
FROM information_schema.tables t
JOIN pg_indexes i ON t.table_name = i.tablename
WHERE t.table_schema = 'public'
    AND i.indexdef LIKE '%user_id%'
ORDER BY t.table_name;

-- Check indexes on company_id columns
SELECT 
    t.table_name,
    i.indexname,
    i.indexdef
FROM information_schema.tables t
JOIN pg_indexes i ON t.table_name = i.tablename
WHERE t.table_schema = 'public'
    AND i.indexdef LIKE '%company_id%'
ORDER BY t.table_name;

-- =====================================================
-- 7. TEST RELATIONSHIP INTEGRITY
-- =====================================================

-- Test a join query to verify relationships work
SELECT 
    'user_profiles' as table_name,
    COUNT(*) as record_count
FROM user_profiles up
JOIN companies c ON up.company_id = c.id
WHERE up.user_id IS NOT NULL;

-- Test another join query
SELECT 
    'user_integrations' as table_name,
    COUNT(*) as record_count
FROM user_integrations ui
JOIN integrations i ON ui.integration_id = i.id
WHERE ui.user_id IS NOT NULL;

-- =====================================================
-- 8. SUMMARY REPORT
-- =====================================================

-- Generate a summary report
SELECT 
    'DATABASE RELATIONSHIP SUMMARY' as report_section,
    COUNT(DISTINCT t.table_name) as total_tables,
    COUNT(DISTINCT fk.table_name) as tables_with_relationships,
    COUNT(DISTINCT CASE WHEN fk.table_name IS NULL THEN t.table_name END) as tables_without_relationships
FROM information_schema.tables t
LEFT JOIN (
    SELECT DISTINCT tc.table_name
    FROM information_schema.table_constraints tc
    WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
) fk ON t.table_name = fk.table_name
WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
    AND t.table_name NOT IN ('pg_stat_statements', 'pg_stat_statements_info');

-- =====================================================
-- 9. QUICK VERIFICATION QUERIES
-- =====================================================

-- Quick check: How many tables have user_id columns?
SELECT COUNT(*) as tables_with_user_id
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND column_name = 'user_id';

-- Quick check: How many tables have company_id columns?
SELECT COUNT(*) as tables_with_company_id
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND column_name = 'company_id';

-- Quick check: How many foreign key constraints exist?
SELECT COUNT(*) as total_foreign_keys
FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY' 
    AND table_schema = 'public';

-- Quick check: How many tables have RLS enabled?
SELECT COUNT(*) as tables_with_rls
FROM pg_tables 
WHERE schemaname = 'public' 
    AND rowsecurity = true; 