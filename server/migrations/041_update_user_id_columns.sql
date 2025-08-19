-- Migration: Update all user_id columns to VARCHAR(255) for Authentik user IDs
-- This migration updates all tables that reference user IDs to use the new format

-- First, disable RLS and drop policies that depend on user_id columns
ALTER TABLE ai_form_assistance_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_form_suggestions DISABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE callback_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE company_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE thoughts DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_ai_model_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations DISABLE ROW LEVEL SECURITY;

-- Disable RLS on all tables with user_id columns
ALTER TABLE ai_client_intelligence_alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_client_interactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_success_outcomes DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_unified_client_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE business_health DISABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE client_health_scores DISABLE ROW LEVEL SECURITY;
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE cross_platform_correlations DISABLE ROW LEVEL SECURITY;
ALTER TABLE datapoint_mappings DISABLE ROW LEVEL SECURITY;
ALTER TABLE deals DISABLE ROW LEVEL SECURITY;
ALTER TABLE demo_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE integration_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE integration_data_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE interactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE next_best_actions DISABLE ROW LEVEL SECURITY;
ALTER TABLE personal_automations DISABLE ROW LEVEL SECURITY;
ALTER TABLE personal_thoughts DISABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE unified_client_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_action_executions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_contexts DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_integrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_onboarding_completions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_onboarding_steps DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_quotas DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions DISABLE ROW LEVEL SECURITY;

-- Drop RLS policies that depend on user_id columns
DROP POLICY IF EXISTS "Users can view their own form assistance sessions" ON ai_form_assistance_sessions;
DROP POLICY IF EXISTS "Users can insert their own form assistance sessions" ON ai_form_assistance_sessions;
DROP POLICY IF EXISTS "Users can update their own form assistance sessions" ON ai_form_assistance_sessions;
DROP POLICY IF EXISTS "Users can delete their own form assistance sessions" ON ai_form_assistance_sessions;
DROP POLICY IF EXISTS "Users can view their own form suggestions" ON ai_form_suggestions;
DROP POLICY IF EXISTS "Users can insert their own form suggestions" ON ai_form_suggestions;
DROP POLICY IF EXISTS "Users can update their own form suggestions" ON ai_form_suggestions;
DROP POLICY IF EXISTS "Users can delete their own form suggestions" ON ai_form_suggestions;
DROP POLICY IF EXISTS "Users can access organization companies" ON companies;
DROP POLICY IF EXISTS "Users can view their own companies" ON companies;
DROP POLICY IF EXISTS "Users can insert their own companies" ON companies;
DROP POLICY IF EXISTS "Users can update their own companies" ON companies;
DROP POLICY IF EXISTS "Users can delete their own companies" ON companies;

-- Drop all RLS policies on tables with user_id columns
DROP POLICY IF EXISTS "Users can access own ai_insights" ON ai_insights;
DROP POLICY IF EXISTS "Users can access own ai_interactions" ON ai_interactions;
DROP POLICY IF EXISTS "Users can access own ai_conversations" ON ai_conversations;
DROP POLICY IF EXISTS "Users can access own analytics_events" ON analytics_events;
DROP POLICY IF EXISTS "Users can access own documents" ON documents;
DROP POLICY IF EXISTS "Users can access own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can access own thoughts" ON thoughts;
DROP POLICY IF EXISTS "Users can access own user_organizations" ON user_organizations;
DROP POLICY IF EXISTS "Users can access own audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "Users can access organization business_health" ON business_health;
DROP POLICY IF EXISTS "Users can access organization contacts" ON contacts;
DROP POLICY IF EXISTS "Users can delete their own datapoint mappings" ON datapoint_mappings;
DROP POLICY IF EXISTS "Users can insert their own datapoint mappings" ON datapoint_mappings;
DROP POLICY IF EXISTS "Users can update their own datapoint mappings" ON datapoint_mappings;
DROP POLICY IF EXISTS "Users can view their own datapoint mappings" ON datapoint_mappings;
DROP POLICY IF EXISTS "Users can access organization deals" ON deals;
DROP POLICY IF EXISTS "Users can access own demo_data" ON demo_data;
DROP POLICY IF EXISTS "Users can access own integration_data" ON integration_data;
DROP POLICY IF EXISTS "Users can access own integration_data_records" ON integration_data_records;
DROP POLICY IF EXISTS "Users can manage own personal_automations" ON personal_automations;
DROP POLICY IF EXISTS "Users can manage own personal_thoughts" ON personal_thoughts;
DROP POLICY IF EXISTS "Users can access own security_audit_log" ON security_audit_log;
DROP POLICY IF EXISTS "Users can manage own user_contexts" ON user_contexts;
DROP POLICY IF EXISTS "Users can manage own onboarding completions" ON user_onboarding_completions;
DROP POLICY IF EXISTS "Users can manage their own onboarding completions" ON user_onboarding_completions;
DROP POLICY IF EXISTS "Users can manage their own onboarding steps" ON user_onboarding_steps;
DROP POLICY IF EXISTS "Users can delete own user preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert own user preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update own user preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can view own user preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can manage own user_quotas" ON user_quotas;

-- Drop existing foreign key constraints first
ALTER TABLE ai_form_assistance_sessions DROP CONSTRAINT IF EXISTS ai_form_assistance_sessions_user_id_fkey;
ALTER TABLE analytics_events DROP CONSTRAINT IF EXISTS analytics_events_user_id_fkey;
ALTER TABLE callback_events DROP CONSTRAINT IF EXISTS callback_events_user_id_fkey;
ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_owner_id_fkey;
ALTER TABLE company_members DROP CONSTRAINT IF EXISTS company_members_user_id_fkey;
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_user_id_fkey;
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_assigned_to_fkey;
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_user_id_fkey;
ALTER TABLE thoughts DROP CONSTRAINT IF EXISTS thoughts_user_id_fkey;
ALTER TABLE user_ai_model_preferences DROP CONSTRAINT IF EXISTS user_ai_model_preferences_user_id_fkey;
ALTER TABLE user_organizations DROP CONSTRAINT IF EXISTS user_organizations_user_id_fkey;

-- Update user_id columns in all tables to VARCHAR(255)
ALTER TABLE ai_form_assistance_sessions ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE analytics_events ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE callback_events ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE company_members ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE documents ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE tasks ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE thoughts ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE user_ai_model_preferences ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE user_organizations ALTER COLUMN user_id TYPE VARCHAR(255);

-- Update owner_id in companies table
ALTER TABLE companies ALTER COLUMN owner_id TYPE VARCHAR(255);

-- Update assigned_to in tasks table
ALTER TABLE tasks ALTER COLUMN assigned_to TYPE VARCHAR(255);

-- Update other tables that have user_id columns
ALTER TABLE ai_client_intelligence_alerts ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE ai_client_interactions ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE ai_conversations ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE ai_insights ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE ai_interactions ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE ai_success_outcomes ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE ai_unified_client_profiles ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE audit_logs ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE business_health ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE calendar_events ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE client_health_scores ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE contacts ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE conversations ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE cross_platform_correlations ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE datapoint_mappings ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE deals ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE demo_data ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE integration_data ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE integration_data_records ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE interactions ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE next_best_actions ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE personal_automations ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE personal_thoughts ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE security_audit_log ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE unified_client_profiles ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE user_action_executions ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE user_activities ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE user_contexts ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE user_integrations ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE user_onboarding_completions ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE user_onboarding_steps ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE user_quotas ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE user_sessions ALTER COLUMN user_id TYPE VARCHAR(255);

-- Note: Foreign key constraints will be added in a separate migration after data migration is complete
-- This allows for proper data migration from UUID to Authentik user IDs

-- Add comments to document the changes
COMMENT ON COLUMN ai_form_assistance_sessions.user_id IS 'Authentik user ID';
COMMENT ON COLUMN analytics_events.user_id IS 'Authentik user ID';
COMMENT ON COLUMN callback_events.user_id IS 'Authentik user ID';
COMMENT ON COLUMN companies.owner_id IS 'Authentik user ID';
COMMENT ON COLUMN company_members.user_id IS 'Authentik user ID';
COMMENT ON COLUMN documents.user_id IS 'Authentik user ID';
COMMENT ON COLUMN tasks.user_id IS 'Authentik user ID';
COMMENT ON COLUMN tasks.assigned_to IS 'Authentik user ID';
COMMENT ON COLUMN thoughts.user_id IS 'Authentik user ID';
COMMENT ON COLUMN user_ai_model_preferences.user_id IS 'Authentik user ID';
COMMENT ON COLUMN user_organizations.user_id IS 'Authentik user ID';
