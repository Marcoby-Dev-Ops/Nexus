-- Create Policy Inheritance System
-- This migration creates the template functions for applying standardized policies

-- ====================================================================
-- STEP 1: CREATE POLICY INHERITANCE FUNCTIONS
-- ====================================================================

-- Function to apply user-level policies (for tables with user_id column)
CREATE OR REPLACE FUNCTION apply_user_level_policies(table_name TEXT)
RETURNS VOID AS $$
DECLARE
    has_user_id BOOLEAN;
    has_deleted_at BOOLEAN;
BEGIN
    -- Check if table has user_id column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = apply_user_level_policies.table_name 
        AND column_name = 'user_id'
    ) INTO has_user_id;
    
    -- Check if table has deleted_at column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = apply_user_level_policies.table_name 
        AND column_name = 'deleted_at'
    ) INTO has_deleted_at;
    
    IF NOT has_user_id THEN
        RAISE EXCEPTION 'Table % does not have user_id column', table_name;
    END IF;
    
    -- Drop existing policies
    EXECUTE format('DROP POLICY IF EXISTS "%s_select_policy" ON public.%I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "%s_insert_policy" ON public.%I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "%s_update_policy" ON public.%I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "%s_delete_policy" ON public.%I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "%s_service_role_policy" ON public.%I', table_name, table_name);
    
    -- Create SELECT policy
    IF has_deleted_at THEN
        EXECUTE format('CREATE POLICY "%s_select_policy" ON public.%I FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL)', table_name, table_name);
    ELSE
        EXECUTE format('CREATE POLICY "%s_select_policy" ON public.%I FOR SELECT USING (auth.uid() = user_id)', table_name, table_name);
    END IF;
    
    -- Create INSERT policy
    EXECUTE format('CREATE POLICY "%s_insert_policy" ON public.%I FOR INSERT WITH CHECK (auth.uid() = user_id)', table_name, table_name);
    
    -- Create UPDATE policy
    IF has_deleted_at THEN
        EXECUTE format('CREATE POLICY "%s_update_policy" ON public.%I FOR UPDATE USING (auth.uid() = user_id AND deleted_at IS NULL)', table_name, table_name);
    ELSE
        EXECUTE format('CREATE POLICY "%s_update_policy" ON public.%I FOR UPDATE USING (auth.uid() = user_id)', table_name, table_name);
    END IF;
    
    -- Create DELETE policy
    IF has_deleted_at THEN
        EXECUTE format('CREATE POLICY "%s_delete_policy" ON public.%I FOR DELETE USING (auth.uid() = user_id AND deleted_at IS NULL)', table_name, table_name);
    ELSE
        EXECUTE format('CREATE POLICY "%s_delete_policy" ON public.%I FOR DELETE USING (auth.uid() = user_id)', table_name, table_name);
    END IF;
    
    -- Create service role policy
    EXECUTE format('CREATE POLICY "%s_service_role_policy" ON public.%I FOR ALL USING (auth.role() = ''service_role'')', table_name, table_name);
    
    RAISE NOTICE 'Applied user-level policies to table: %', table_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to apply company-level policies (for tables with company_id column)
CREATE OR REPLACE FUNCTION apply_company_level_policies(table_name TEXT)
RETURNS VOID AS $$
DECLARE
    has_company_id BOOLEAN;
    has_deleted_at BOOLEAN;
BEGIN
    -- Check if table has company_id column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = apply_company_level_policies.table_name 
        AND column_name = 'company_id'
    ) INTO has_company_id;
    
    -- Check if table has deleted_at column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = apply_company_level_policies.table_name 
        AND column_name = 'deleted_at'
    ) INTO has_deleted_at;
    
    IF NOT has_company_id THEN
        RAISE EXCEPTION 'Table % does not have company_id column', table_name;
    END IF;
    
    -- Drop existing policies
    EXECUTE format('DROP POLICY IF EXISTS "%s_select_policy" ON public.%I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "%s_insert_policy" ON public.%I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "%s_update_policy" ON public.%I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "%s_delete_policy" ON public.%I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "%s_service_role_policy" ON public.%I', table_name, table_name);
    
    -- Create SELECT policy
    IF has_deleted_at THEN
        EXECUTE format('CREATE POLICY "%s_select_policy" ON public.%I FOR SELECT USING (company_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid()) AND deleted_at IS NULL)', table_name, table_name);
    ELSE
        EXECUTE format('CREATE POLICY "%s_select_policy" ON public.%I FOR SELECT USING (company_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid()))', table_name, table_name);
    END IF;
    
    -- Create INSERT policy
    EXECUTE format('CREATE POLICY "%s_insert_policy" ON public.%I FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid()))', table_name, table_name);
    
    -- Create UPDATE policy
    IF has_deleted_at THEN
        EXECUTE format('CREATE POLICY "%s_update_policy" ON public.%I FOR UPDATE USING (company_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid()) AND deleted_at IS NULL)', table_name, table_name);
    ELSE
        EXECUTE format('CREATE POLICY "%s_update_policy" ON public.%I FOR UPDATE USING (company_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid()))', table_name, table_name);
    END IF;
    
    -- Create DELETE policy
    IF has_deleted_at THEN
        EXECUTE format('CREATE POLICY "%s_delete_policy" ON public.%I FOR DELETE USING (company_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid()) AND deleted_at IS NULL)', table_name, table_name);
    ELSE
        EXECUTE format('CREATE POLICY "%s_delete_policy" ON public.%I FOR DELETE USING (company_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid()))', table_name, table_name);
    END IF;
    
    -- Create service role policy
    EXECUTE format('CREATE POLICY "%s_service_role_policy" ON public.%I FOR ALL USING (auth.role() = ''service_role'')', table_name, table_name);
    
    RAISE NOTICE 'Applied company-level policies to table: %', table_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to apply hybrid policies (for tables with both user_id and company_id)
CREATE OR REPLACE FUNCTION apply_hybrid_policies(table_name TEXT)
RETURNS VOID AS $$
DECLARE
    has_user_id BOOLEAN;
    has_company_id BOOLEAN;
    has_deleted_at BOOLEAN;
BEGIN
    -- Check if table has both user_id and company_id columns
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = apply_hybrid_policies.table_name 
        AND column_name = 'user_id'
    ) INTO has_user_id;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = apply_hybrid_policies.table_name 
        AND column_name = 'company_id'
    ) INTO has_company_id;
    
    -- Check if table has deleted_at column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = apply_hybrid_policies.table_name 
        AND column_name = 'deleted_at'
    ) INTO has_deleted_at;
    
    IF NOT has_user_id OR NOT has_company_id THEN
        RAISE EXCEPTION 'Table % does not have both user_id and company_id columns', table_name;
    END IF;
    
    -- Drop existing policies
    EXECUTE format('DROP POLICY IF EXISTS "%s_select_policy" ON public.%I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "%s_insert_policy" ON public.%I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "%s_update_policy" ON public.%I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "%s_delete_policy" ON public.%I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "%s_service_role_policy" ON public.%I', table_name, table_name);
    
    -- Create SELECT policy (user can access their own data OR company data)
    IF has_deleted_at THEN
        EXECUTE format('CREATE POLICY "%s_select_policy" ON public.%I FOR SELECT USING ((auth.uid() = user_id OR company_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid())) AND deleted_at IS NULL)', table_name, table_name);
    ELSE
        EXECUTE format('CREATE POLICY "%s_select_policy" ON public.%I FOR SELECT USING (auth.uid() = user_id OR company_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid()))', table_name, table_name);
    END IF;
    
    -- Create INSERT policy
    EXECUTE format('CREATE POLICY "%s_insert_policy" ON public.%I FOR INSERT WITH CHECK (auth.uid() = user_id)', table_name, table_name);
    
    -- Create UPDATE policy
    IF has_deleted_at THEN
        EXECUTE format('CREATE POLICY "%s_update_policy" ON public.%I FOR UPDATE USING ((auth.uid() = user_id OR company_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid())) AND deleted_at IS NULL)', table_name, table_name);
    ELSE
        EXECUTE format('CREATE POLICY "%s_update_policy" ON public.%I FOR UPDATE USING (auth.uid() = user_id OR company_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid()))', table_name, table_name);
    END IF;
    
    -- Create DELETE policy
    IF has_deleted_at THEN
        EXECUTE format('CREATE POLICY "%s_delete_policy" ON public.%I FOR DELETE USING ((auth.uid() = user_id OR company_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid())) AND deleted_at IS NULL)', table_name, table_name);
    ELSE
        EXECUTE format('CREATE POLICY "%s_delete_policy" ON public.%I FOR DELETE USING (auth.uid() = user_id OR company_id IN (SELECT company_id FROM user_profiles WHERE id = auth.uid()))', table_name, table_name);
    END IF;
    
    -- Create service role policy
    EXECUTE format('CREATE POLICY "%s_service_role_policy" ON public.%I FOR ALL USING (auth.role() = ''service_role'')', table_name, table_name);
    
    RAISE NOTICE 'Applied hybrid policies to table: %', table_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to apply read-only policies (for analytics/logging tables)
CREATE OR REPLACE FUNCTION apply_readonly_policies(table_name TEXT)
RETURNS VOID AS $$
BEGIN
    -- Drop existing policies
    EXECUTE format('DROP POLICY IF EXISTS "%s_select_policy" ON public.%I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "%s_insert_policy" ON public.%I', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "%s_service_role_policy" ON public.%I', table_name, table_name);
    
    -- Create SELECT policy (authenticated users can read)
    EXECUTE format('CREATE POLICY "%s_select_policy" ON public.%I FOR SELECT USING (auth.role() = ''authenticated'')', table_name, table_name);
    
    -- Create INSERT policy (authenticated users can insert)
    EXECUTE format('CREATE POLICY "%s_insert_policy" ON public.%I FOR INSERT WITH CHECK (auth.role() = ''authenticated'')', table_name, table_name);
    
    -- Create service role policy (full access)
    EXECUTE format('CREATE POLICY "%s_service_role_policy" ON public.%I FOR ALL USING (auth.role() = ''service_role'')', table_name, table_name);
    
    RAISE NOTICE 'Applied read-only policies to table: %', table_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- STEP 2: CREATE MANAGEMENT FUNCTIONS
-- ====================================================================

-- Function to list all policies
CREATE OR REPLACE FUNCTION list_policy_summary()
RETURNS TABLE (
    table_name TEXT,
    policy_name TEXT,
    command TEXT,
    condition TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.tablename::TEXT,
        p.policyname::TEXT,
        p.cmd::TEXT,
        COALESCE(p.qual, p.with_check)::TEXT
    FROM pg_policies p
    WHERE p.schemaname = 'public'
    ORDER BY p.tablename, p.policyname;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate policy coverage
CREATE OR REPLACE FUNCTION validate_policy_coverage()
RETURNS TABLE (
    table_name TEXT,
    has_rls BOOLEAN,
    policy_count INTEGER,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.tablename::TEXT,
        t.rowsecurity,
        COUNT(p.policyname)::INTEGER,
        CASE 
            WHEN NOT t.rowsecurity THEN 'RLS_DISABLED'
            WHEN COUNT(p.policyname) = 0 THEN 'NO_POLICIES'
            WHEN COUNT(p.policyname) < 3 THEN 'INCOMPLETE'
            ELSE 'COMPLETE'
        END::TEXT
    FROM pg_tables t
    LEFT JOIN pg_policies p ON t.tablename = p.tablename AND p.schemaname = 'public'
    WHERE t.schemaname = 'public' AND t.tablename NOT LIKE 'pg_%'
    GROUP BY t.tablename, t.rowsecurity
    ORDER BY t.tablename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- STEP 3: GRANT PERMISSIONS
-- ====================================================================

-- Grant execute permissions on all functions
GRANT EXECUTE ON FUNCTION apply_user_level_policies(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION apply_company_level_policies(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION apply_hybrid_policies(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION apply_readonly_policies(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION list_policy_summary() TO service_role;
GRANT EXECUTE ON FUNCTION validate_policy_coverage() TO service_role;

-- Grant execute permissions to authenticated users for read functions
GRANT EXECUTE ON FUNCTION list_policy_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION validate_policy_coverage() TO authenticated; 