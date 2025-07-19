-- Fix Missing Tables Migration
-- Add tables that are referenced in the frontend but missing from the database

-- Create integration_status table
CREATE TABLE IF NOT EXISTS public.integration_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    integration_slug TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'syncing', 'error', 'connected')),
    last_sync_at TIMESTAMPTZ,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ai_action_card_templates table
CREATE TABLE IF NOT EXISTS public.ai_action_card_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    template_data JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    last_used TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create service_health_logs table
CREATE TABLE IF NOT EXISTS public.service_health_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'down')),
    latency_ms INTEGER,
    error_message TEXT,
    checked_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE public.integration_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_action_card_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_health_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for integration_status
CREATE POLICY "Users can view own integration status" ON public.integration_status
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own integration status" ON public.integration_status
    FOR ALL USING (user_id = auth.uid());

-- RLS Policies for ai_action_card_templates (public read for active templates)
CREATE POLICY "Everyone can view active action card templates" ON public.ai_action_card_templates
    FOR SELECT USING (is_active = true);

-- RLS Policies for service_health_logs (admin only)
CREATE POLICY "Admins can view service health logs" ON public.service_health_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role IN ('admin', 'owner')
        )
    );

-- Insert some default action card templates
INSERT INTO public.ai_action_card_templates (slug, title, description, category, template_data) VALUES
('follow-up-email', 'Follow-up Email', 'Send a follow-up email to a prospect', 'communication', '{"type": "email", "subject": "Following up", "body": "Hi {{name}}, I wanted to follow up on our conversation..."}'),
('schedule-meeting', 'Schedule Meeting', 'Schedule a meeting with a client', 'scheduling', '{"type": "calendar", "duration": 30, "title": "Meeting with {{name}}"}'),
('create-task', 'Create Task', 'Create a new task or to-do item', 'productivity', '{"type": "task", "title": "{{title}}", "description": "{{description}}"}'),
('send-proposal', 'Send Proposal', 'Send a business proposal', 'sales', '{"type": "document", "template": "proposal", "recipient": "{{email}}"}'),
('update-crm', 'Update CRM', 'Update customer information in CRM', 'data', '{"type": "crm_update", "fields": ["status", "notes", "next_action"]}')
ON CONFLICT (slug) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_integration_status_user_id ON public.integration_status(user_id);
CREATE INDEX IF NOT EXISTS idx_integration_status_slug ON public.integration_status(integration_slug);
CREATE INDEX IF NOT EXISTS idx_ai_action_card_templates_active ON public.ai_action_card_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_service_health_logs_service_name ON public.service_health_logs(service_name);
CREATE INDEX IF NOT EXISTS idx_service_health_logs_checked_at ON public.service_health_logs(checked_at); 