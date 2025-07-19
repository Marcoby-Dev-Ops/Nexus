-- Add Thought Management n8n workflow configurations

-- Intelligent Thought Processor workflow
INSERT INTO n8n_workflow_configs (
    workflow_name,
    workflow_id,
    webhook_url,
    description,
    is_active,
    company_id
) VALUES (
    'intelligent_thought_processor',
    '0Jf1sSOYJoJgl0Oj',
    'https://automate.marcoby.net/webhook/intelligent-thought-processor',
    'Advanced AI analysis of thoughts - generates insights, tasks, reminders, and priority scoring automatically when thoughts are created or updated',
    true,
    '00000000-0000-0000-0000-000000000001'
) ON CONFLICT (workflow_name, company_id) DO UPDATE SET
    workflow_id = EXCLUDED.workflow_id,
    webhook_url = EXCLUDED.webhook_url,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Thought Progress Monitor workflow  
INSERT INTO n8n_workflow_configs (
    workflow_name,
    workflow_id,
    webhook_url,
    description,
    is_active,
    company_id
) VALUES (
    'thought_progress_monitor',
    'tXhHwAI8U9AD9fqD',
    'https://automate.marcoby.net/webhook/thought-progress-monitor',
    'Daily automated monitoring of thought progress - identifies stale tasks, overdue reminders, and ideas needing action with intelligent follow-up suggestions',
    true,
    '00000000-0000-0000-0000-000000000001'
) ON CONFLICT (workflow_name, company_id) DO UPDATE SET
    workflow_id = EXCLUDED.workflow_id,
    webhook_url = EXCLUDED.webhook_url,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    updated_at = NOW(); 