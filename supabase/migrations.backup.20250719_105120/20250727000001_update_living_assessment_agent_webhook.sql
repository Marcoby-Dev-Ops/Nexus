-- Update the n8n configuration with the real webhook URL for the living assessment agent
UPDATE public.n8n_configurations 
SET webhook_url = 'https://automate.marcoby.net/webhook/living-assessment-agent'
WHERE workflow_name = 'living_assessment_agent'; 