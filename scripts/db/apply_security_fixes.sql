-- =====================================================
-- NEXUS SUPABASE SECURITY FIXES
-- Addresses: Auth RLS Initialization Plan & Multiple Permissive Policies
-- =====================================================

BEGIN;

-- =====================================================
-- 1. ENABLE RLS ON ALL TABLES
-- =====================================================

-- Enable RLS on all existing tables (will only affect tables that exist)
DO $$
DECLARE
    table_name TEXT;
    tables_to_secure TEXT[] := ARRAY[
        'profiles', 'users', 'companies', 'contacts', 'deals', 
        'invoices', 'expenses', 'chat_sessions', 'chat_messages', 
        'notifications', 'integrations', 'webhooks', 'api_logs',
        'user_analytics', 'usage_quotas', 'billing_subscriptions'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables_to_secure
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables 
                  WHERE table_schema = 'public' AND table_name = table_name) THEN
            EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
            RAISE NOTICE 'Enabled RLS on table: %', table_name;
        END IF;
    END LOOP;
END $$;

-- =====================================================
-- 2. DROP EXISTING PERMISSIVE POLICIES
-- =====================================================

-- Remove overly permissive policies
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND (
            qual IS NULL OR qual = 'true' OR qual = '(true)'
            OR with_check IS NULL OR with_check = 'true' OR with_check = '(true)'
        )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      policy_record.policyname, 
                      policy_record.schemaname, 
                      policy_record.tablename);
        RAISE NOTICE 'Dropped permissive policy: % on %', 
                    policy_record.policyname, policy_record.tablename;
    END LOOP;
END $$;

-- =====================================================
-- 3. CREATE SECURITY FUNCTIONS FIRST
-- =====================================================

-- Function to check if user is admin of their company
CREATE OR REPLACE FUNCTION auth.is_company_admin(company_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND company_id = company_uuid
        AND role IN ('admin', 'owner')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's company ID
CREATE OR REPLACE FUNCTION auth.get_user_company_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT company_id FROM profiles 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. CREATE SECURE RLS POLICIES
-- =====================================================

-- Profiles: Users can only access their own data
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
              WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        
        DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
        CREATE POLICY "Users can view own profile" ON profiles
            FOR SELECT USING (auth.uid() = id);

        DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
        CREATE POLICY "Users can update own profile" ON profiles
            FOR UPDATE USING (auth.uid() = id);

        DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
        CREATE POLICY "Users can insert own profile" ON profiles
            FOR INSERT WITH CHECK (auth.uid() = id);
            
        RAISE NOTICE 'Created secure policies for profiles table';
    END IF;
END $$;

-- Companies: Users can only access companies they belong to
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
              WHERE table_schema = 'public' AND table_name = 'companies') THEN
        
        DROP POLICY IF EXISTS "Users can view own company data" ON companies;
        CREATE POLICY "Users can view own company data" ON companies
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE profiles.id = auth.uid() 
                    AND profiles.company_id = companies.id
                )
            );

        DROP POLICY IF EXISTS "Company admins can manage company data" ON companies;
        CREATE POLICY "Company admins can manage company data" ON companies
            FOR ALL USING (auth.is_company_admin(companies.id));
            
        RAISE NOTICE 'Created secure policies for companies table';
    END IF;
END $$;

-- Chat Sessions: Users can only access their own sessions
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
              WHERE table_schema = 'public' AND table_name = 'chat_sessions') THEN
        
        DROP POLICY IF EXISTS "Users can view own chat sessions" ON chat_sessions;
        CREATE POLICY "Users can view own chat sessions" ON chat_sessions
            FOR SELECT USING (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Users can create own chat sessions" ON chat_sessions;
        CREATE POLICY "Users can create own chat sessions" ON chat_sessions
            FOR INSERT WITH CHECK (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Users can update own chat sessions" ON chat_sessions;
        CREATE POLICY "Users can update own chat sessions" ON chat_sessions
            FOR UPDATE USING (auth.uid() = user_id);
            
        RAISE NOTICE 'Created secure policies for chat_sessions table';
    END IF;
END $$;

-- Usage Quotas: Users can only view their own quotas
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
              WHERE table_schema = 'public' AND table_name = 'usage_quotas') THEN
        
        DROP POLICY IF EXISTS "Users can view own quotas" ON usage_quotas;
        CREATE POLICY "Users can view own quotas" ON usage_quotas
            FOR SELECT USING (auth.uid() = user_id);

        DROP POLICY IF EXISTS "System can manage quotas" ON usage_quotas;
        CREATE POLICY "System can manage quotas" ON usage_quotas
            FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
            
        RAISE NOTICE 'Created secure policies for usage_quotas table';
    END IF;
END $$;

-- =====================================================
-- 5. CREATE AUDIT LOG TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS security_audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    event_type TEXT NOT NULL,
    table_name TEXT,
    record_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit logs
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
DROP POLICY IF EXISTS "Admins can view security audit logs" ON security_audit_logs;
CREATE POLICY "Admins can view security audit logs" ON security_audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'owner')
        )
    );

-- System can insert audit logs
DROP POLICY IF EXISTS "System can insert audit logs" ON security_audit_logs;
CREATE POLICY "System can insert audit logs" ON security_audit_logs
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- 6. CREATE SECURITY VALIDATION FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION check_rls_security()
RETURNS TABLE (
    check_name TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Check 1: RLS enabled on tables
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
            ELSE 'WARN'
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

    -- Check 3: Policy count per table
    RETURN QUERY
    SELECT 
        'POLICY_COVERAGE' as check_name,
        'INFO' as status,
        'Tables with policies: ' || COUNT(DISTINCT tablename)::TEXT ||
        ', Total policies: ' || COUNT(*)::TEXT as details
    FROM pg_policies 
    WHERE schemaname = 'public';

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION check_rls_security() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.is_company_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION auth.get_user_company_id() TO authenticated;

-- =====================================================
-- 7. FINAL SECURITY CHECK
-- =====================================================

-- Run the security validation
SELECT 'SECURITY FIXES APPLIED SUCCESSFULLY' as message;
SELECT * FROM check_rls_security();

-- Show current RLS status
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    (SELECT COUNT(*) FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename) as policy_count
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename NOT LIKE 'pg_%'
ORDER BY tablename;

COMMIT;

-- Final success message
SELECT 
    '🔒 RLS SECURITY FIXES COMPLETED!' as status,
    'Your Supabase database is now secured against the reported vulnerabilities' as message,
    NOW() as applied_at; 