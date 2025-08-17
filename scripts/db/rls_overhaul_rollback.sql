-- RLS Overhaul Rollback Script
-- This script can be used to rollback RLS changes if issues arise

-- =====================================================
-- EMERGENCY ROLLBACK: Disable RLS on All Tables
-- =====================================================

-- Uncomment the following block to disable RLS on all tables
/*
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true)
    LOOP
        EXECUTE 'ALTER TABLE ' || r.tablename || ' DISABLE ROW LEVEL SECURITY';
        RAISE NOTICE 'Disabled RLS on table: %', r.tablename;
    END LOOP;
END $$;
*/

-- =====================================================
-- SELECTIVE ROLLBACK: Remove Specific Policies
-- =====================================================

-- Remove user-owned data policies
DROP POLICY IF EXISTS "Users can manage own personal_automations" ON personal_automations;
DROP POLICY IF EXISTS "Users can manage own personal_thoughts" ON personal_thoughts;
DROP POLICY IF EXISTS "Users can manage own user_contexts" ON user_contexts;
DROP POLICY IF EXISTS "Users can manage own user_preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can manage own user_quotas" ON user_quotas;

-- Remove organization-based policies
DROP POLICY IF EXISTS "Users can access organization companies" ON companies;
DROP POLICY IF EXISTS "Users can access organization contacts" ON contacts;
DROP POLICY IF EXISTS "Users can access organization deals" ON deals;

-- Remove AI data policies
DROP POLICY IF EXISTS "Users can access own ai_interactions" ON ai_interactions;
DROP POLICY IF EXISTS "Users can access own ai_messages" ON ai_messages;
DROP POLICY IF EXISTS "Users can access own ai_insights" ON ai_insights;

-- Remove business data policies
DROP POLICY IF EXISTS "Users can access organization business_health" ON business_health;
DROP POLICY IF EXISTS "Users can access organization client_health_scores" ON client_health_scores;

-- Remove integration data policies
DROP POLICY IF EXISTS "Users can access own integration_data" ON integration_data;
DROP POLICY IF EXISTS "Users can access own integration_data_records" ON integration_data_records;

-- Remove calendar and interaction policies
DROP POLICY IF EXISTS "Users can access organization calendar_events" ON calendar_events;
DROP POLICY IF EXISTS "Users can access organization interactions" ON interactions;
DROP POLICY IF EXISTS "Users can access organization conversations" ON conversations;

-- Remove data point and demo data policies
DROP POLICY IF EXISTS "Users can access organization data_point_definitions" ON data_point_definitions;
DROP POLICY IF EXISTS "Users can access own demo_data" ON demo_data;

-- Remove AI client data policies
DROP POLICY IF EXISTS "Users can access organization ai_client_intelligence_alerts" ON ai_client_intelligence_alerts;
DROP POLICY IF EXISTS "Users can access organization ai_client_interactions" ON ai_client_interactions;
DROP POLICY IF EXISTS "Users can access organization ai_success_outcomes" ON ai_success_outcomes;
DROP POLICY IF EXISTS "Users can access organization ai_unified_client_profiles" ON ai_unified_client_profiles;
DROP POLICY IF EXISTS "Users can access organization unified_client_profiles" ON unified_client_profiles;
DROP POLICY IF EXISTS "Users can access organization cross_platform_correlations" ON cross_platform_correlations;

-- Remove audit and security policies
DROP POLICY IF EXISTS "Users can access own audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "Users can access own security_audit_log" ON security_audit_log;

-- Remove department metrics view policy
DROP POLICY IF EXISTS "Users can access organization department_metrics_view" ON department_metrics_view;

-- =====================================================
-- RE-ENABLE RLS ON TABLES THAT WERE DISABLED
-- =====================================================

-- Re-enable RLS on tables that should have it
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE callback_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE environment_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_user_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE schema_migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE thoughts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ai_model_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================

-- Run this query to verify the rollback state
-- SELECT 
--     t.table_name,
--     t.rowsecurity,
--     COUNT(p.policyname) as policy_count
-- FROM information_schema.tables t
-- LEFT JOIN pg_policies p ON t.table_name = p.tablename AND p.schemaname = 'public'
-- WHERE t.table_schema = 'public' 
--     AND t.table_type = 'BASE TABLE'
--     AND t.table_name NOT LIKE 'pg_%'
--     AND t.table_name NOT LIKE 'information_schema%'
-- GROUP BY t.table_name, t.rowsecurity
-- ORDER BY t.table_name;
