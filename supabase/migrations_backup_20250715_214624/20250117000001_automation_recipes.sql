-- Create automation_recipes table
CREATE TABLE IF NOT EXISTS automation_recipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('sales', 'marketing', 'finance', 'operations', 'customer_success')),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    estimated_time TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    benefits TEXT[] DEFAULT '{}',
    prerequisites TEXT[] DEFAULT '{}',
    icon TEXT DEFAULT '🔧',
    
    -- Workflow configuration
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('webhook', 'schedule', 'manual', 'email')),
    schedule_expression TEXT, -- For scheduled workflows (cron expression)
    integrations TEXT[] DEFAULT '{}',
    actions JSONB DEFAULT '[]',
    
    -- Customization options
    customization_options JSONB DEFAULT '[]',
    
    -- Success metrics
    success_metrics TEXT[] DEFAULT '{}',
    
    -- Status and metadata
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    average_rating NUMERIC(3,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create automation_recipe_deployments table
CREATE TABLE IF NOT EXISTS automation_recipe_deployments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipe_id UUID NOT NULL REFERENCES automation_recipes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    workflow_id TEXT NOT NULL, -- n8n workflow ID
    webhook_url TEXT,
    
    -- Configuration
    customizations JSONB DEFAULT '{}',
    
    -- Status tracking
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'deployed', 'active', 'paused', 'failed')),
    deployed_at TIMESTAMPTZ DEFAULT NOW(),
    last_executed TIMESTAMPTZ,
    execution_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create automation_recipe_executions table for tracking
CREATE TABLE IF NOT EXISTS automation_recipe_executions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deployment_id UUID NOT NULL REFERENCES automation_recipe_deployments(id) ON DELETE CASCADE,
    execution_id TEXT, -- n8n execution ID
    status TEXT NOT NULL CHECK (status IN ('running', 'success', 'failed', 'cancelled')),
    trigger_data JSONB,
    result_data JSONB,
    error_message TEXT,
    duration_ms INTEGER,
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create automation_recipe_ratings table
CREATE TABLE IF NOT EXISTS automation_recipe_ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipe_id UUID NOT NULL REFERENCES automation_recipes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(recipe_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_automation_recipes_category ON automation_recipes(category);
CREATE INDEX idx_automation_recipes_difficulty ON automation_recipes(difficulty);
CREATE INDEX idx_automation_recipes_usage_count ON automation_recipes(usage_count DESC);
CREATE INDEX idx_automation_recipes_active ON automation_recipes(is_active);

CREATE INDEX idx_automation_recipe_deployments_user ON automation_recipe_deployments(user_id);
CREATE INDEX idx_automation_recipe_deployments_recipe ON automation_recipe_deployments(recipe_id);
CREATE INDEX idx_automation_recipe_deployments_status ON automation_recipe_deployments(status);

CREATE INDEX idx_automation_recipe_executions_deployment ON automation_recipe_executions(deployment_id);
CREATE INDEX idx_automation_recipe_executions_status ON automation_recipe_executions(status);
CREATE INDEX idx_automation_recipe_executions_executed_at ON automation_recipe_executions(executed_at DESC);

-- Enable RLS
ALTER TABLE automation_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_recipe_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_recipe_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_recipe_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for automation_recipes (viewable by all authenticated users)
CREATE POLICY "Authenticated users can view active recipes"
    ON automation_recipes FOR SELECT
    USING (auth.uid() IS NOT NULL AND is_active = TRUE);

CREATE POLICY "Service role can manage recipes"
    ON automation_recipes FOR ALL
    USING (auth.role() = 'service_role');

-- RLS Policies for automation_recipe_deployments
CREATE POLICY "Users can view their own deployments"
    ON automation_recipe_deployments FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own deployments"
    ON automation_recipe_deployments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own deployments"
    ON automation_recipe_deployments FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own deployments"
    ON automation_recipe_deployments FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for automation_recipe_executions
CREATE POLICY "Users can view executions of their deployments"
    ON automation_recipe_executions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM automation_recipe_deployments 
            WHERE id = deployment_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert executions"
    ON automation_recipe_executions FOR INSERT
    WITH CHECK (TRUE); -- Allow system to insert execution records

-- RLS Policies for automation_recipe_ratings
CREATE POLICY "Users can view all ratings"
    ON automation_recipe_ratings FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage their own ratings"
    ON automation_recipe_ratings FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Functions for automation recipes
CREATE OR REPLACE FUNCTION increment_recipe_usage_count(recipe_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE automation_recipes 
    SET usage_count = usage_count + 1, updated_at = NOW()
    WHERE id = recipe_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_recipe_rating(recipe_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE automation_recipes 
    SET 
        average_rating = (
            SELECT AVG(rating)::NUMERIC(3,2) 
            FROM automation_recipe_ratings 
            WHERE recipe_id = update_recipe_rating.recipe_id
        ),
        updated_at = NOW()
    WHERE id = recipe_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update recipe ratings
CREATE OR REPLACE FUNCTION trigger_update_recipe_rating()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        PERFORM update_recipe_rating(NEW.recipe_id);
    END IF;
    IF TG_OP = 'DELETE' THEN
        PERFORM update_recipe_rating(OLD.recipe_id);
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_automation_recipe_rating_change
    AFTER INSERT OR UPDATE OR DELETE ON automation_recipe_ratings
    FOR EACH ROW EXECUTE FUNCTION trigger_update_recipe_rating();

-- Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_automation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_automation_recipes_updated_at
    BEFORE UPDATE ON automation_recipes
    FOR EACH ROW EXECUTE FUNCTION update_automation_updated_at();

CREATE TRIGGER trigger_automation_recipe_deployments_updated_at
    BEFORE UPDATE ON automation_recipe_deployments
    FOR EACH ROW EXECUTE FUNCTION update_automation_updated_at();

-- Insert default starter recipes
INSERT INTO automation_recipes (
    id, name, description, category, difficulty, estimated_time, tags, benefits, prerequisites, icon,
    trigger_type, integrations, actions, customization_options, success_metrics
) VALUES 
(
    'client-onboarding',
    'Client Onboarding Automation',
    'Automatically onboard new clients with welcome emails, document collection, and task creation.',
    'operations',
    'easy',
    '15 minutes',
    ARRAY['onboarding', 'welcome', 'automation'],
    ARRAY['Save 2 hours per client', 'Consistent experience', 'Reduced manual work'],
    ARRAY['Email integration', 'CRM connection'],
    '🎯',
    'webhook',
    ARRAY['hubspot', 'email'],
    '[
        {
            "id": "send-welcome-email",
            "type": "email",
            "name": "Send Welcome Email",
            "description": "Send personalized welcome email to new client",
            "parameters": {
                "subject": "Welcome to {{company_name}}!",
                "template": "welcome-template"
            },
            "customizable": true,
            "required": true
        },
        {
            "id": "create-crm-contact",
            "type": "integration",
            "name": "Create CRM Contact",
            "description": "Add client to CRM system",
            "parameters": {
                "integration": "hubspot",
                "action": "create_contact"
            },
            "customizable": false,
            "required": true
        }
    ]'::jsonb,
    '[
        {
            "id": "company_name",
            "name": "Company Name",
            "description": "Your company name for personalization",
            "type": "text",
            "required": true,
            "placeholder": "Enter your company name"
        },
        {
            "id": "welcome_email_template",
            "name": "Welcome Email Template",
            "description": "Choose welcome email template",
            "type": "select",
            "options": ["formal", "casual", "custom"],
            "defaultValue": "formal",
            "required": true
        }
    ]'::jsonb,
    ARRAY['Email delivery rate', 'Client response rate', 'Onboarding completion time']
),
(
    'invoice-processing',
    'Invoice Processing Workflow',
    'Automatically process invoices from creation to payment tracking.',
    'finance',
    'medium',
    '20 minutes',
    ARRAY['invoicing', 'payments', 'finance'],
    ARRAY['Faster payment cycles', 'Reduced errors', 'Better cash flow'],
    ARRAY['Stripe integration', 'Accounting software'],
    '💰',
    'webhook',
    ARRAY['stripe', 'quickbooks'],
    '[
        {
            "id": "create-invoice",
            "type": "integration",
            "name": "Create Invoice",
            "description": "Generate invoice in accounting system",
            "parameters": {
                "integration": "stripe",
                "action": "create_invoice"
            },
            "customizable": true,
            "required": true
        },
        {
            "id": "send-invoice-email",
            "type": "email",
            "name": "Send Invoice Email",
            "description": "Email invoice to client",
            "parameters": {
                "subject": "Invoice {{invoice_number}} from {{company_name}}",
                "template": "invoice-template"
            },
            "customizable": true,
            "required": true
        }
    ]'::jsonb,
    '[
        {
            "id": "payment_terms",
            "name": "Payment Terms",
            "description": "Default payment terms in days",
            "type": "select",
            "options": ["15", "30", "45", "60"],
            "defaultValue": "30",
            "required": true
        },
        {
            "id": "late_fee_percentage",
            "name": "Late Fee Percentage",
            "description": "Late fee percentage for overdue invoices",
            "type": "number",
            "defaultValue": 1.5,
            "required": false
        }
    ]'::jsonb,
    ARRAY['Invoice processing time', 'Payment collection rate', 'Late payment reduction']
),
(
    'lead-nurturing',
    'Lead Nurturing Sequence',
    'Automated email sequence to nurture leads through the sales funnel.',
    'sales',
    'medium',
    '25 minutes',
    ARRAY['lead nurturing', 'sales', 'email marketing'],
    ARRAY['Higher conversion rates', 'Automated follow-ups', 'Better lead scoring'],
    ARRAY['Email marketing platform', 'CRM integration'],
    '📈',
    'webhook',
    ARRAY['hubspot', 'mailchimp'],
    '[
        {
            "id": "add-to-nurture-list",
            "type": "integration",
            "name": "Add to Nurture List",
            "description": "Add lead to nurturing email list",
            "parameters": {
                "integration": "mailchimp",
                "action": "add_to_list"
            },
            "customizable": true,
            "required": true
        },
        {
            "id": "update-lead-score",
            "type": "integration",
            "name": "Update Lead Score",
            "description": "Update lead scoring in CRM",
            "parameters": {
                "integration": "hubspot",
                "action": "update_lead_score"
            },
            "customizable": false,
            "required": true
        }
    ]'::jsonb,
    '[
        {
            "id": "nurture_sequence_length",
            "name": "Sequence Length",
            "description": "Number of emails in nurture sequence",
            "type": "select",
            "options": ["5", "7", "10", "14"],
            "defaultValue": "7",
            "required": true
        },
        {
            "id": "email_frequency",
            "name": "Email Frequency",
            "description": "Days between emails",
            "type": "select",
            "options": ["2", "3", "5", "7"],
            "defaultValue": "3",
            "required": true
        }
    ]'::jsonb,
    ARRAY['Open rates', 'Click-through rates', 'Lead conversion rate']
),
(
    'weekly-reports',
    'Weekly Report Generation',
    'Automatically generate and distribute weekly business reports.',
    'operations',
    'easy',
    '10 minutes',
    ARRAY['reporting', 'analytics', 'automation'],
    ARRAY['Consistent reporting', 'Time savings', 'Data-driven decisions'],
    ARRAY['Analytics platform', 'Email access'],
    '📊',
    'schedule',
    ARRAY['internal'],
    '[
        {
            "id": "generate-report",
            "type": "ai_process",
            "name": "Generate Report",
            "description": "Generate weekly business report",
            "parameters": {
                "report_type": "weekly_summary",
                "include_metrics": ["revenue", "customers", "projects"]
            },
            "customizable": true,
            "required": true
        },
        {
            "id": "distribute-report",
            "type": "email",
            "name": "Distribute Report",
            "description": "Send report to stakeholders",
            "parameters": {
                "subject": "Weekly Business Report - {{date}}",
                "template": "report-template"
            },
            "customizable": true,
            "required": true
        }
    ]'::jsonb,
    '[
        {
            "id": "report_recipients",
            "name": "Report Recipients",
            "description": "Email addresses to receive reports",
            "type": "text",
            "required": true,
            "placeholder": "Enter email addresses separated by commas"
        },
        {
            "id": "report_sections",
            "name": "Report Sections",
            "description": "Choose which sections to include",
            "type": "select",
            "options": ["revenue", "customers", "projects", "tasks", "expenses"],
            "defaultValue": "revenue",
            "required": true
        }
    ]'::jsonb,
    ARRAY['Report delivery rate', 'Stakeholder engagement', 'Decision speed']
),
(
    'support-ticket-routing',
    'Customer Support Ticket Routing',
    'Automatically route support tickets to the right team members.',
    'customer_success',
    'hard',
    '30 minutes',
    ARRAY['support', 'routing', 'customer service'],
    ARRAY['Faster response times', 'Better specialization', 'Improved satisfaction'],
    ARRAY['Support platform', 'Team structure'],
    '🎧',
    'webhook',
    ARRAY['zendesk', 'slack'],
    '[
        {
            "id": "analyze-ticket",
            "type": "ai_process",
            "name": "Analyze Ticket",
            "description": "Analyze ticket content and urgency",
            "parameters": {
                "analysis_type": "ticket_categorization",
                "urgency_detection": true
            },
            "customizable": false,
            "required": true
        },
        {
            "id": "route-ticket",
            "type": "integration",
            "name": "Route Ticket",
            "description": "Assign ticket to appropriate team member",
            "parameters": {
                "integration": "zendesk",
                "action": "assign_ticket"
            },
            "customizable": true,
            "required": true
        },
        {
            "id": "notify-team",
            "type": "slack",
            "name": "Notify Team",
            "description": "Send notification to assigned team",
            "parameters": {
                "message": "New ticket assigned: {{ticket_title}}"
            },
            "customizable": true,
            "required": false
        }
    ]'::jsonb,
    '[
        {
            "id": "routing_rules",
            "name": "Routing Rules",
            "description": "Define how tickets should be routed",
            "type": "select",
            "options": ["by_product", "by_urgency", "by_customer_tier", "round_robin"],
            "defaultValue": "by_product",
            "required": true
        },
        {
            "id": "escalation_time",
            "name": "Escalation Time",
            "description": "Hours before escalating unresolved tickets",
            "type": "number",
            "defaultValue": 4,
            "required": true
        }
    ]'::jsonb,
    ARRAY['Response time', 'Resolution time', 'Customer satisfaction']
);

-- Set initial usage counts and ratings
UPDATE automation_recipes SET usage_count = 0, average_rating = 4.5 WHERE id = 'client-onboarding';
UPDATE automation_recipes SET usage_count = 0, average_rating = 4.6 WHERE id = 'invoice-processing';
UPDATE automation_recipes SET usage_count = 0, average_rating = 4.7 WHERE id = 'lead-nurturing';
UPDATE automation_recipes SET usage_count = 0, average_rating = 4.5 WHERE id = 'weekly-reports';
UPDATE automation_recipes SET usage_count = 0, average_rating = 4.9 WHERE id = 'support-ticket-routing'; 