-- ====================================================================
-- MIGRATE TO CENTRALIZED RLS SYSTEM
-- This script migrates all existing RLS policies to the centralized system
-- ====================================================================

-- ====================================================================
-- STEP 1: CREATE CENTRALIZED RLS FUNCTIONS
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
    
    -- Create service role policy (full access)
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
        EXECUTE format('CREATE POLICY "%s_select_policy" ON public.%I FOR SELECT USING (
            company_id IN (
                SELECT company_id 
                FROM user_profiles 
                WHERE user_profiles.id = auth.uid()
            ) AND deleted_at IS NULL
        )', table_name, table_name);
    ELSE
        EXECUTE format('CREATE POLICY "%s_select_policy" ON public.%I FOR SELECT USING (
            company_id IN (
                SELECT company_id 
                FROM user_profiles 
                WHERE user_profiles.id = auth.uid()
            )
        )', table_name, table_name);
    END IF;
    
    -- Create INSERT policy
    EXECUTE format('CREATE POLICY "%s_insert_policy" ON public.%I FOR INSERT WITH CHECK (auth.role() = ''authenticated'')', table_name, table_name);
    
    -- Create UPDATE policy
    IF has_deleted_at THEN
        EXECUTE format('CREATE POLICY "%s_update_policy" ON public.%I FOR UPDATE USING (
            company_id IN (
                SELECT company_id 
                FROM user_profiles 
                WHERE user_profiles.id = auth.uid()
            ) AND deleted_at IS NULL
        )', table_name, table_name);
    ELSE
        EXECUTE format('CREATE POLICY "%s_update_policy" ON public.%I FOR UPDATE USING (
            company_id IN (
                SELECT company_id 
                FROM user_profiles 
                WHERE user_profiles.id = auth.uid()
            )
        )', table_name, table_name);
    END IF;
    
    -- Create DELETE policy
    IF has_deleted_at THEN
        EXECUTE format('CREATE POLICY "%s_delete_policy" ON public.%I FOR DELETE USING (
            company_id IN (
                SELECT company_id 
                FROM user_profiles 
                WHERE user_profiles.id = auth.uid()
            ) AND deleted_at IS NULL
        )', table_name, table_name);
    ELSE
        EXECUTE format('CREATE POLICY "%s_delete_policy" ON public.%I FOR DELETE USING (
            company_id IN (
                SELECT company_id 
                FROM user_profiles 
                WHERE user_profiles.id = auth.uid()
            )
        )', table_name, table_name);
    END IF;
    
    -- Create service role policy (full access)
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
    
    -- Create SELECT policy (users can access their own data OR company data)
    IF has_deleted_at THEN
        EXECUTE format('CREATE POLICY "%s_select_policy" ON public.%I FOR SELECT USING (
            (auth.uid() = user_id OR company_id IN (
                SELECT company_id 
                FROM user_profiles 
                WHERE user_profiles.id = auth.uid()
            )) AND deleted_at IS NULL
        )', table_name, table_name);
    ELSE
        EXECUTE format('CREATE POLICY "%s_select_policy" ON public.%I FOR SELECT USING (
            auth.uid() = user_id OR company_id IN (
                SELECT company_id 
                FROM user_profiles 
                WHERE user_profiles.id = auth.uid()
            )
        )', table_name, table_name);
    END IF;
    
    -- Create INSERT policy
    EXECUTE format('CREATE POLICY "%s_insert_policy" ON public.%I FOR INSERT WITH CHECK (auth.uid() = user_id)', table_name, table_name);
    
    -- Create UPDATE policy
    IF has_deleted_at THEN
        EXECUTE format('CREATE POLICY "%s_update_policy" ON public.%I FOR UPDATE USING (
            (auth.uid() = user_id OR company_id IN (
                SELECT company_id 
                FROM user_profiles 
                WHERE user_profiles.id = auth.uid()
            )) AND deleted_at IS NULL
        )', table_name, table_name);
    ELSE
        EXECUTE format('CREATE POLICY "%s_update_policy" ON public.%I FOR UPDATE USING (
            auth.uid() = user_id OR company_id IN (
                SELECT company_id 
                FROM user_profiles 
                WHERE user_profiles.id = auth.uid()
            )
        )', table_name, table_name);
    END IF;
    
    -- Create DELETE policy
    IF has_deleted_at THEN
        EXECUTE format('CREATE POLICY "%s_delete_policy" ON public.%I FOR DELETE USING (
            (auth.uid() = user_id OR company_id IN (
                SELECT company_id 
                FROM user_profiles 
                WHERE user_profiles.id = auth.uid()
            )) AND deleted_at IS NULL
        )', table_name, table_name);
    ELSE
        EXECUTE format('CREATE POLICY "%s_delete_policy" ON public.%I FOR DELETE USING (
            auth.uid() = user_id OR company_id IN (
                SELECT company_id 
                FROM user_profiles 
                WHERE user_profiles.id = auth.uid()
            )
        )', table_name, table_name);
    END IF;
    
    -- Create service role policy (full access)
    EXECUTE format('CREATE POLICY "%s_service_role_policy" ON public.%I FOR ALL USING (auth.role() = ''service_role'')', table_name, table_name);
    
    RAISE NOTICE 'Applied hybrid policies to table: %', table_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to apply read-only policies (for analytics and logging tables)
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
-- STEP 2: ANALYZE CURRENT RLS SETUP
-- ====================================================================

-- Show current tables with RLS enabled
SELECT 
    t.tablename as table_name,
    t.rowsecurity as rls_enabled,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_schema = 'public' 
                    AND table_name = t.tablename 
                    AND column_name = 'user_id') THEN 'user_id'
        WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_schema = 'public' 
                    AND table_name = t.tablename 
                    AND column_name = 'company_id') THEN 'company_id'
        ELSE 'none'
    END as ownership_column
FROM pg_tables t 
WHERE t.schemaname = 'public' 
AND t.tablename NOT LIKE 'pg_%'
ORDER BY t.tablename;

-- Show current policies
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ====================================================================
-- STEP 2: DROP ALL EXISTING POLICIES
-- ====================================================================

-- Drop all existing policies to start fresh
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            policy_record.policyname, 
            policy_record.schemaname, 
            policy_record.tablename
        );
        RAISE NOTICE 'Dropped policy: % on %.%', 
            policy_record.policyname, 
            policy_record.schemaname, 
            policy_record.tablename;
    END LOOP;
END $$;

-- ====================================================================
-- STEP 3: APPLY CENTRALIZED POLICIES
-- ====================================================================

-- Apply user-level policies to tables with user_id
DO $$
DECLARE
    current_table TEXT;
BEGIN
    FOR current_table IN 
        SELECT t.tablename 
        FROM pg_tables t 
        WHERE t.schemaname = 'public' 
        AND EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = t.tablename 
            AND column_name = 'user_id'
        )
        AND t.tablename != 'user_profiles' -- Handle separately
    LOOP
        EXECUTE format('SELECT apply_user_level_policies(%L)', current_table);
        RAISE NOTICE 'Applied user-level policies to: %', current_table;
    END LOOP;
END $$;

-- Apply company-level policies to tables with company_id
DO $$
DECLARE
    current_table TEXT;
BEGIN
    FOR current_table IN 
        SELECT t.tablename 
        FROM pg_tables t 
        WHERE t.schemaname = 'public' 
        AND EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = t.tablename 
            AND column_name = 'company_id'
        )
        AND NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = t.tablename 
            AND column_name = 'user_id'
        )
    LOOP
        EXECUTE format('SELECT apply_company_level_policies(%L)', current_table);
        RAISE NOTICE 'Applied company-level policies to: %', current_table;
    END LOOP;
END $$;

-- Apply hybrid policies to tables with both user_id and company_id
DO $$
DECLARE
    current_table TEXT;
BEGIN
    FOR current_table IN 
        SELECT t.tablename 
        FROM pg_tables t 
        WHERE t.schemaname = 'public' 
        AND EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = t.tablename 
            AND column_name = 'user_id'
        )
        AND EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = t.tablename 
            AND column_name = 'company_id'
        )
    LOOP
        EXECUTE format('SELECT apply_hybrid_policies(%L)', current_table);
        RAISE NOTICE 'Applied hybrid policies to: %', current_table;
    END LOOP;
END $$;

-- Apply read-only policies to remaining tables
DO $$
DECLARE
    current_table TEXT;
BEGIN
    FOR current_table IN 
        SELECT t.tablename 
        FROM pg_tables t 
        WHERE t.schemaname = 'public' 
        AND NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = t.tablename 
            AND column_name = 'user_id'
        )
        AND NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = t.tablename 
            AND column_name = 'company_id'
        )
        AND t.tablename NOT IN ('user_profiles')
    LOOP
        EXECUTE format('SELECT apply_readonly_policies(%L)', current_table);
        RAISE NOTICE 'Applied read-only policies to: %', current_table;
    END LOOP;
END $$;

-- ====================================================================
-- STEP 4: SPECIAL HANDLING FOR SPECIFIC TABLES
-- ====================================================================

-- Handle user_profiles table (uses 'id' instead of 'user_id')
DROP POLICY IF EXISTS "user_profiles_select_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_delete_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_service_role_policy" ON public.user_profiles;

CREATE POLICY "user_profiles_select_policy" ON public.user_profiles 
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "user_profiles_insert_policy" ON public.user_profiles 
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "user_profiles_update_policy" ON public.user_profiles 
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "user_profiles_delete_policy" ON public.user_profiles 
    FOR DELETE USING (auth.uid() = id);

CREATE POLICY "user_profiles_service_role_policy" ON public.user_profiles 
    FOR ALL USING (auth.role() = 'service_role');

-- Handle public tables that should allow anonymous read access
DO $$
DECLARE
    public_table TEXT;
    public_tables TEXT[] := ARRAY[
        'billing_plans',
        'integration_status',
        'ai_action_card_templates'
    ];
BEGIN
    FOREACH public_table IN ARRAY public_tables
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables 
                  WHERE table_schema = 'public' AND table_name = public_table) THEN
            -- Drop existing policies
            EXECUTE format('DROP POLICY IF EXISTS "%s_select_policy" ON public.%I', public_table, public_table);
            EXECUTE format('DROP POLICY IF EXISTS "%s_insert_policy" ON public.%I', public_table, public_table);
            EXECUTE format('DROP POLICY IF EXISTS "%s_service_role_policy" ON public.%I', public_table, public_table);
            
            -- Create public read policies
            EXECUTE format('CREATE POLICY "%s_select_policy" ON public.%I FOR SELECT USING (true)', public_table, public_table);
            EXECUTE format('CREATE POLICY "%s_insert_policy" ON public.%I FOR INSERT WITH CHECK (auth.role() = ''authenticated'')', public_table, public_table);
            EXECUTE format('CREATE POLICY "%s_service_role_policy" ON public.%I FOR ALL USING (auth.role() = ''service_role'')', public_table, public_table);
            
            RAISE NOTICE 'Applied public read policies to: %', public_table;
        END IF;
    END LOOP;
END $$;

-- ====================================================================
-- STEP 5: VALIDATE MIGRATION
-- ====================================================================

-- Show final policy summary
SELECT 
    tablename as table_name,
    COUNT(*) as policy_count,
    STRING_AGG(policyname, ', ' ORDER BY policyname) as policies
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Show tables without policies (should be none)
SELECT 
    t.tablename as table_name
FROM pg_tables t 
WHERE t.schemaname = 'public' 
AND t.tablename NOT LIKE 'pg_%'
AND NOT EXISTS (
    SELECT 1 FROM pg_policies p 
    WHERE p.schemaname = 'public' 
    AND p.tablename = t.tablename
)
ORDER BY t.tablename;

-- ====================================================================
-- MIGRATION COMPLETE
-- ====================================================================

DO $$
BEGIN
    RAISE NOTICE 'Migration to centralized RLS system complete!';
    RAISE NOTICE 'All tables now use standardized policy templates.';
    RAISE NOTICE 'Use list_policy_summary() to view all policies.';
    RAISE NOTICE 'Use validate_policy_coverage() to validate coverage.';
END $$;
