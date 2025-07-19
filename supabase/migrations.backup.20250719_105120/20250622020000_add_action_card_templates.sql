-- Create ai_action_card_templates table for slash commands
CREATE TABLE IF NOT EXISTS public.ai_action_card_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    slug TEXT NOT NULL UNIQUE, -- for slash commands like 'create-task'
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    is_active BOOLEAN DEFAULT TRUE,
    template_data JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Add trigger for updated_at
CREATE TRIGGER update_ai_action_card_templates_updated_at
    BEFORE UPDATE ON public.ai_action_card_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.ai_action_card_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies - templates are global and viewable by all authenticated users
CREATE POLICY "Authenticated users can view action card templates" ON public.ai_action_card_templates
    FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = TRUE);

-- Only service role can manage templates
CREATE POLICY "Service role can manage action card templates" ON public.ai_action_card_templates
    FOR ALL USING (auth.role() = 'service_role');

-- Insert default Action Card templates for slash commands
INSERT INTO public.ai_action_card_templates (slug, title, description, category, template_data) VALUES
('create-task', 'Create Task', 'Create a task in your project management tool', 'productivity', 
 '{"actions": [{"id": "create_task", "label": "Create Task", "eventType": "create_task"}], "integrations": ["asana", "trello", "notion"]}'::jsonb),

('send-invoice', 'Send Invoice', 'Send a Stripe invoice to a customer', 'finance', 
 '{"actions": [{"id": "send_invoice", "label": "Send Invoice", "eventType": "send_invoice"}], "integrations": ["stripe"]}'::jsonb),

('update-crm', 'Update CRM', 'Update a customer record in HubSpot', 'sales', 
 '{"actions": [{"id": "update_crm", "label": "Update Contact", "eventType": "update_crm"}], "integrations": ["hubspot"]}'::jsonb),

('run-report', 'Generate Report', 'Generate a business health report', 'analytics', 
 '{"actions": [{"id": "run_report", "label": "Generate Report", "eventType": "run_report"}], "integrations": ["internal"]}'::jsonb),

('schedule-meeting', 'Schedule Meeting', 'Schedule a meeting with calendar integration', 'productivity', 
 '{"actions": [{"id": "schedule_meeting", "label": "Schedule Meeting", "eventType": "schedule_meeting"}], "integrations": ["calendar", "zoom"]}'::jsonb),

('send-email', 'Send Email', 'Send a templated email to contacts', 'communication', 
 '{"actions": [{"id": "send_email", "label": "Send Email", "eventType": "send_email"}], "integrations": ["mailchimp", "sendgrid"]}'::jsonb),

('create-proposal', 'Create Proposal', 'Generate a sales proposal document', 'sales', 
 '{"actions": [{"id": "create_proposal", "label": "Create Proposal", "eventType": "create_proposal"}], "integrations": ["docusign", "pandadoc"]}'::jsonb),

('sync-data', 'Sync Data', 'Synchronize data between connected platforms', 'integration', 
 '{"actions": [{"id": "sync_data", "label": "Sync Now", "eventType": "sync_data"}], "integrations": ["zapier", "n8n"]}'::jsonb);

-- Create index for fast slug lookups
CREATE INDEX idx_ai_action_card_templates_slug ON public.ai_action_card_templates(slug);
CREATE INDEX idx_ai_action_card_templates_category ON public.ai_action_card_templates(category);
CREATE INDEX idx_ai_action_card_templates_active ON public.ai_action_card_templates(is_active); 