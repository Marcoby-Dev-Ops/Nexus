-- RLS Overhaul: Authentik Integration - FINAL VERSION
-- This script properly integrates RLS with Authentik identity management
-- Replaces all auth.uid() references with Authentik-based user identification

-- =====================================================
-- STEP 1: Disable RLS on Public Tables
-- =====================================================

-- These tables should be publicly accessible (read-only or no sensitive data)
ALTER TABLE ai_models DISABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE business_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE callback_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE company_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE company_status DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE environment_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE external_user_mappings DISABLE ROW LEVEL SECURITY;
ALTER TABLE integrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE schema_migrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE thoughts DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_ai_model_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_integrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_mappings DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 2: Create Authentik Identity Helper Functions
-- =====================================================

-- Function to get current user's internal UUID from Authentik JWT token
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
DECLARE
    v_external_user_id TEXT;
    v_internal_user_id UUID;
BEGIN
    -- Get the external user ID from the JWT token (Authentik user ID)
    v_external_user_id := current_setting('request.jwt.claims', true)::json->>'sub';
    
    -- If no external user ID found, return NULL
    IF v_external_user_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Get the internal user ID from the mapping
    SELECT internal_user_id INTO v_internal_user_id
    FROM external_user_mappings
    WHERE external_user_id = v_external_user_id AND provider = 'authentik';
    
    RETURN v_internal_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is admin/superuser
CREATE OR REPLACE FUNCTION is_current_user_admin()
RETURNS BOOLEAN AS $$
DECLARE
    v_is_admin BOOLEAN;
BEGIN
    -- Check if user has admin privileges in the JWT claims
    v_is_admin := (current_setting('request.jwt.claims', true)::json->>'is_superuser')::BOOLEAN;
    
    RETURN COALESCE(v_is_admin, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user's organization IDs
CREATE OR REPLACE FUNCTION get_current_user_org_ids()
RETURNS UUID[] AS $$
DECLARE
    v_internal_user_id UUID;
    v_org_ids UUID[];
BEGIN
    -- Get current user's internal ID
    v_internal_user_id := get_current_user_id();
    
    -- If no user ID found, return empty array
    IF v_internal_user_id IS NULL THEN
        RETURN ARRAY[]::UUID[];
    END IF;
    
    -- Get organization IDs where user is a member
    SELECT ARRAY_AGG(org_id) INTO v_org_ids
    FROM user_organizations
    WHERE user_id = v_internal_user_id;
    
    RETURN COALESCE(v_org_ids, ARRAY[]::UUID[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is in specific organization
CREATE OR REPLACE FUNCTION is_user_in_organization(p_org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_internal_user_id UUID;
    v_exists BOOLEAN;
BEGIN
    -- Get current user's internal ID
    v_internal_user_id := get_current_user_id();
    
    -- If no user ID found, return FALSE
    IF v_internal_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check if user is member of the organization
    SELECT EXISTS(
        SELECT 1 FROM user_organizations 
        WHERE user_id = v_internal_user_id AND org_id = p_org_id
    ) INTO v_exists;
    
    RETURN COALESCE(v_exists, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 3: Remove Existing Supabase-Based Policies
-- =====================================================

-- Remove existing policies that use auth.uid()
DROP POLICY IF EXISTS "Users can manage own onboarding completions" ON user_onboarding_completions;
DROP POLICY IF EXISTS "Users can manage own onboarding steps" ON user_onboarding_steps;
DROP POLICY IF EXISTS "Users can manage own profile" ON user_profiles;

-- =====================================================
-- STEP 4: Add Authentik-Based User Isolation Policies
-- =====================================================

-- User onboarding completions - users can manage their own
CREATE POLICY "Users can manage own onboarding completions" ON user_onboarding_completions
    FOR ALL USING (user_id = get_current_user_id());

-- User onboarding steps - users can manage their own
CREATE POLICY "Users can manage own onboarding steps" ON user_onboarding_steps
    FOR ALL USING (user_id = get_current_user_id());

-- User profiles - users can manage their own
CREATE POLICY "Users can manage own profile" ON user_profiles
    FOR ALL USING (user_id = get_current_user_id());

-- Personal automations - users can manage their own
CREATE POLICY "Users can manage own personal_automations" ON personal_automations
    FOR ALL USING (user_id = get_current_user_id());

-- Personal thoughts - users can manage their own
CREATE POLICY "Users can manage own personal_thoughts" ON personal_thoughts
    FOR ALL USING (user_id = get_current_user_id());

-- User contexts - users can manage their own
CREATE POLICY "Users can manage own user_contexts" ON user_contexts
    FOR ALL USING (user_id = get_current_user_id());

-- User preferences - users can manage their own
CREATE POLICY "Users can manage own user_preferences" ON user_preferences
    FOR ALL USING (user_id = get_current_user_id());

-- User quotas - users can manage their own
CREATE POLICY "Users can manage own user_quotas" ON user_quotas
    FOR ALL USING (user_id = get_current_user_id());

-- =====================================================
-- STEP 5: Add Organization-Based Policies
-- =====================================================

-- Companies - users can access companies they own or are members of
CREATE POLICY "Users can access organization companies" ON companies
    FOR ALL USING (
        owner_id = get_current_user_id() OR
        id = ANY(get_current_user_org_ids())
    );

-- Contacts - users can access contacts from their organizations
CREATE POLICY "Users can access organization contacts" ON contacts
    FOR ALL USING (
        user_id = get_current_user_id() OR
        user_id IN (
            SELECT user_id 
            FROM user_organizations 
            WHERE org_id = ANY(get_current_user_org_ids())
        )
    );

-- Deals - users can access deals from their organizations
CREATE POLICY "Users can access organization deals" ON deals
    FOR ALL USING (
        user_id = get_current_user_id() OR
        user_id IN (
            SELECT user_id 
            FROM user_organizations 
            WHERE org_id = ANY(get_current_user_org_ids())
        )
    );

-- =====================================================
-- STEP 6: Add AI Data Policies
-- =====================================================

-- AI interactions - users can access their own AI interactions
CREATE POLICY "Users can access own ai_interactions" ON ai_interactions
    FOR ALL USING (user_id = get_current_user_id());

-- AI messages - users can access their own AI messages
CREATE POLICY "Users can access own ai_messages" ON ai_messages
    FOR ALL USING (user_id = get_current_user_id());

-- AI insights - users can access their own AI insights
CREATE POLICY "Users can access own ai_insights" ON ai_insights
    FOR ALL USING (user_id = get_current_user_id());

-- =====================================================
-- STEP 7: Add Business Data Policies
-- =====================================================

-- Business health - users can access business health from their organizations
CREATE POLICY "Users can access organization business_health" ON business_health
    FOR ALL USING (
        user_id = get_current_user_id() OR
        user_id IN (
            SELECT user_id 
            FROM user_organizations 
            WHERE org_id = ANY(get_current_user_org_ids())
        )
    );

-- Client health scores - users can access from their organizations
CREATE POLICY "Users can access organization client_health_scores" ON client_health_scores
    FOR ALL USING (
        user_id = get_current_user_id() OR
        user_id IN (
            SELECT user_id 
            FROM user_organizations 
            WHERE org_id = ANY(get_current_user_org_ids())
        )
    );

-- =====================================================
-- STEP 8: Add Integration Data Policies
-- =====================================================

-- Integration data - users can access their own integration data
CREATE POLICY "Users can access own integration_data" ON integration_data
    FOR ALL USING (user_id = get_current_user_id());

-- Integration data records - users can access their own records
CREATE POLICY "Users can access own integration_data_records" ON integration_data_records
    FOR ALL USING (user_id = get_current_user_id());

-- =====================================================
-- STEP 9: Add Calendar and Interaction Policies
-- =====================================================

-- Calendar events - users can access events from their organizations
CREATE POLICY "Users can access organization calendar_events" ON calendar_events
    FOR ALL USING (
        user_id = get_current_user_id() OR
        user_id IN (
            SELECT user_id 
            FROM user_organizations 
            WHERE org_id = ANY(get_current_user_org_ids())
        )
    );

-- Interactions - users can access interactions from their organizations
CREATE POLICY "Users can access organization interactions" ON interactions
    FOR ALL USING (
        user_id = get_current_user_id() OR
        user_id IN (
            SELECT user_id 
            FROM user_organizations 
            WHERE org_id = ANY(get_current_user_org_ids())
        )
    );

-- Conversations - users can access conversations from their organizations
CREATE POLICY "Users can access organization conversations" ON conversations
    FOR ALL USING (
        user_id = get_current_user_id() OR
        user_id IN (
            SELECT user_id 
            FROM user_organizations 
            WHERE org_id = ANY(get_current_user_org_ids())
        )
    );

-- =====================================================
-- STEP 10: Add Data Point and Demo Data Policies
-- =====================================================

-- Data point definitions - users can access from their organizations
CREATE POLICY "Users can access organization data_point_definitions" ON data_point_definitions
    FOR ALL USING (
        user_id = get_current_user_id() OR
        user_id IN (
            SELECT user_id 
            FROM user_organizations 
            WHERE org_id = ANY(get_current_user_org_ids())
        )
    );

-- Demo data - users can access their own demo data
CREATE POLICY "Users can access own demo_data" ON demo_data
    FOR ALL USING (user_id = get_current_user_id());

-- =====================================================
-- STEP 11: Add AI Client Data Policies
-- =====================================================

-- AI client intelligence alerts - users can access from their organizations
CREATE POLICY "Users can access organization ai_client_intelligence_alerts" ON ai_client_intelligence_alerts
    FOR ALL USING (
        user_id = get_current_user_id() OR
        user_id IN (
            SELECT user_id 
            FROM user_organizations 
            WHERE org_id = ANY(get_current_user_org_ids())
        )
    );

-- AI client interactions - users can access from their organizations
CREATE POLICY "Users can access organization ai_client_interactions" ON ai_client_interactions
    FOR ALL USING (
        user_id = get_current_user_id() OR
        user_id IN (
            SELECT user_id 
            FROM user_organizations 
            WHERE org_id = ANY(get_current_user_org_ids())
        )
    );

-- AI success outcomes - users can access from their organizations
CREATE POLICY "Users can access organization ai_success_outcomes" ON ai_success_outcomes
    FOR ALL USING (
        user_id = get_current_user_id() OR
        user_id IN (
            SELECT user_id 
            FROM user_organizations 
            WHERE org_id = ANY(get_current_user_org_ids())
        )
    );

-- AI unified client profiles - users can access from their organizations
CREATE POLICY "Users can access organization ai_unified_client_profiles" ON ai_unified_client_profiles
    FOR ALL USING (
        user_id = get_current_user_id() OR
        user_id IN (
            SELECT user_id 
            FROM user_organizations 
            WHERE org_id = ANY(get_current_user_org_ids())
        )
    );

-- Unified client profiles - users can access from their organizations
CREATE POLICY "Users can access organization unified_client_profiles" ON unified_client_profiles
    FOR ALL USING (
        user_id = get_current_user_id() OR
        user_id IN (
            SELECT user_id 
            FROM user_organizations 
            WHERE org_id = ANY(get_current_user_org_ids())
        )
    );

-- Cross platform correlations - users can access from their organizations
CREATE POLICY "Users can access organization cross_platform_correlations" ON cross_platform_correlations
    FOR ALL USING (
        user_id = get_current_user_id() OR
        user_id IN (
            SELECT user_id 
            FROM user_organizations 
            WHERE org_id = ANY(get_current_user_org_ids())
        )
    );

-- =====================================================
-- STEP 12: Add Audit and Security Policies
-- =====================================================

-- Audit logs - users can access their own audit logs
CREATE POLICY "Users can access own audit_logs" ON audit_logs
    FOR ALL USING (user_id = get_current_user_id());

-- Security audit log - users can access their own security audit logs
CREATE POLICY "Users can access own security_audit_log" ON security_audit_log
    FOR ALL USING (user_id = get_current_user_id());

-- =====================================================
-- STEP 13: Add Department Metrics View Policy
-- =====================================================

-- Department metrics view - users can access from their organizations
CREATE POLICY "Users can access organization department_metrics_view" ON department_metrics_view
    FOR ALL USING (
        user_id = get_current_user_id() OR
        user_id IN (
            SELECT user_id 
            FROM user_organizations 
            WHERE org_id = ANY(get_current_user_org_ids())
        )
    );

-- =====================================================
-- STEP 14: Add Admin Access Policies
-- =====================================================

-- Admin access to all data (for system-wide data)
CREATE POLICY "Admins can access all audit_logs" ON audit_logs
    FOR ALL USING (is_current_user_admin());

CREATE POLICY "Admins can access all security_audit_log" ON security_audit_log
    FOR ALL USING (is_current_user_admin());

CREATE POLICY "Admins can access all demo_data" ON demo_data
    FOR ALL USING (is_current_user_admin());

CREATE POLICY "Admins can access all department_metrics_view" ON department_metrics_view
    FOR ALL USING (is_current_user_admin());

-- =====================================================
-- STEP 15: Create Billing Profile Policies
-- =====================================================

-- Note: Add billing profile policies when you have billing-related tables
-- Example:
-- CREATE POLICY "Users can access own billing_profiles" ON billing_profiles
--     FOR ALL USING (user_id = get_current_user_id());

-- =====================================================
-- STEP 16: Create Company Profile Policies
-- =====================================================

-- Companies already covered in STEP 5, but you might want specific company profile policies
-- Example:
-- CREATE POLICY "Users can access company profiles" ON company_profiles
--     FOR ALL USING (
--         company_id IN (
--             SELECT id FROM companies 
--             WHERE owner_id = get_current_user_id() OR id = ANY(get_current_user_org_ids())
--         )
--     );

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================

-- Run this query to verify all tables with RLS now have policies
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

-- =====================================================
-- TESTING QUERIES
-- =====================================================

-- Test the helper functions (run these with a valid JWT token):
-- SELECT get_current_user_id();
-- SELECT is_current_user_admin();
-- SELECT get_current_user_org_ids();
-- SELECT is_user_in_organization('some-org-uuid');

-- =====================================================
-- IMPORTANT NOTES
-- =====================================================

-- 1. This script assumes your JWT tokens contain:
--    - 'sub': The Authentik user ID
--    - 'is_superuser': Boolean indicating admin status
--
-- 2. Make sure your database connection is configured to pass JWT claims
--    to PostgreSQL via the 'request.jwt.claims' setting
--
-- 3. The external_user_mappings table must be populated with mappings
--    between Authentik user IDs and internal UUIDs
--
-- 4. Test thoroughly in a staging environment before applying to production
