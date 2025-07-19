-- Safe RLS Policies Migration
-- This migration includes proper checks to ensure tables and columns exist before creating policies

-- Function to safely create policies with existence checks
CREATE OR REPLACE FUNCTION safe_create_policy(
    tbl_name TEXT,
    policy_name TEXT,
    operation TEXT,
    using_clause TEXT,
    with_check_clause TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    table_exists BOOLEAN;
    policy_exists BOOLEAN;
BEGIN
    -- Check if table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = safe_create_policy.tbl_name
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RAISE NOTICE 'Table % does not exist, skipping policy creation', tbl_name;
        RETURN FALSE;
    END IF;
    
    -- Check if policy already exists
    SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = safe_create_policy.tbl_name
        AND policyname = safe_create_policy.policy_name
    ) INTO policy_exists;
    
    IF policy_exists THEN
        RAISE NOTICE 'Policy % already exists on table %, skipping', policy_name, tbl_name;
        RETURN FALSE;
    END IF;
    
    -- Create the policy
    EXECUTE format(
        'CREATE POLICY %I ON %I FOR %s USING (%s)',
        policy_name,
        tbl_name,
        operation,
        using_clause
    );
    
    IF with_check_clause IS NOT NULL THEN
        EXECUTE format(
            'ALTER POLICY %I ON %I WITH CHECK (%s)',
            policy_name,
            tbl_name,
            with_check_clause
        );
    END IF;
    
    RAISE NOTICE 'Successfully created policy % on table %', policy_name, tbl_name;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to check if column exists
CREATE OR REPLACE FUNCTION column_exists(tbl_name TEXT, column_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = column_exists.tbl_name
        AND column_name = column_exists.column_name
    );
END;
$$ LANGUAGE plpgsql;

-- Now create policies with safety checks

-- 1. Companies table INSERT policy (the main issue)
SELECT safe_create_policy(
    'companies',
    'Users can create companies during onboarding',
    'INSERT',
    'auth.uid() IS NOT NULL'
);

-- 2. Contacts table policies (check which column exists)
DO $$
BEGIN
    -- Check if contacts table exists and which company column it has
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'contacts'
    ) THEN
        -- Check if it has company_id or companyId
        IF column_exists('contacts', 'company_id') THEN
            -- Use company_id
            PERFORM safe_create_policy(
                'contacts',
                'Users can view company contacts',
                'SELECT',
                'EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.company_id = contacts.company_id)'
            );
        ELSIF column_exists('contacts', 'companyId') THEN
            -- Use companyId
            PERFORM safe_create_policy(
                'contacts',
                'Users can view company contacts',
                'SELECT',
                'EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.company_id = contacts."companyId")'
            );
        ELSE
            RAISE NOTICE 'contacts table exists but has no company_id or companyId column';
        END IF;
    ELSE
        RAISE NOTICE 'contacts table does not exist, skipping contacts policies';
    END IF;
END $$;

-- 3. Deals table policies (check which column exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'deals'
    ) THEN
        IF column_exists('deals', 'company_id') THEN
            PERFORM safe_create_policy(
                'deals',
                'Users can view company deals',
                'SELECT',
                'EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.company_id = deals.company_id)'
            );
        ELSIF column_exists('deals', 'companyId') THEN
            PERFORM safe_create_policy(
                'deals',
                'Users can view company deals',
                'SELECT',
                'EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.company_id = deals."companyId")'
            );
        ELSE
            RAISE NOTICE 'deals table exists but has no company_id or companyId column';
        END IF;
    ELSE
        RAISE NOTICE 'deals table does not exist, skipping deals policies';
    END IF;
END $$;

-- 4. Chat sessions policies
SELECT safe_create_policy(
    'chat_sessions',
    'Users can view own chat sessions',
    'SELECT',
    'auth.uid() = user_id'
);

SELECT safe_create_policy(
    'chat_sessions',
    'Users can create own chat sessions',
    'INSERT',
    'auth.uid() = user_id'
);

-- 5. Chat messages policies
SELECT safe_create_policy(
    'chat_messages',
    'Users can view own chat messages',
    'SELECT',
    'EXISTS (SELECT 1 FROM chat_sessions WHERE chat_sessions.id = chat_messages.session_id AND chat_sessions.user_id = auth.uid())'
);

-- Clean up helper functions
DROP FUNCTION IF EXISTS safe_create_policy(TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS column_exists(TEXT, TEXT); 