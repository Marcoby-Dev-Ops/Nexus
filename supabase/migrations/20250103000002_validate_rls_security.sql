-- Validate RLS Security Implementation
-- Tests for proper Row Level Security policies

-- =====================================================
-- 1. CHECK RLS IS ENABLED ON ALL TABLES
-- =====================================================

DO $$
DECLARE
    table_record RECORD;
    rls_disabled_tables TEXT[] := '{}';
BEGIN
    -- Check each table for RLS
    FOR table_record IN 
        SELECT tablename, rowsecurity 
        FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename NOT LIKE 'pg_%'
        AND tablename NOT LIKE 'sql_%'
    LOOP
        IF NOT table_record.rowsecurity THEN
            rls_disabled_tables := array_append(rls_disabled_tables, table_record.tablename);
        END IF;
    END LOOP;

    -- Report results
    IF array_length(rls_disabled_tables, 1) > 0 THEN
        RAISE WARNING 'RLS NOT ENABLED on tables: %', array_to_string(rls_disabled_tables, ', ');
    ELSE
        RAISE NOTICE 'SUCCESS: RLS is enabled on all public tables';
    END IF;
END $$;

-- =====================================================
-- 2. CHECK FOR OVERLY PERMISSIVE POLICIES
-- =====================================================

-- Find policies that might be too permissive
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check,
    CASE 
        WHEN qual IS NULL OR qual = 'true' OR qual = '(true)' THEN 'PERMISSIVE_SELECT'
        WHEN with_check IS NULL OR with_check = 'true' OR with_check = '(true)' THEN 'PERMISSIVE_MODIFY'
        ELSE 'SECURE'
    END as security_status
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY security_status DESC, tablename, policyname;

-- =====================================================
-- 3. CHECK AUTH FUNCTIONS ARE AVAILABLE
-- =====================================================

-- Verify auth helper functions exist
SELECT 
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines 
WHERE routine_schema = 'auth' 
AND routine_name IN ('is_company_admin', 'get_user_company_id');

-- =====================================================
-- 4. VALIDATE POLICY COVERAGE
-- =====================================================

-- Check that all important tables have policies
WITH table_policies AS (
    SELECT 
        tablename,
        COUNT(*) as policy_count,
        array_agg(DISTINCT cmd) as commands_covered
    FROM pg_policies 
    WHERE schemaname = 'public'
    GROUP BY tablename
),
important_tables AS (
    SELECT unnest(ARRAY[
        'user_profiles', 'companies', 'contacts', 'deals', 
        'chat_sessions', 'chat_messages', 'integrations',
        'usage_quotas', 'billing_subscriptions'
    ]) as tablename
)
SELECT 
    it.tablename,
    COALESCE(tp.policy_count, 0) as policy_count,
    COALESCE(tp.commands_covered, '{}') as commands_covered,
    CASE 
        WHEN tp.policy_count IS NULL THEN 'NO_POLICIES'
        WHEN tp.policy_count < 2 THEN 'INSUFFICIENT_POLICIES'
        ELSE 'ADEQUATELY_PROTECTED'
    END as protection_status
FROM important_tables it
LEFT JOIN table_policies tp ON it.tablename = tp.tablename
ORDER BY protection_status DESC, it.tablename;

-- =====================================================
-- 5. SECURITY RECOMMENDATIONS
-- =====================================================

-- Create a view for security monitoring
CREATE OR REPLACE VIEW security_policy_summary AS
SELECT 
    p.schemaname,
    p.tablename,
    COUNT(*) as total_policies,
    COUNT(*) FILTER (WHERE p.cmd = 'SELECT') as select_policies,
    COUNT(*) FILTER (WHERE p.cmd = 'INSERT') as insert_policies,
    COUNT(*) FILTER (WHERE p.cmd = 'UPDATE') as update_policies,
    COUNT(*) FILTER (WHERE p.cmd = 'DELETE') as delete_policies,
    COUNT(*) FILTER (WHERE p.cmd = 'ALL') as all_policies,
    bool_and(t.rowsecurity) as rls_enabled
FROM pg_policies p
JOIN pg_tables t ON p.tablename = t.tablename AND p.schemaname = t.schemaname
WHERE p.schemaname = 'public'
GROUP BY p.schemaname, p.tablename, t.rowsecurity
ORDER BY p.tablename;

-- Grant access to security view for admins
GRANT SELECT ON security_policy_summary TO authenticated;

-- =====================================================
-- 6. CREATE SECURITY CHECK FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION check_rls_security()
RETURNS TABLE (
    check_name TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Check 1: RLS enabled on all tables
    RETURN QUERY
    SELECT 
        'RLS_ENABLED' as check_name,
        CASE 
            WHEN COUNT(*) FILTER (WHERE NOT rowsecurity) = 0 THEN 'PASS'
            ELSE 'FAIL'
        END as status,
        CASE 
            WHEN COUNT(*) FILTER (WHERE NOT rowsecurity) = 0 
            THEN 'All tables have RLS enabled'
            ELSE 'Tables without RLS: ' || string_agg(tablename, ', ') FILTER (WHERE NOT rowsecurity)
        END as details
    FROM pg_tables 
    WHERE schemaname = 'public' AND tablename NOT LIKE 'pg_%';

    -- Check 2: No overly permissive policies
    RETURN QUERY
    SELECT 
        'NO_PERMISSIVE_POLICIES' as check_name,
        CASE 
            WHEN COUNT(*) = 0 THEN 'PASS'
            ELSE 'FAIL'
        END as status,
        CASE 
            WHEN COUNT(*) = 0 
            THEN 'No overly permissive policies found'
            ELSE 'Permissive policies found: ' || COUNT(*)::TEXT
        END as details
    FROM pg_policies 
    WHERE schemaname = 'public'
    AND (qual IS NULL OR qual = 'true' OR qual = '(true)' 
         OR with_check IS NULL OR with_check = 'true' OR with_check = '(true)');

    -- Check 3: Auth functions available
    RETURN QUERY
    SELECT 
        'AUTH_FUNCTIONS' as check_name,
        CASE 
            WHEN COUNT(*) >= 2 THEN 'PASS'
            ELSE 'FAIL'
        END as status,
        'Auth functions available: ' || COUNT(*)::TEXT as details
    FROM information_schema.routines 
    WHERE routine_schema = 'auth' 
    AND routine_name IN ('is_company_admin', 'get_user_company_id');

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION check_rls_security() TO authenticated;

-- =====================================================
-- 7. RUN SECURITY VALIDATION
-- =====================================================

-- Execute the security check
SELECT * FROM check_rls_security();

-- Final validation message
SELECT 
    'RLS Security Validation Complete' as status,
    NOW() as checked_at,
    'Check the results above for any security issues' as note; 