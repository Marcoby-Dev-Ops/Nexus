-- Migration: Disable RLS for remaining tables with auth.uid() policies
-- These tables still have Supabase-style RLS policies that conflict with the server's JWT auth

-- Disable RLS for any remaining tables that might have auth.uid() policies
-- This is a catch-all for any tables that weren't covered in the previous migration

-- Note: The server handles security through application-level filtering with WHERE user_id = $1
-- so RLS is not needed and actually causes conflicts with the custom JWT authentication system

-- If any of these tables don't exist, the commands will fail gracefully
-- You can safely ignore any "table does not exist" errors

-- Disable RLS for any remaining user-scoped tables
DO $$
DECLARE
    table_record RECORD;
BEGIN
    -- Find all tables that have RLS enabled and might have auth.uid() policies
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'user_profiles', 'user_integrations', 'tasks', 'thoughts', 'documents',
            'user_activities', 'next_best_actions', 'user_action_executions',
            'user_onboarding_steps', 'user_onboarding_completions', 'user_onboarding_phases',
            'ai_models', 'analytics_events', 'callback_events', 'oauth_tokens',
            'user_organizations', 'user_ai_model_preferences', 'user_mappings',
            'user_sessions', 'external_user_mappings', 'company_members',
            'company_status', 'environment_config', 'schema_migrations'
        )
    LOOP
        -- Disable RLS for each table
        EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', table_record.tablename);
        
        -- Drop any existing policies (this will fail gracefully if no policies exist)
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS "%s_select_policy" ON %I', table_record.tablename, table_record.tablename);
            EXECUTE format('DROP POLICY IF EXISTS "%s_insert_policy" ON %I', table_record.tablename, table_record.tablename);
            EXECUTE format('DROP POLICY IF EXISTS "%s_update_policy" ON %I', table_record.tablename, table_record.tablename);
            EXECUTE format('DROP POLICY IF EXISTS "%s_delete_policy" ON %I', table_record.tablename, table_record.tablename);
        EXCEPTION
            WHEN OTHERS THEN
                -- Ignore errors from dropping non-existent policies
                NULL;
        END;
    END LOOP;
END $$;

