-- Add Smart Thought Deduplication workflow configuration

INSERT INTO n8n_workflow_configs (
    workflow_name,
    workflow_id,
    webhook_url,
    description,
    is_active,
    company_id
) VALUES (
    'smart_thought_deduplication',
    'Nh7Bgp6H9vQ59X1v',
    'https://automate.marcoby.net/webhook/smart-thought-deduplication',
    'Intelligent deduplication system that analyzes new thoughts against existing ones to identify duplicates, updates, or related ideas before creation',
    true,
    '00000000-0000-0000-0000-000000000001'
) ON CONFLICT (workflow_name, company_id) DO UPDATE SET
    workflow_id = EXCLUDED.workflow_id,
    webhook_url = EXCLUDED.webhook_url,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    updated_at = NOW(); 