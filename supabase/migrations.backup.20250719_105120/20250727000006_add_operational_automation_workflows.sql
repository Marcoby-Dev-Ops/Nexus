-- Add Operational Automation n8n workflow configurations

-- Operations Playbook Automation workflow
INSERT INTO n8n_workflow_configs (
    workflow_name,
    workflow_id,
    webhook_url,
    description,
    is_active,
    company_id
) VALUES (
    'operations_playbook_automation',
    'zqsJDWTJeHELabv7',
    'https://automate.marcoby.net/webhook/operations-playbook-automation',
    'Intelligent operations automation that analyzes KPI performance, identifies underperforming metrics, and automatically queues appropriate playbooks for execution',
    true,
    '00000000-0000-0000-0000-000000000001'
) ON CONFLICT (workflow_name, company_id) DO UPDATE SET
    workflow_id = EXCLUDED.workflow_id,
    webhook_url = EXCLUDED.webhook_url,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- AI Customer Onboarding Orchestrator workflow
INSERT INTO n8n_workflow_configs (
    workflow_name,
    workflow_id,
    webhook_url,
    description,
    is_active,
    company_id
) VALUES (
    'ai_customer_onboarding_orchestrator',
    'Yh8g8WndPJWCFrHM',
    'https://automate.marcoby.net/webhook/ai-customer-onboarding',
    'Personalized AI-driven customer onboarding that analyzes customer data, creates tailored onboarding plans, and automates follow-up sequences for optimal customer success',
    true,
    '00000000-0000-0000-0000-000000000001'
) ON CONFLICT (workflow_name, company_id) DO UPDATE SET
    workflow_id = EXCLUDED.workflow_id,
    webhook_url = EXCLUDED.webhook_url,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Add comments for operational context
COMMENT ON TABLE n8n_workflow_configs IS 'Configuration and metadata for n8n workflow integrations with Nexus automation systems';
COMMENT ON COLUMN n8n_workflow_configs.workflow_name IS 'Unique identifier for the workflow within Nexus ecosystem';
COMMENT ON COLUMN n8n_workflow_configs.webhook_url IS 'Full webhook URL for triggering the n8n workflow from Nexus components';
COMMENT ON COLUMN n8n_workflow_configs.description IS 'Human-readable description of workflow purpose and functionality'; 