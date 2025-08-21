-- Migration: Disable RLS for all tables with conflicting policies
-- The server handles security through application-level filtering, so RLS is not needed

-- Disable RLS for insights_analytics table
ALTER TABLE insights_analytics DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own insights analytics" ON insights_analytics;
DROP POLICY IF EXISTS "Users can insert own insights analytics" ON insights_analytics;
DROP POLICY IF EXISTS "Users can update own insights analytics" ON insights_analytics;
DROP POLICY IF EXISTS "System can access anonymized analytics" ON insights_analytics;

-- Disable RLS for AI usage monitoring tables
ALTER TABLE ai_provider_usage DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own ai provider usage" ON ai_provider_usage;
DROP POLICY IF EXISTS "Users can insert own ai provider usage" ON ai_provider_usage;
DROP POLICY IF EXISTS "Users can update own ai provider usage" ON ai_provider_usage;

ALTER TABLE ai_provider_credits DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own ai provider credits" ON ai_provider_credits;
DROP POLICY IF EXISTS "Users can insert own ai provider credits" ON ai_provider_credits;
DROP POLICY IF EXISTS "Users can update own ai provider credits" ON ai_provider_credits;

ALTER TABLE ai_usage_alerts DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own ai usage alerts" ON ai_usage_alerts;
DROP POLICY IF EXISTS "Users can insert own ai usage alerts" ON ai_usage_alerts;
DROP POLICY IF EXISTS "Users can update own ai usage alerts" ON ai_usage_alerts;

ALTER TABLE ai_usage_budgets DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own ai usage budgets" ON ai_usage_budgets;
DROP POLICY IF EXISTS "Users can insert own ai usage budgets" ON ai_usage_budgets;
DROP POLICY IF EXISTS "Users can update own ai usage budgets" ON ai_usage_budgets;

-- Disable RLS for CKB tables
ALTER TABLE ckb_documents DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own ckb documents" ON ckb_documents;
DROP POLICY IF EXISTS "Users can insert own ckb documents" ON ckb_documents;
DROP POLICY IF EXISTS "Users can update own ckb documents" ON ckb_documents;
DROP POLICY IF EXISTS "Users can delete own ckb documents" ON ckb_documents;

ALTER TABLE ckb_search_logs DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own ckb search logs" ON ckb_search_logs;
DROP POLICY IF EXISTS "Users can insert own ckb search logs" ON ckb_search_logs;
DROP POLICY IF EXISTS "Users can update own ckb search logs" ON ckb_search_logs;
DROP POLICY IF EXISTS "Users can delete own ckb search logs" ON ckb_search_logs;

ALTER TABLE ckb_storage_connections DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own ckb storage connections" ON ckb_storage_connections;
DROP POLICY IF EXISTS "Users can insert own ckb storage connections" ON ckb_storage_connections;
DROP POLICY IF EXISTS "Users can update own ckb storage connections" ON ckb_storage_connections;
DROP POLICY IF EXISTS "Users can delete own ckb storage connections" ON ckb_storage_connections;

-- Disable RLS for AI form assistance tables
ALTER TABLE ai_form_assistance_sessions DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own ai form assistance sessions" ON ai_form_assistance_sessions;
DROP POLICY IF EXISTS "Users can insert own ai form assistance sessions" ON ai_form_assistance_sessions;
DROP POLICY IF EXISTS "Users can update own ai form assistance sessions" ON ai_form_assistance_sessions;

ALTER TABLE ai_form_suggestions DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own ai form suggestions" ON ai_form_suggestions;
DROP POLICY IF EXISTS "Users can insert own ai form suggestions" ON ai_form_suggestions;
DROP POLICY IF EXISTS "Users can update own ai form suggestions" ON ai_form_suggestions;

-- Disable RLS for datapoint mappings table
ALTER TABLE datapoint_mappings DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own datapoint mappings" ON datapoint_mappings;
DROP POLICY IF EXISTS "Users can insert own datapoint mappings" ON datapoint_mappings;
DROP POLICY IF EXISTS "Users can update own datapoint mappings" ON datapoint_mappings;

-- Disable RLS for business health snapshots table
ALTER TABLE business_health_snapshots DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own business health snapshots" ON business_health_snapshots;
DROP POLICY IF EXISTS "Users can insert own business health snapshots" ON business_health_snapshots;
DROP POLICY IF EXISTS "Users can update own business health snapshots" ON business_health_snapshots;

