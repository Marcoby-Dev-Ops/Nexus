-- Grant service role access to existing tables only
-- This migration only grants permissions to tables that are confirmed to exist

-- Core integration tables (confirmed to exist)
GRANT ALL PRIVILEGES ON TABLE public.user_integrations TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.integrations TO service_role;

-- Integration data tables (confirmed to exist)
GRANT ALL PRIVILEGES ON TABLE public.integration_data TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.integration_ninjarmm_device_data TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.integration_sync_logs TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.integration_webhooks TO service_role;

-- n8n workflow configuration tables (confirmed to exist)
GRANT ALL PRIVILEGES ON TABLE public.n8n_configurations TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.n8n_workflow_configs TO service_role;

-- User and company tables (confirmed to exist)
GRANT ALL PRIVILEGES ON TABLE public.user_profiles TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.companies TO service_role;

-- Integration status and configuration (confirmed to exist)
GRANT ALL PRIVILEGES ON TABLE public.integration_status TO service_role;

-- Billing and usage tracking (confirmed to exist)
GRANT ALL PRIVILEGES ON TABLE public.user_billing_plans TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.billing_plans TO service_role;

-- Business health and analytics (confirmed to exist)
GRANT ALL PRIVILEGES ON TABLE public.business_health TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.ai_insights TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.ai_action_card_templates TO service_role;

-- AI-related tables (confirmed to exist)
GRANT ALL PRIVILEGES ON TABLE public.ai_agents TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.ai_kpi_snapshots TO service_role;

-- Usage tracking (confirmed to exist)
GRANT ALL PRIVILEGES ON TABLE public.chat_usage_tracking TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.model_usage TO service_role;

-- Analytics events (confirmed to exist)
GRANT ALL PRIVILEGES ON TABLE public.analytics_events TO service_role;

-- Manual data tables (confirmed to exist)
GRANT ALL PRIVILEGES ON TABLE public.manual_contacts TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.manual_documents TO service_role;

-- AI inbox and processing (confirmed to exist)
GRANT ALL PRIVILEGES ON TABLE public.ai_inbox_items TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.ai_inbox_item_folders TO service_role;

-- AI knowledge and analytics (confirmed to exist)
GRANT ALL PRIVILEGES ON TABLE public.ai_knowledge_analytics TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.ai_knowledge_gaps TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.ai_knowledge_relationships TO service_role;

-- AI document processing (confirmed to exist)
GRANT ALL PRIVILEGES ON TABLE public.ai_document_processing_queue TO service_role;

-- AI personal data (confirmed to exist)
GRANT ALL PRIVILEGES ON TABLE public.ai_personal_thought_vectors TO service_role;

-- AI audit and management (confirmed to exist)
GRANT ALL PRIVILEGES ON TABLE public.ai_audit_logs TO service_role;

-- User management and licensing (confirmed to exist)
GRANT ALL PRIVILEGES ON TABLE public.user_licenses TO service_role;

-- Stripe and payment processing (confirmed to exist)
GRANT ALL PRIVILEGES ON TABLE public.stripe_events TO service_role;

-- Waitlist and onboarding (confirmed to exist)
GRANT ALL PRIVILEGES ON TABLE public.waitlist_signups TO service_role;

-- Organizations and team management (confirmed to exist)
GRANT ALL PRIVILEGES ON TABLE public.organizations TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.user_organizations TO service_role;

-- AI integrations and KPI management (confirmed to exist)
GRANT ALL PRIVILEGES ON TABLE public.ai_integrations TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.ai_ops_kpis TO service_role;

-- Financial and business data (confirmed to exist)
GRANT ALL PRIVILEGES ON TABLE public.financial_data TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.financial_metrics TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.sales_deals TO service_role;

-- Standard integration data tables (confirmed to exist)
GRANT ALL PRIVILEGES ON TABLE public.Email TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.Ticket TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.Task TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.Note TO service_role;

-- Legacy integration tables (confirmed to exist)
GRANT ALL PRIVILEGES ON TABLE public.secure_integrations TO service_role;

-- Integration data mappings (confirmed to exist)
GRANT ALL PRIVILEGES ON TABLE public.integration_data_mappings TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.integration_sync_status TO service_role; 