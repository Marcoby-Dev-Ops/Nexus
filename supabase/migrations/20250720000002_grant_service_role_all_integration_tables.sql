-- Grant service role access to all integration-related tables
-- This ensures n8n workflows can access all necessary tables for data sync and management

-- Core integration tables
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_integrations') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.user_integrations TO service_role';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'integrations') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.integrations TO service_role';
    END IF;
END $$;

-- Integration data tables
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'integration_data') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.integration_data TO service_role';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'integration_ninjarmm_device_data') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.integration_ninjarmm_device_data TO service_role';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'integration_sync_logs') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.integration_sync_logs TO service_role';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'integration_webhooks') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.integration_webhooks TO service_role';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'integration_data_mappings') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.integration_data_mappings TO service_role';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'integration_sync_status') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.integration_sync_status TO service_role';
    END IF;
END $$;

-- n8n workflow configuration tables
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'n8n_configurations') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.n8n_configurations TO service_role';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'n8n_workflow_configs') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.n8n_workflow_configs TO service_role';
    END IF;
END $$;

-- Analytics and monitoring tables that n8n might need
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'analytics_events') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.analytics_events TO service_role';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'model_usage') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.model_usage TO service_role';
    END IF;
END $$;

-- User and company tables for context
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.user_profiles TO service_role';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'companies') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.companies TO service_role';
    END IF;
END $$;

-- AI-related tables that might be used by n8n workflows
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_agents') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.ai_agents TO service_role';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_insights') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.ai_insights TO service_role';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_action_card_templates') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.ai_action_card_templates TO service_role';
    END IF;
END $$;

-- Business health and KPI tables
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'business_health') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.business_health TO service_role';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_kpi_snapshots') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.ai_kpi_snapshots TO service_role';
    END IF;
END $$;

-- Billing and usage tracking
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_billing_plans') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.user_billing_plans TO service_role';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'billing_plans') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.billing_plans TO service_role';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_usage_tracking') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.chat_usage_tracking TO service_role';
    END IF;
END $$;

-- Integration status and configuration
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'integration_status') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.integration_status TO service_role';
    END IF;
END $$;

-- Legacy integration tables (if they exist)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'secure_integrations') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.secure_integrations TO service_role';
    END IF;
END $$;

-- Standard integration data tables (Email, Ticket, Task, Note, etc.)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Email') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.Email TO service_role';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Ticket') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.Ticket TO service_role';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Task') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.Task TO service_role';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Note') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.Note TO service_role';
    END IF;
END $$;

-- Additional AI and analytics tables
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_audit_logs') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.ai_audit_logs TO service_role';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_document_processing_queue') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.ai_document_processing_queue TO service_role';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_knowledge_analytics') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.ai_knowledge_analytics TO service_role';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_knowledge_gaps') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.ai_knowledge_gaps TO service_role';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_knowledge_relationships') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.ai_knowledge_relationships TO service_role';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_personal_thought_vectors') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.ai_personal_thought_vectors TO service_role';
    END IF;
END $$;

-- Financial and business data tables
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'financial_data') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.financial_data TO service_role';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'financial_metrics') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.financial_metrics TO service_role';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sales_deals') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.sales_deals TO service_role';
    END IF;
END $$;

-- User management and licensing
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_licenses') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.user_licenses TO service_role';
    END IF;
END $$;

-- Stripe and payment processing
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stripe_events') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.stripe_events TO service_role';
    END IF;
END $$;

-- Waitlist and onboarding
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'waitlist_signups') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.waitlist_signups TO service_role';
    END IF;
END $$;

-- Organizations and team management
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizations') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.organizations TO service_role';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_organizations') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.user_organizations TO service_role';
    END IF;
END $$;

-- AI integrations and KPI management
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_integrations') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.ai_integrations TO service_role';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_ops_kpis') THEN
        EXECUTE 'GRANT ALL PRIVILEGES ON TABLE public.ai_ops_kpis TO service_role';
    END IF;
END $$; 