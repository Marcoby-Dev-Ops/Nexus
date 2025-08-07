-- Migration: Create Business Process Automation System
-- This migration creates a system that leverages collaborative intelligence for cross-functional workflows
-- where multiple people contribute to business processes, updates, and automation

-- ====================================================================
-- STEP 1: CREATE BUSINESS PROCESSES TABLE
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.business_processes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    
    -- Process Identity
    process_name TEXT NOT NULL,
    process_category TEXT NOT NULL CHECK (process_category IN ('sales', 'marketing', 'operations', 'finance', 'hr', 'customer_support', 'product_development', 'compliance')),
    process_slug TEXT NOT NULL,
    process_description TEXT,
    process_priority TEXT DEFAULT 'medium' CHECK (process_priority IN ('low', 'medium', 'high', 'critical')),
    
    -- Process Status & Lifecycle
    process_status TEXT DEFAULT 'active' CHECK (process_status IN ('draft', 'active', 'paused', 'archived', 'deprecated')),
    process_version TEXT DEFAULT '1.0',
    process_owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    process_created_by UUID NOT NULL REFERENCES auth.users(id),
    process_created_at TIMESTAMPTZ DEFAULT NOW(),
    process_updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Process Configuration
    process_config JSONB DEFAULT '{}',
    automation_rules JSONB DEFAULT '[]',
    integration_triggers JSONB DEFAULT '[]',
    workflow_steps JSONB DEFAULT '[]',
    
    -- Process Intelligence
    intelligence_score INTEGER DEFAULT 0,
    data_enrichment_level INTEGER DEFAULT 0,
    collaboration_score INTEGER DEFAULT 0,
    automation_potential INTEGER DEFAULT 0,
    
    -- Process Metrics
    completion_rate DECIMAL(5,2) DEFAULT 0.00,
    average_completion_time_hours DECIMAL(10,2),
    error_rate DECIMAL(5,2) DEFAULT 0.00,
    user_satisfaction_score INTEGER DEFAULT 0,
    
    -- Process Governance
    approval_required BOOLEAN DEFAULT false,
    review_frequency TEXT DEFAULT 'monthly',
    compliance_requirements JSONB DEFAULT '[]',
    audit_trail_enabled BOOLEAN DEFAULT true,
    
    -- Metadata
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(company_id, process_slug)
);

-- ====================================================================
-- STEP 2: CREATE PROCESS CONTRIBUTORS TABLE
-- ====================================================================

-- Track who contributes to which business processes
CREATE TABLE IF NOT EXISTS public.process_contributors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_process_id UUID NOT NULL REFERENCES public.business_processes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Contribution Details
    contribution_role TEXT NOT NULL CHECK (contribution_role IN ('owner', 'executor', 'reviewer', 'approver', 'stakeholder', 'automation_engineer', 'data_analyst')),
    contribution_type TEXT NOT NULL CHECK (contribution_type IN ('process_design', 'execution', 'review', 'approval', 'automation', 'data_analysis', 'optimization')),
    contribution_status TEXT DEFAULT 'active' CHECK (contribution_status IN ('active', 'inactive', 'pending', 'completed')),
    
    -- Contribution Impact
    contribution_frequency TEXT DEFAULT 'as_needed' CHECK (contribution_frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'as_needed')),
    contribution_impact_score INTEGER DEFAULT 0,
    contribution_quality_score INTEGER DEFAULT 0,
    contribution_consistency_score INTEGER DEFAULT 0,
    
    -- Integration Context
    related_integrations JSONB DEFAULT '[]',
    integration_contributions JSONB DEFAULT '{}',
    automation_contributions JSONB DEFAULT '{}',
    
    -- Performance Tracking
    tasks_completed INTEGER DEFAULT 0,
    tasks_failed INTEGER DEFAULT 0,
    average_task_time_hours DECIMAL(10,2),
    last_contribution_at TIMESTAMPTZ,
    
    -- Metadata
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    
    -- Constraints
    UNIQUE(business_process_id, user_id, contribution_role)
);

-- ====================================================================
-- STEP 3: CREATE PROCESS AUTOMATION RULES TABLE
-- ====================================================================

-- Define automation rules that leverage integration intelligence
CREATE TABLE IF NOT EXISTS public.process_automation_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_process_id UUID NOT NULL REFERENCES public.business_processes(id) ON DELETE CASCADE,
    
    -- Rule Configuration
    rule_name TEXT NOT NULL,
    rule_type TEXT NOT NULL CHECK (rule_type IN ('trigger', 'condition', 'action', 'notification', 'escalation')),
    rule_priority INTEGER DEFAULT 5,
    rule_enabled BOOLEAN DEFAULT true,
    
    -- Rule Logic
    trigger_conditions JSONB DEFAULT '{}',
    execution_conditions JSONB DEFAULT '{}',
    action_configuration JSONB DEFAULT '{}',
    notification_settings JSONB DEFAULT '{}',
    
    -- Integration Intelligence
    intelligence_threshold INTEGER DEFAULT 50,
    data_quality_requirement INTEGER DEFAULT 70,
    collaboration_requirement INTEGER DEFAULT 3,
    automation_confidence DECIMAL(5,2) DEFAULT 0.00,
    
    -- Rule Performance
    execution_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0.00,
    average_execution_time_ms INTEGER,
    last_executed_at TIMESTAMPTZ,
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(business_process_id, rule_name)
);

-- ====================================================================
-- STEP 4: CREATE PROCESS EXECUTION LOGS TABLE
-- ====================================================================

-- Track all process executions and automation events
CREATE TABLE IF NOT EXISTS public.process_execution_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_process_id UUID NOT NULL REFERENCES public.business_processes(id) ON DELETE CASCADE,
    
    -- Execution Details
    execution_type TEXT NOT NULL CHECK (execution_type IN ('manual', 'automated', 'scheduled', 'triggered', 'escalated')),
    execution_status TEXT NOT NULL CHECK (execution_status IN ('started', 'in_progress', 'completed', 'failed', 'cancelled', 'paused')),
    execution_priority TEXT DEFAULT 'normal' CHECK (execution_priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- Execution Context
    triggered_by UUID REFERENCES auth.users(id),
    triggered_by_integration UUID REFERENCES public.company_integrations(id),
    trigger_data JSONB DEFAULT '{}',
    execution_data JSONB DEFAULT '{}',
    
    -- Intelligence Context
    intelligence_score_at_execution INTEGER,
    data_quality_at_execution INTEGER,
    collaboration_level_at_execution INTEGER,
    automation_confidence_at_execution DECIMAL(5,2),
    
    -- Performance Metrics
    execution_duration_ms INTEGER,
    steps_completed INTEGER DEFAULT 0,
    steps_failed INTEGER DEFAULT 0,
    error_messages TEXT[],
    
    -- Metadata
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- STEP 5: CREATE CROSS-FUNCTIONAL WORKFLOWS TABLE
-- ====================================================================

-- Define workflows that span multiple departments and integrations
CREATE TABLE IF NOT EXISTS public.cross_functional_workflows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    
    -- Workflow Identity
    workflow_name TEXT NOT NULL,
    workflow_category TEXT NOT NULL CHECK (workflow_category IN ('lead_to_cash', 'order_to_fulfillment', 'hire_to_retire', 'quote_to_cash', 'support_to_resolution')),
    workflow_description TEXT,
    workflow_priority TEXT DEFAULT 'medium' CHECK (workflow_priority IN ('low', 'medium', 'high', 'critical')),
    
    -- Workflow Configuration
    workflow_steps JSONB DEFAULT '[]',
    workflow_triggers JSONB DEFAULT '[]',
    workflow_conditions JSONB DEFAULT '{}',
    workflow_actions JSONB DEFAULT '[]',
    
    -- Integration Intelligence
    required_integrations JSONB DEFAULT '[]',
    intelligence_requirements JSONB DEFAULT '{}',
    collaboration_requirements JSONB DEFAULT '{}',
    automation_requirements JSONB DEFAULT '{}',
    
    -- Workflow Status
    workflow_status TEXT DEFAULT 'active' CHECK (workflow_status IN ('draft', 'active', 'paused', 'archived')),
    workflow_version TEXT DEFAULT '1.0',
    workflow_owner_id UUID REFERENCES auth.users(id),
    
    -- Performance Metrics
    completion_rate DECIMAL(5,2) DEFAULT 0.00,
    average_duration_hours DECIMAL(10,2),
    error_rate DECIMAL(5,2) DEFAULT 0.00,
    user_satisfaction_score INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(company_id, workflow_name)
);

-- ====================================================================
-- STEP 6: CREATE INTELLIGENCE-DRIVEN AUTOMATION FUNCTIONS
-- ====================================================================

-- Function to calculate process intelligence score based on integrations
CREATE OR REPLACE FUNCTION calculate_process_intelligence_score(process_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    intelligence_score INTEGER := 0;
    process_record RECORD;
    integration_count INTEGER := 0;
    avg_integration_health INTEGER := 0;
    collaboration_level INTEGER := 0;
BEGIN
    SELECT * INTO process_record FROM public.business_processes WHERE id = process_uuid;
    
    -- Count related integrations
    SELECT COUNT(*) INTO integration_count
    FROM public.process_contributors pc
    JOIN public.process_automation_rules par ON pc.business_process_id = par.business_process_id
    WHERE pc.business_process_id = process_uuid;
    
    -- Calculate average integration health
    SELECT COALESCE(AVG(ci.health_status_score), 0) INTO avg_integration_health
    FROM public.company_integrations ci
    JOIN public.process_automation_rules par ON ci.id = ANY(par.trigger_conditions->'integrations')
    WHERE par.business_process_id = process_uuid;
    
    -- Calculate collaboration level
    SELECT COUNT(DISTINCT user_id) INTO collaboration_level
    FROM public.process_contributors
    WHERE business_process_id = process_uuid AND contribution_status = 'active';
    
    -- Calculate intelligence score
    intelligence_score := intelligence_score + (integration_count * 10);
    intelligence_score := intelligence_score + (avg_integration_health / 10);
    intelligence_score := intelligence_score + (collaboration_level * 5);
    
    -- Ensure score is between 0 and 100
    RETURN GREATEST(0, LEAST(100, intelligence_score));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to trigger process automation based on intelligence
CREATE OR REPLACE FUNCTION trigger_intelligence_driven_automation(process_uuid UUID)
RETURNS VOID AS $$
DECLARE
    process_record RECORD;
    intelligence_score INTEGER;
    automation_rules RECORD;
    execution_data JSONB;
BEGIN
    SELECT * INTO process_record FROM public.business_processes WHERE id = process_uuid;
    
    -- Calculate current intelligence score
    SELECT calculate_process_intelligence_score(process_uuid) INTO intelligence_score;
    
    -- Update process intelligence score
    UPDATE public.business_processes 
    SET intelligence_score = intelligence_score,
        updated_at = NOW()
    WHERE id = process_uuid;
    
    -- Check for automation rules that should be triggered
    FOR automation_rules IN 
        SELECT * FROM public.process_automation_rules 
        WHERE business_process_id = process_uuid 
        AND rule_enabled = true
        AND intelligence_threshold <= intelligence_score
    LOOP
        -- Prepare execution data
        execution_data := jsonb_build_object(
            'process_id', process_uuid,
            'rule_id', automation_rules.id,
            'intelligence_score', intelligence_score,
            'triggered_at', NOW(),
            'automation_confidence', automation_rules.automation_confidence
        );
        
        -- Log the automation execution
        INSERT INTO public.process_execution_logs (
            business_process_id,
            execution_type,
            execution_status,
            triggered_by_integration,
            intelligence_score_at_execution,
            automation_confidence_at_execution,
            execution_data,
            started_at
        ) VALUES (
            process_uuid,
            'automated',
            'started',
            NULL,
            intelligence_score,
            automation_rules.automation_confidence,
            execution_data,
            NOW()
        );
        
        -- Update rule execution count
        UPDATE public.process_automation_rules 
        SET execution_count = execution_count + 1,
            last_executed_at = NOW()
        WHERE id = automation_rules.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to enrich process data with integration intelligence
CREATE OR REPLACE FUNCTION enrich_process_with_integration_intelligence(process_uuid UUID)
RETURNS VOID AS $$
DECLARE
    process_record RECORD;
    integration_intelligence JSONB;
    enriched_data JSONB;
BEGIN
    SELECT * INTO process_record FROM public.business_processes WHERE id = process_uuid;
    
    -- Gather integration intelligence for this process
    SELECT jsonb_build_object(
        'integrations', array_agg(ci.integration_name),
        'average_health_score', AVG(ci.health_status_score),
        'total_contributing_users', SUM(cii.total_contributing_users),
        'cross_user_correlations', array_agg(cii.cross_user_correlations),
        'user_synergy_opportunities', array_agg(cii.user_synergy_opportunities)
    ) INTO integration_intelligence
    FROM public.company_integrations ci
    LEFT JOIN public.company_integration_intelligence cii ON ci.id = cii.company_integration_id
    WHERE ci.company_id = process_record.company_id;
    
    -- Enrich process configuration with intelligence
    enriched_data := jsonb_build_object(
        'integration_intelligence', integration_intelligence,
        'enrichment_timestamp', NOW(),
        'enrichment_level', COALESCE(integration_intelligence->>'average_health_score', '0')::INTEGER
    );
    
    -- Update process with enriched data
    UPDATE public.business_processes 
    SET process_config = process_config || enriched_data,
        data_enrichment_level = COALESCE(integration_intelligence->>'average_health_score', '0')::INTEGER,
        updated_at = NOW()
    WHERE id = process_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- STEP 7: CREATE TRIGGERS FOR AUTOMATION
-- ====================================================================

-- Trigger to update process intelligence when contributors change
CREATE OR REPLACE FUNCTION update_process_intelligence_on_contributor_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Update process intelligence score
    UPDATE public.business_processes 
    SET intelligence_score = calculate_process_intelligence_score(NEW.business_process_id),
        collaboration_score = (
            SELECT COUNT(DISTINCT user_id) 
            FROM public.process_contributors 
            WHERE business_process_id = NEW.business_process_id 
            AND contribution_status = 'active'
        ),
        updated_at = NOW()
    WHERE id = NEW.business_process_id;
    
    -- Trigger intelligence-driven automation
    PERFORM trigger_intelligence_driven_automation(NEW.business_process_id);
    
    -- Enrich process with integration intelligence
    PERFORM enrich_process_with_integration_intelligence(NEW.business_process_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_process_intelligence
    AFTER INSERT OR UPDATE ON public.process_contributors
    FOR EACH ROW
    EXECUTE FUNCTION update_process_intelligence_on_contributor_change();

-- Trigger to update process when integration intelligence changes
CREATE OR REPLACE FUNCTION update_process_on_integration_intelligence_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Update all processes for this company
    UPDATE public.business_processes 
    SET intelligence_score = calculate_process_intelligence_score(id),
        updated_at = NOW()
    WHERE company_id = (
        SELECT company_id FROM public.company_integrations WHERE id = NEW.company_integration_id
    );
    
    -- Trigger automation for affected processes
    PERFORM trigger_intelligence_driven_automation(bp.id)
    FROM public.business_processes bp
    WHERE bp.company_id = (
        SELECT company_id FROM public.company_integrations WHERE id = NEW.company_integration_id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_process_on_integration_intelligence
    AFTER UPDATE ON public.company_integration_intelligence
    FOR EACH ROW
    EXECUTE FUNCTION update_process_on_integration_intelligence_change();

-- ====================================================================
-- STEP 8: CREATE INDEXES FOR PERFORMANCE
-- ====================================================================

-- Business processes indexes
CREATE INDEX IF NOT EXISTS idx_business_processes_company_id ON public.business_processes(company_id);
CREATE INDEX IF NOT EXISTS idx_business_processes_category ON public.business_processes(process_category);
CREATE INDEX IF NOT EXISTS idx_business_processes_status ON public.business_processes(process_status);
CREATE INDEX IF NOT EXISTS idx_business_processes_intelligence_score ON public.business_processes(intelligence_score DESC);

-- Process contributors indexes
CREATE INDEX IF NOT EXISTS idx_process_contributors_process_id ON public.process_contributors(business_process_id);
CREATE INDEX IF NOT EXISTS idx_process_contributors_user_id ON public.process_contributors(user_id);
CREATE INDEX IF NOT EXISTS idx_process_contributors_role ON public.process_contributors(contribution_role);

-- Process automation rules indexes
CREATE INDEX IF NOT EXISTS idx_process_automation_rules_process_id ON public.process_automation_rules(business_process_id);
CREATE INDEX IF NOT EXISTS idx_process_automation_rules_enabled ON public.process_automation_rules(rule_enabled);
CREATE INDEX IF NOT EXISTS idx_process_automation_rules_priority ON public.process_automation_rules(rule_priority);

-- Process execution logs indexes
CREATE INDEX IF NOT EXISTS idx_process_execution_logs_process_id ON public.process_execution_logs(business_process_id);
CREATE INDEX IF NOT EXISTS idx_process_execution_logs_status ON public.process_execution_logs(execution_status);
CREATE INDEX IF NOT EXISTS idx_process_execution_logs_started_at ON public.process_execution_logs(started_at DESC);

-- Cross-functional workflows indexes
CREATE INDEX IF NOT EXISTS idx_cross_functional_workflows_company_id ON public.cross_functional_workflows(company_id);
CREATE INDEX IF NOT EXISTS idx_cross_functional_workflows_category ON public.cross_functional_workflows(workflow_category);

-- ====================================================================
-- STEP 9: CREATE RLS POLICIES
-- ====================================================================

-- Enable RLS on all tables
ALTER TABLE public.business_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.process_contributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.process_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.process_execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cross_functional_workflows ENABLE ROW LEVEL SECURITY;

-- Business processes policies
CREATE POLICY "Company members can view business processes" ON public.business_processes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid() AND up.company_id = business_processes.company_id
        )
    );

CREATE POLICY "Process owners can manage business processes" ON public.business_processes
    FOR ALL USING (
        process_owner_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid() 
            AND up.company_id = business_processes.company_id
            AND up.role IN ('owner', 'admin')
        )
    );

-- Process contributors policies
CREATE POLICY "Users can view their own contributions" ON public.process_contributors
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Process owners can manage contributors" ON public.process_contributors
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.business_processes bp
            WHERE bp.id = process_contributors.business_process_id
            AND bp.process_owner_id = auth.uid()
        )
    );

-- Process automation rules policies
CREATE POLICY "Process owners can manage automation rules" ON public.process_automation_rules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.business_processes bp
            WHERE bp.id = process_automation_rules.business_process_id
            AND bp.process_owner_id = auth.uid()
        )
    );

-- Process execution logs policies
CREATE POLICY "Process contributors can view execution logs" ON public.process_execution_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.process_contributors pc
            WHERE pc.business_process_id = process_execution_logs.business_process_id
            AND pc.user_id = auth.uid()
        )
    );

-- Cross-functional workflows policies
CREATE POLICY "Company members can view workflows" ON public.cross_functional_workflows
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid() AND up.company_id = cross_functional_workflows.company_id
        )
    );

-- ====================================================================
-- STEP 10: ADD COMMENTS FOR DOCUMENTATION
-- ====================================================================

COMMENT ON TABLE public.business_processes IS 'Business processes that leverage collaborative intelligence for automation';
COMMENT ON COLUMN public.business_processes.intelligence_score IS 'Intelligence score based on integration health and collaboration';
COMMENT ON COLUMN public.business_processes.data_enrichment_level IS 'Level of data enrichment from integration intelligence';
COMMENT ON COLUMN public.business_processes.collaboration_score IS 'Number of active contributors to this process';
COMMENT ON COLUMN public.business_processes.automation_potential IS 'Potential for automation based on intelligence';

COMMENT ON TABLE public.process_contributors IS 'Track who contributes to which business processes';
COMMENT ON COLUMN public.process_contributors.contribution_role IS 'Role in the process (owner, executor, reviewer, etc.)';
COMMENT ON COLUMN public.process_contributors.contribution_type IS 'Type of contribution (process_design, execution, etc.)';
COMMENT ON COLUMN public.process_contributors.contribution_impact_score IS 'Impact score of this contribution (0-100)';

COMMENT ON TABLE public.process_automation_rules IS 'Automation rules that leverage integration intelligence';
COMMENT ON COLUMN public.process_automation_rules.intelligence_threshold IS 'Minimum intelligence score required to trigger automation';
COMMENT ON COLUMN public.process_automation_rules.automation_confidence IS 'Confidence level in the automation (0-1)';

COMMENT ON TABLE public.process_execution_logs IS 'Log of all process executions and automation events';
COMMENT ON COLUMN public.process_execution_logs.intelligence_score_at_execution IS 'Intelligence score when execution started';
COMMENT ON COLUMN public.process_execution_logs.automation_confidence_at_execution IS 'Confidence level when automation was triggered';

COMMENT ON TABLE public.cross_functional_workflows IS 'Workflows that span multiple departments and integrations';
COMMENT ON COLUMN public.cross_functional_workflows.intelligence_requirements IS 'Integration intelligence requirements for this workflow';
COMMENT ON COLUMN public.cross_functional_workflows.collaboration_requirements IS 'Collaboration requirements for this workflow'; 