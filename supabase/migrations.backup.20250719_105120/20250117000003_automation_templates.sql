-- Create automation templates table
CREATE TABLE IF NOT EXISTS public.automation_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('sales', 'marketing', 'finance', 'operations', 'customer_success', 'general')),
    source VARCHAR(20) NOT NULL CHECK (source IN ('zapier', 'make', 'n8n', 'custom', 'nexus')),
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    estimated_setup_time INTEGER NOT NULL DEFAULT 15, -- minutes
    time_savings_per_week INTEGER NOT NULL DEFAULT 2, -- hours
    required_integrations TEXT[] NOT NULL DEFAULT '{}',
    template_data JSONB NOT NULL,
    nexus_workflow JSONB,
    nexus_workflow_id VARCHAR(255),
    conversion_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (conversion_status IN ('pending', 'converted', 'failed')),
    tags TEXT[] NOT NULL DEFAULT '{}',
    rating DECIMAL(3,2) NOT NULL DEFAULT 4.0,
    downloads INTEGER NOT NULL DEFAULT 0,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create template deployments table
CREATE TABLE IF NOT EXISTS public.template_deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES public.automation_templates(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    workflow_id VARCHAR(255) NOT NULL,
    customizations JSONB DEFAULT '{}',
    deployment_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (deployment_status IN ('active', 'paused', 'failed', 'deleted')),
    deployed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_executed_at TIMESTAMP WITH TIME ZONE,
    execution_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0
);

-- Create template ratings table
CREATE TABLE IF NOT EXISTS public.template_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES public.automation_templates(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(template_id, user_id)
);

-- Create template usage analytics table
CREATE TABLE IF NOT EXISTS public.template_usage_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES public.automation_templates(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('view', 'download', 'deploy', 'execute', 'error')),
    event_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_automation_templates_category ON public.automation_templates(category);
CREATE INDEX IF NOT EXISTS idx_automation_templates_source ON public.automation_templates(source);
CREATE INDEX IF NOT EXISTS idx_automation_templates_difficulty ON public.automation_templates(difficulty);
CREATE INDEX IF NOT EXISTS idx_automation_templates_downloads ON public.automation_templates(downloads DESC);
CREATE INDEX IF NOT EXISTS idx_automation_templates_rating ON public.automation_templates(rating DESC);
CREATE INDEX IF NOT EXISTS idx_automation_templates_created_at ON public.automation_templates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_automation_templates_tags ON public.automation_templates USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_automation_templates_required_integrations ON public.automation_templates USING GIN(required_integrations);

CREATE INDEX IF NOT EXISTS idx_template_deployments_user_id ON public.template_deployments(user_id);
CREATE INDEX IF NOT EXISTS idx_template_deployments_template_id ON public.template_deployments(template_id);
CREATE INDEX IF NOT EXISTS idx_template_deployments_status ON public.template_deployments(deployment_status);
CREATE INDEX IF NOT EXISTS idx_template_deployments_deployed_at ON public.template_deployments(deployed_at DESC);

CREATE INDEX IF NOT EXISTS idx_template_ratings_template_id ON public.template_ratings(template_id);
CREATE INDEX IF NOT EXISTS idx_template_ratings_user_id ON public.template_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_template_ratings_rating ON public.template_ratings(rating DESC);

CREATE INDEX IF NOT EXISTS idx_template_usage_analytics_template_id ON public.template_usage_analytics(template_id);
CREATE INDEX IF NOT EXISTS idx_template_usage_analytics_user_id ON public.template_usage_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_template_usage_analytics_event_type ON public.template_usage_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_template_usage_analytics_created_at ON public.template_usage_analytics(created_at DESC);

-- Create function to update template ratings
CREATE OR REPLACE FUNCTION update_template_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.automation_templates
    SET rating = (
        SELECT AVG(rating)::DECIMAL(3,2)
        FROM public.template_ratings
        WHERE template_id = NEW.template_id
    )
    WHERE id = NEW.template_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for rating updates
DROP TRIGGER IF EXISTS trigger_update_template_rating ON public.template_ratings;
CREATE TRIGGER trigger_update_template_rating
    AFTER INSERT OR UPDATE OR DELETE ON public.template_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_template_rating();

-- Create function to track template usage
CREATE OR REPLACE FUNCTION track_template_usage(
    p_template_id UUID,
    p_user_id UUID,
    p_event_type VARCHAR(50),
    p_event_data JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.template_usage_analytics (template_id, user_id, event_type, event_data)
    VALUES (p_template_id, p_user_id, p_event_type, p_event_data);
    
    -- Update download count for download events
    IF p_event_type = 'download' THEN
        UPDATE public.automation_templates
        SET downloads = downloads + 1
        WHERE id = p_template_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create RLS policies
ALTER TABLE public.automation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_usage_analytics ENABLE ROW LEVEL SECURITY;

-- Templates are readable by all authenticated users
CREATE POLICY "Templates are readable by authenticated users"
    ON public.automation_templates FOR SELECT
    TO authenticated
    USING (true);

-- Templates can be created by authenticated users
CREATE POLICY "Templates can be created by authenticated users"
    ON public.automation_templates FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

-- Templates can be updated by their creators
CREATE POLICY "Templates can be updated by creators"
    ON public.automation_templates FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by);

-- Templates can be deleted by their creators
CREATE POLICY "Templates can be deleted by creators"
    ON public.automation_templates FOR DELETE
    TO authenticated
    USING (auth.uid() = created_by);

-- Deployments are readable by their owners
CREATE POLICY "Deployments are readable by owners"
    ON public.template_deployments FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Deployments can be created by authenticated users
CREATE POLICY "Deployments can be created by authenticated users"
    ON public.template_deployments FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Deployments can be updated by their owners
CREATE POLICY "Deployments can be updated by owners"
    ON public.template_deployments FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- Deployments can be deleted by their owners
CREATE POLICY "Deployments can be deleted by owners"
    ON public.template_deployments FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Ratings are readable by all authenticated users
CREATE POLICY "Ratings are readable by authenticated users"
    ON public.template_ratings FOR SELECT
    TO authenticated
    USING (true);

-- Ratings can be created by authenticated users
CREATE POLICY "Ratings can be created by authenticated users"
    ON public.template_ratings FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Ratings can be updated by their creators
CREATE POLICY "Ratings can be updated by creators"
    ON public.template_ratings FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- Ratings can be deleted by their creators
CREATE POLICY "Ratings can be deleted by creators"
    ON public.template_ratings FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Usage analytics are readable by template creators and users
CREATE POLICY "Usage analytics are readable by relevant users"
    ON public.template_usage_analytics FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id OR
        auth.uid() IN (
            SELECT created_by FROM public.automation_templates
            WHERE id = template_id
        )
    );

-- Usage analytics can be created by authenticated users
CREATE POLICY "Usage analytics can be created by authenticated users"
    ON public.template_usage_analytics FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Insert some sample templates
INSERT INTO public.automation_templates (
    name, description, category, source, difficulty, estimated_setup_time, time_savings_per_week,
    required_integrations, template_data, conversion_status, tags, rating, downloads, created_by
) VALUES
(
    'Zapier Lead Capture to HubSpot',
    'Automatically capture leads from web forms and add them to HubSpot CRM',
    'sales',
    'zapier',
    'beginner',
    10,
    3,
    ARRAY['hubspot', 'webhook'],
    '{"trigger": {"app": "webhook", "event": "form_submission"}, "steps": [{"app": "hubspot", "action": "create_contact"}]}'::jsonb,
    'converted',
    ARRAY['lead capture', 'crm', 'automation'],
    4.5,
    156,
    NULL
),
(
    'Make.com Invoice Processing',
    'Process invoices from email attachments and create records in accounting software',
    'finance',
    'make',
    'intermediate',
    25,
    5,
    ARRAY['gmail', 'quickbooks', 'stripe'],
    '{"modules": [{"app": "gmail", "module": "watch_emails"}, {"app": "quickbooks", "module": "create_invoice"}]}'::jsonb,
    'converted',
    ARRAY['invoice', 'accounting', 'email processing'],
    4.2,
    89,
    NULL
),
(
    'n8n Customer Support Ticket Router',
    'Automatically route support tickets based on content and urgency',
    'customer_success',
    'n8n',
    'advanced',
    30,
    8,
    ARRAY['slack', 'zendesk', 'openai'],
    '{"nodes": [{"type": "webhook"}, {"type": "openai"}, {"type": "slack"}], "connections": {}}'::jsonb,
    'converted',
    ARRAY['support', 'ai', 'routing'],
    4.8,
    234,
    NULL
),
(
    'Nexus Sales Pipeline Automation',
    'Complete sales pipeline automation with lead scoring and nurturing',
    'sales',
    'nexus',
    'intermediate',
    15,
    6,
    ARRAY['hubspot', 'mailchimp', 'slack'],
    '{"type": "nexus_workflow", "workflow_id": "sales_pipeline_v2"}'::jsonb,
    'converted',
    ARRAY['sales', 'pipeline', 'nurturing'],
    4.9,
    445,
    NULL
);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.automation_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.template_deployments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.template_ratings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.template_usage_analytics TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated; 