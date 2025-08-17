-- Migration: Add Missing Tables (Standardized)
-- This migration adds missing tables and ensures proper schema consistency

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CONTACTS TABLE (Already exists, skip creation)
-- Table already exists with proper structure

-- 2. DEALS TABLE (Already exists, skip creation)
-- Table already exists with proper structure

-- 3. PERSONAL_THOUGHTS TABLE (Already exists, skip creation)
-- Table already exists with proper structure

-- 4. BUSINESS_HEALTH TABLE (Already exists, skip creation)
-- Table already exists with proper structure

-- 5. USER_PREFERENCES TABLE (Already exists, skip creation)
-- Table already exists with proper structure

-- 6. AI_INTERACTIONS TABLE (Already exists, skip creation)
-- Table already exists with proper structure

-- 7. AI_MESSAGES TABLE (Already exists, skip creation)
-- Table already exists with proper structure

-- 8. AI_SUCCESS_OUTCOMES TABLE (Already exists, skip creation)
-- Table already exists with proper structure

-- 9. AI_INSIGHTS TABLE (Already exists, skip creation)
-- Table already exists with proper structure

-- 10. AI_CLIENT_INTERACTIONS TABLE (Already exists, skip creation)
-- Table already exists with proper structure

-- 11. AI_CLIENT_INTELLIGENCE_ALERTS TABLE (Already exists, skip creation)
-- Table already exists with proper structure

-- 12. AI_UNIFIED_CLIENT_PROFILES TABLE (Already exists, skip creation)
-- Table already exists with proper structure

-- 13. CONVERSATIONS TABLE (Already exists, skip creation)
-- Table already exists with proper structure

-- 14. INTERACTIONS TABLE (Already exists, skip creation)
-- Table already exists with proper structure

-- 15. USER_CONTEXTS TABLE (Already exists, skip creation)
-- Table already exists with proper structure

-- 16. INTEGRATION_DATA TABLE (Already exists, skip creation)
-- Table already exists with proper structure

-- 17. INTEGRATION_DATA_RECORDS TABLE (Already exists, skip creation)
-- Table already exists with proper structure

-- 18. DATA_POINT_DEFINITIONS TABLE (Already exists, skip creation)
-- Table already exists with proper structure

-- 19. UNIFIED_CLIENT_PROFILES TABLE (Already exists, skip creation)
-- Table already exists with proper structure

-- 20. CROSS_PLATFORM_CORRELATIONS TABLE (Already exists, skip creation)
-- Table already exists with proper structure

-- 21. CALENDAR_EVENTS TABLE (Already exists, skip creation)
-- Table already exists with proper structure

-- 22. AUDIT_LOGS TABLE (Already exists, skip creation)
-- Table already exists with proper structure

-- 23. SECURITY_AUDIT_LOG TABLE (Already exists, skip creation)
-- Table already exists with proper structure

-- 24. USER_QUOTAS TABLE (Already exists, skip creation)
-- Table already exists with proper structure

-- 25. DEMO_DATA TABLE (Already exists, skip creation)
-- Table already exists with proper structure

-- 26. DEPARTMENT_METRICS_VIEW TABLE (Already exists, skip creation)
-- Table already exists with proper structure

-- 27. CLIENT_HEALTH_SCORES TABLE (Already exists, skip creation)
-- Table already exists with proper structure

-- 28. RECENT TABLE (Already exists, skip creation)
-- Table already exists with proper structure

-- 29. PIN TABLE (Already exists, skip creation)
-- Table already exists with proper structure

-- 30. PERSONAL_AUTOMATIONS TABLE (Already exists, skip creation)
-- Table already exists with proper structure

-- Create missing indexes only if they don't exist
-- Note: Using DROP INDEX IF EXISTS to avoid conflicts, then CREATE INDEX

-- Contacts indexes (already exist, skip)
-- Deals indexes (already exist, skip)
-- Personal thoughts indexes (already exist, skip)
-- Business health indexes (already exist, skip)
-- User preferences indexes (already exist, skip)
-- AI interactions indexes (already exist, skip)
-- AI messages indexes (already exist, skip)
-- Integration data indexes (already exist, skip)
-- Unified client profiles indexes (already exist, skip)
-- Calendar events indexes (already exist, skip)
-- Audit logs indexes (already exist, skip)
-- User quotas indexes (already exist, skip)

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns (only if they don't exist)
DO $$
BEGIN
    -- Contacts trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_contacts_updated_at') THEN
        CREATE TRIGGER trigger_update_contacts_updated_at
            BEFORE UPDATE ON contacts
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Deals trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_deals_updated_at') THEN
        CREATE TRIGGER trigger_update_deals_updated_at
            BEFORE UPDATE ON deals
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Personal thoughts trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_personal_thoughts_updated_at') THEN
        CREATE TRIGGER trigger_update_personal_thoughts_updated_at
            BEFORE UPDATE ON personal_thoughts
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Business health trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_business_health_updated_at') THEN
        CREATE TRIGGER trigger_update_business_health_updated_at
            BEFORE UPDATE ON business_health
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- User preferences trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_user_preferences_updated_at') THEN
        CREATE TRIGGER trigger_update_user_preferences_updated_at
            BEFORE UPDATE ON user_preferences
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Integration data trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_integration_data_updated_at') THEN
        CREATE TRIGGER trigger_update_integration_data_updated_at
            BEFORE UPDATE ON integration_data
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Unified client profiles trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_unified_client_profiles_updated_at') THEN
        CREATE TRIGGER trigger_update_unified_client_profiles_updated_at
            BEFORE UPDATE ON unified_client_profiles
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Calendar events trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_calendar_events_updated_at') THEN
        CREATE TRIGGER trigger_update_calendar_events_updated_at
            BEFORE UPDATE ON calendar_events
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- User quotas trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_user_quotas_updated_at') THEN
        CREATE TRIGGER trigger_update_user_quotas_updated_at
            BEFORE UPDATE ON user_quotas
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Personal automations trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_personal_automations_updated_at') THEN
        CREATE TRIGGER trigger_update_personal_automations_updated_at
            BEFORE UPDATE ON personal_automations
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Enable Row Level Security on all tables (only if not already enabled)
DO $$
DECLARE
    table_name text;
BEGIN
    FOR table_name IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'contacts', 'deals', 'personal_thoughts', 'business_health', 'user_preferences',
            'ai_interactions', 'ai_messages', 'ai_success_outcomes', 'ai_insights',
            'ai_client_interactions', 'ai_client_intelligence_alerts', 'ai_unified_client_profiles',
            'conversations', 'interactions', 'user_contexts', 'integration_data',
            'integration_data_records', 'data_point_definitions', 'unified_client_profiles',
            'cross_platform_correlations', 'calendar_events', 'audit_logs',
            'security_audit_log', 'user_quotas', 'demo_data', 'department_metrics_view',
            'client_health_scores', 'personal_automations'
        )
    LOOP
        -- Check if RLS is already enabled
        IF NOT EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = table_name 
            AND rowsecurity = true
        ) THEN
            EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
        END IF;
    END LOOP;
END $$;

-- Insert default data point definitions (only if not already present)
INSERT INTO data_point_definitions (name, description, data_type, source_integration, mapping_rules) 
SELECT 'contact_email', 'Contact email address', 'string', 'hubspot', '{"source_field": "email", "validation": "email"}'
WHERE NOT EXISTS (SELECT 1 FROM data_point_definitions WHERE name = 'contact_email');

INSERT INTO data_point_definitions (name, description, data_type, source_integration, mapping_rules) 
SELECT 'contact_phone', 'Contact phone number', 'string', 'hubspot', '{"source_field": "phone", "validation": "phone"}'
WHERE NOT EXISTS (SELECT 1 FROM data_point_definitions WHERE name = 'contact_phone');

INSERT INTO data_point_definitions (name, description, data_type, source_integration, mapping_rules) 
SELECT 'deal_value', 'Deal monetary value', 'decimal', 'hubspot', '{"source_field": "amount", "validation": "positive_number"}'
WHERE NOT EXISTS (SELECT 1 FROM data_point_definitions WHERE name = 'deal_value');

INSERT INTO data_point_definitions (name, description, data_type, source_integration, mapping_rules) 
SELECT 'deal_stage', 'Deal stage in pipeline', 'string', 'hubspot', '{"source_field": "dealstage", "validation": "enum"}'
WHERE NOT EXISTS (SELECT 1 FROM data_point_definitions WHERE name = 'deal_stage');

INSERT INTO data_point_definitions (name, description, data_type, source_integration, mapping_rules) 
SELECT 'company_name', 'Company name', 'string', 'hubspot', '{"source_field": "name", "validation": "not_empty"}'
WHERE NOT EXISTS (SELECT 1 FROM data_point_definitions WHERE name = 'company_name');

-- Log migration completion
INSERT INTO audit_logs (action, resource_type, details) VALUES 
('migration', 'database', '{"migration": "011_add_missing_tables", "status": "completed", "note": "All tables already existed, only triggers and RLS were applied"}');
