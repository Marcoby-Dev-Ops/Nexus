-- Add Operational n8n workflow configurations

-- Business Health Monitor workflow
INSERT INTO n8n_workflow_configs (
    workflow_name,
    workflow_id,
    webhook_url,
    description,
    is_active,
    company_id
) VALUES (
    'business_health_monitor',
    'EMHDpo4dwLogSp8n',
    'https://automate.marcoby.net/webhook/business-health-monitor',
    'Daily monitoring system that analyzes integration health, identifies stale KPIs, and creates proactive alerts for business continuity',
    true,
    '00000000-0000-0000-0000-000000000001'
) ON CONFLICT (workflow_name, company_id) DO UPDATE SET
    workflow_id = EXCLUDED.workflow_id,
    webhook_url = EXCLUDED.webhook_url,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Integration Data Sync Orchestrator workflow
INSERT INTO n8n_workflow_configs (
    workflow_name,
    workflow_id,
    webhook_url,
    description,
    is_active,
    company_id
) VALUES (
    'integration_data_sync_orchestrator',
    'wi0vI35N4whRwmXY',
    'https://automate.marcoby.net/webhook/integration-data-sync',
    'Intelligent sync orchestrator that analyzes integration requests, optimizes sync strategies, transforms data, and updates KPIs automatically',
    true,
    '00000000-0000-0000-0000-000000000001'
) ON CONFLICT (workflow_name, company_id) DO UPDATE SET
    workflow_id = EXCLUDED.workflow_id,
    webhook_url = EXCLUDED.webhook_url,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    updated_at = NOW(); 