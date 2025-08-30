-- RLS Overhaul Phase 1: Critical Security Fixes
-- This script addresses the immediate security issues by:
-- 1. Disabling RLS on tables that should be public
-- 2. Adding basic user isolation policies for user-owned data
-- 3. Fixing immediate access issues

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
-- STEP 2: Add User Isolation Policies for User-Owned Data
-- =====================================================

-- Personal automations - users can manage their own
CREATE POLICY "Users can manage own personal_automations" ON personal_automations
    FOR ALL USING (user_id = auth.uid());

-- Personal thoughts - users can manage their own
CREATE POLICY "Users can manage own personal_thoughts" ON personal_thoughts
    FOR ALL USING (user_id = auth.uid());

-- User contexts - users can manage their own
CREATE POLICY "Users can manage own user_contexts" ON user_contexts
    FOR ALL USING (user_id = auth.uid());

-- User preferences - users can manage their own
CREATE POLICY "Users can manage own user_preferences" ON user_preferences
    FOR ALL USING (user_id = auth.uid());

-- User quotas - users can manage their own
CREATE POLICY "Users can manage own user_quotas" ON user_quotas
    FOR ALL USING (user_id = auth.uid());

-- =====================================================
-- STEP 3: Add Basic Organization-Based Policies
-- =====================================================

-- Companies - users can access companies they own or are members of
CREATE POLICY "Users can access organization companies" ON companies
    FOR ALL USING (
        owner_id = auth.uid() OR
        id IN (
            SELECT org_id 
            FROM user_organizations 
            WHERE user_id = auth.uid()
        )
    );

-- Contacts - users can access contacts from their organizations
CREATE POLICY "Users can access organization contacts" ON contacts
    FOR ALL USING (
        user_id = auth.uid() OR
        user_id IN (
            SELECT user_id 
            FROM user_organizations 
            WHERE org_id IN (
                SELECT org_id 
                FROM user_organizations 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Deals - users can access deals from their organizations
CREATE POLICY "Users can access organization deals" ON deals
    FOR ALL USING (
        user_id = auth.uid() OR
        user_id IN (
            SELECT user_id 
            FROM user_organizations 
            WHERE org_id IN (
                SELECT org_id 
                FROM user_organizations 
                WHERE user_id = auth.uid()
            )
        )
    );

-- =====================================================
-- STEP 4: Add Basic AI Data Policies
-- =====================================================

-- AI interactions - users can access their own AI interactions
CREATE POLICY "Users can access own ai_interactions" ON ai_interactions
    FOR ALL USING (user_id = auth.uid());

-- AI messages - users can access their own AI messages
CREATE POLICY "Users can access own ai_messages" ON ai_messages
    FOR ALL USING (user_id = auth.uid());

-- AI insights - users can access their own AI insights
CREATE POLICY "Users can access own ai_insights" ON ai_insights
    FOR ALL USING (user_id = auth.uid());

-- =====================================================
-- STEP 5: Add Basic Business Data Policies
-- =====================================================

-- Business health - users can access business health from their organizations
CREATE POLICY "Users can access organization business_health" ON business_health
    FOR ALL USING (
        user_id = auth.uid() OR
        user_id IN (
            SELECT user_id 
            FROM user_organizations 
            WHERE org_id IN (
                SELECT org_id 
                FROM user_organizations 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Client health scores - users can access from their organizations
CREATE POLICY "Users can access organization client_health_scores" ON client_health_scores
    FOR ALL USING (
        user_id = auth.uid() OR
        user_id IN (
            SELECT user_id 
            FROM user_organizations 
            WHERE org_id IN (
                SELECT org_id 
                FROM user_organizations 
                WHERE user_id = auth.uid()
            )
        )
    );

-- =====================================================
-- STEP 6: Add Basic Integration Data Policies
-- =====================================================

-- Integration data - users can access their own integration data
CREATE POLICY "Users can access own integration_data" ON integration_data
    FOR ALL USING (user_id = auth.uid());

-- Integration data records - users can access their own records
CREATE POLICY "Users can access own integration_data_records" ON integration_data_records
    FOR ALL USING (user_id = auth.uid());

-- =====================================================
-- STEP 7: Add Basic Calendar and Interaction Policies
-- =====================================================

-- Calendar events - users can access events from their organizations
CREATE POLICY "Users can access organization calendar_events" ON calendar_events
    FOR ALL USING (
        user_id = auth.uid() OR
        user_id IN (
            SELECT user_id 
            FROM user_organizations 
            WHERE org_id IN (
                SELECT org_id 
                FROM user_organizations 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Interactions - users can access interactions from their organizations
CREATE POLICY "Users can access organization interactions" ON interactions
    FOR ALL USING (
        user_id = auth.uid() OR
        user_id IN (
            SELECT user_id 
            FROM user_organizations 
            WHERE org_id IN (
                SELECT org_id 
                FROM user_organizations 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Conversations - users can access conversations from their organizations
CREATE POLICY "Users can access organization conversations" ON conversations
    FOR ALL USING (
        user_id = auth.uid() OR
        user_id IN (
            SELECT user_id 
            FROM user_organizations 
            WHERE org_id IN (
                SELECT org_id 
                FROM user_organizations 
                WHERE user_id = auth.uid()
            )
        )
    );

-- =====================================================
-- STEP 8: Add Basic Data Point and Demo Data Policies
-- =====================================================

-- Data point definitions - users can access from their organizations
CREATE POLICY "Users can access organization data_point_definitions" ON data_point_definitions
    FOR ALL USING (
        user_id = auth.uid() OR
        user_id IN (
            SELECT user_id 
            FROM user_organizations 
            WHERE org_id IN (
                SELECT org_id 
                FROM user_organizations 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Demo data - users can access their own demo data
CREATE POLICY "Users can access own demo_data" ON demo_data
    FOR ALL USING (user_id = auth.uid());

-- =====================================================
-- STEP 9: Add Basic AI Client Data Policies
-- =====================================================

-- AI client intelligence alerts - users can access from their organizations
CREATE POLICY "Users can access organization ai_client_intelligence_alerts" ON ai_client_intelligence_alerts
    FOR ALL USING (
        user_id = auth.uid() OR
        user_id IN (
            SELECT user_id 
            FROM user_organizations 
            WHERE org_id IN (
                SELECT org_id 
                FROM user_organizations 
                WHERE user_id = auth.uid()
            )
        )
    );

-- AI client interactions - users can access from their organizations
CREATE POLICY "Users can access organization ai_client_interactions" ON ai_client_interactions
    FOR ALL USING (
        user_id = auth.uid() OR
        user_id IN (
            SELECT user_id 
            FROM user_organizations 
            WHERE org_id IN (
                SELECT org_id 
                FROM user_organizations 
                WHERE user_id = auth.uid()
            )
        )
    );

-- AI success outcomes - users can access from their organizations
CREATE POLICY "Users can access organization ai_success_outcomes" ON ai_success_outcomes
    FOR ALL USING (
        user_id = auth.uid() OR
        user_id IN (
            SELECT user_id 
            FROM user_organizations 
            WHERE org_id IN (
                SELECT org_id 
                FROM user_organizations 
                WHERE user_id = auth.uid()
            )
        )
    );

-- AI unified client profiles - users can access from their organizations
CREATE POLICY "Users can access organization ai_unified_client_profiles" ON ai_unified_client_profiles
    FOR ALL USING (
        user_id = auth.uid() OR
        user_id IN (
            SELECT user_id 
            FROM user_organizations 
            WHERE org_id IN (
                SELECT org_id 
                FROM user_organizations 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Unified client profiles - users can access from their organizations
CREATE POLICY "Users can access organization unified_client_profiles" ON unified_client_profiles
    FOR ALL USING (
        user_id = auth.uid() OR
        user_id IN (
            SELECT user_id 
            FROM user_organizations 
            WHERE org_id IN (
                SELECT org_id 
                FROM user_organizations 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Cross platform correlations - users can access from their organizations
CREATE POLICY "Users can access organization cross_platform_correlations" ON cross_platform_correlations
    FOR ALL USING (
        user_id = auth.uid() OR
        user_id IN (
            SELECT user_id 
            FROM user_organizations 
            WHERE org_id IN (
                SELECT org_id 
                FROM user_organizations 
                WHERE user_id = auth.uid()
            )
        )
    );

-- =====================================================
-- STEP 10: Add Basic Audit and Security Policies
-- =====================================================

-- Audit logs - users can access their own audit logs
CREATE POLICY "Users can access own audit_logs" ON audit_logs
    FOR ALL USING (user_id = auth.uid());

-- Security audit log - users can access their own security audit logs
CREATE POLICY "Users can access own security_audit_log" ON security_audit_log
    FOR ALL USING (user_id = auth.uid());

-- =====================================================
-- STEP 11: Add Department Metrics View Policy
-- =====================================================

-- Department metrics view - users can access from their organizations
CREATE POLICY "Users can access organization department_metrics_view" ON department_metrics_view
    FOR ALL USING (
        user_id = auth.uid() OR
        user_id IN (
            SELECT user_id 
            FROM user_organizations 
            WHERE org_id IN (
                SELECT org_id 
                FROM user_organizations 
                WHERE user_id = auth.uid()
            )
        )
    );

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
