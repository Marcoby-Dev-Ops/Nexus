-- Create a default company for system-level configurations if it doesn't exist.
INSERT INTO public."Company" (id, name, domain, industry)
SELECT
    '00000000-0000-0000-0000-000000000001',
    'Nexus System',
    'system.nexus.com',
    'Internal'
WHERE
    NOT EXISTS (
        SELECT 1 FROM public."Company" WHERE id = '00000000-0000-0000-0000-000000000001'
    );

-- Insert the n8n configuration for the living assessment agent.
-- The webhook_url is a placeholder and should be replaced with the actual n8n webhook URL.
INSERT INTO public.n8n_configurations (company_id, workflow_name, webhook_url)
SELECT
    '00000000-0000-0000-0000-000000000001',
    'living_assessment_agent',
    'https://placeholder.nexus.com/n8n-webhook/1/webhook/living-assessment-agent'
WHERE
    NOT EXISTS (
        SELECT 1 FROM public.n8n_configurations WHERE workflow_name = 'living_assessment_agent'
    ); 