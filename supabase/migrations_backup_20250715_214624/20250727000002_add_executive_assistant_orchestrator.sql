-- Add Executive Assistant Orchestrator workflow configuration
INSERT INTO n8n_workflow_configs (
    workflow_name,
    workflow_id,
    webhook_url,
    description,
    is_active,
    company_id
) VALUES (
    'executive_assistant_orchestrator',
    'TKKH4ReC59g6jvzn',
    'https://automate.marcoby.net/webhook/executive-assistant-orchestrator',
    'Intelligent routing system for executive assistant queries - classifies intent and routes to appropriate processing pipelines',
    true,
    '00000000-0000-0000-0000-000000000001'
) ON CONFLICT (workflow_name, company_id) DO UPDATE SET
    workflow_id = EXCLUDED.workflow_id,
    webhook_url = EXCLUDED.webhook_url,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    updated_at = NOW(); 