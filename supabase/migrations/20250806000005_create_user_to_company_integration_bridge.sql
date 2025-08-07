-- Migration: Create User to Company Integration Bridge
-- This migration creates a system that allows user integrations to feed data into company integrations
-- for more comprehensive and collaborative analysis across the organization

-- ====================================================================
-- STEP 1: CREATE USER INTEGRATION CONTRIBUTIONS TABLE
-- ====================================================================

-- Track how user integrations contribute to company integration intelligence
CREATE TABLE IF NOT EXISTS public.user_integration_contributions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_integration_id UUID NOT NULL REFERENCES public.user_integrations(id) ON DELETE CASCADE,
    company_integration_id UUID NOT NULL REFERENCES public.company_integrations(id) ON DELETE CASCADE,
    
    -- Contribution Details
    contribution_type TEXT NOT NULL CHECK (contribution_type IN ('data_source', 'configuration', 'usage_pattern', 'performance_metrics', 'error_reporting', 'optimization_suggestion')),
    contribution_status TEXT DEFAULT 'active' CHECK (contribution_status IN ('active', 'inactive', 'pending_review', 'approved', 'rejected')),
    contribution_confidence DECIMAL(5,2) DEFAULT 0.00,
    
    -- Data Contribution
    data_contribution JSONB DEFAULT '{}',
    data_freshness_hours INTEGER,
    data_quality_score INTEGER DEFAULT 0,
    data_coverage_percentage INTEGER DEFAULT 0,
    
    -- User Context
    user_role_in_company TEXT,
    user_department TEXT,
    user_permissions JSONB DEFAULT '{}',
    
    -- Contribution Impact
    impact_score INTEGER DEFAULT 0,
    reliability_score INTEGER DEFAULT 0,
    consistency_score INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    
    -- Constraints
    UNIQUE(user_integration_id, company_integration_id, contribution_type)
);

-- ====================================================================
-- STEP 2: CREATE COMPANY INTEGRATION INTELLIGENCE AGGREGATION TABLE
-- ====================================================================

-- Aggregate intelligence from multiple user contributions
CREATE TABLE IF NOT EXISTS public.company_integration_intelligence (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_integration_id UUID NOT NULL REFERENCES public.company_integrations(id) ON DELETE CASCADE,
    
    -- Aggregated Intelligence
    aggregated_data_quality_score INTEGER DEFAULT 0,
    aggregated_reliability_score INTEGER DEFAULT 0,
    aggregated_usage_patterns JSONB DEFAULT '{}',
    aggregated_performance_metrics JSONB DEFAULT '{}',
    aggregated_error_patterns JSONB DEFAULT '{}',
    aggregated_optimization_insights JSONB DEFAULT '{}',
    
    -- User Contribution Analysis
    total_contributing_users INTEGER DEFAULT 0,
    active_contributors INTEGER DEFAULT 0,
    contribution_diversity_score INTEGER DEFAULT 0,
    user_consensus_score INTEGER DEFAULT 0,
    
    -- Cross-User Correlations
    cross_user_correlations JSONB DEFAULT '[]',
    user_synergy_opportunities JSONB DEFAULT '[]',
    conflicting_user_patterns JSONB DEFAULT '[]',
    
    -- Intelligence Metadata
    last_aggregation_at TIMESTAMPTZ,
    aggregation_version TEXT DEFAULT '1.0',
    confidence_intervals JSONB DEFAULT '{}',
    data_sources JSONB DEFAULT '[]',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(company_integration_id)
);

-- ====================================================================
-- STEP 3: CREATE USER INTEGRATION RESPONSIBILITIES TABLE
-- ====================================================================

-- Define user responsibilities and permissions for company integrations
CREATE TABLE IF NOT EXISTS public.user_integration_responsibilities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_integration_id UUID NOT NULL REFERENCES public.company_integrations(id) ON DELETE CASCADE,
    
    -- Responsibility Details
    responsibility_type TEXT NOT NULL CHECK (responsibility_type IN ('owner', 'admin', 'user', 'viewer', 'contributor', 'reviewer', 'maintainer')),
    responsibility_scope JSONB DEFAULT '{}',
    responsibility_permissions JSONB DEFAULT '{}',
    
    -- Contribution Settings
    auto_contribute BOOLEAN DEFAULT true,
    contribution_frequency TEXT DEFAULT 'realtime' CHECK (contribution_frequency IN ('realtime', 'hourly', 'daily', 'weekly', 'manual')),
    contribution_scope JSONB DEFAULT '{}',
    
    -- Performance Tracking
    contribution_accuracy_score INTEGER DEFAULT 0,
    contribution_consistency_score INTEGER DEFAULT 0,
    contribution_impact_score INTEGER DEFAULT 0,
    
    -- Metadata
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    
    -- Constraints
    UNIQUE(user_id, company_integration_id)
);

-- ====================================================================
-- STEP 4: CREATE INTELLIGENCE AGGREGATION FUNCTIONS
-- ====================================================================

-- Function to aggregate user contributions into company intelligence
CREATE OR REPLACE FUNCTION aggregate_user_contributions_to_company_intelligence(company_integration_uuid UUID)
RETURNS VOID AS $$
DECLARE
    aggregated_data_quality INTEGER := 0;
    aggregated_reliability INTEGER := 0;
    total_contributors INTEGER := 0;
    active_contributors INTEGER := 0;
    contribution_diversity INTEGER := 0;
    user_consensus INTEGER := 0;
    usage_patterns JSONB := '{}';
    performance_metrics JSONB := '{}';
    error_patterns JSONB := '{}';
    optimization_insights JSONB := '{}';
    cross_user_correlations JSONB := '[]';
    user_synergy_opportunities JSONB := '[]';
    conflicting_patterns JSONB := '[]';
BEGIN
    -- Calculate aggregated scores from user contributions
    SELECT 
        AVG(data_quality_score),
        AVG(reliability_score),
        COUNT(DISTINCT user_id),
        COUNT(DISTINCT user_id) FILTER (WHERE contribution_status = 'active'),
        AVG(impact_score),
        AVG(consistency_score)
    INTO 
        aggregated_data_quality,
        aggregated_reliability,
        total_contributors,
        active_contributors,
        user_consensus,
        contribution_diversity
    FROM public.user_integration_contributions uic
    JOIN public.user_integrations ui ON uic.user_integration_id = ui.id
    WHERE uic.company_integration_id = company_integration_uuid
    AND uic.contribution_status IN ('active', 'approved');
    
    -- Aggregate usage patterns from all contributing users
    SELECT jsonb_object_agg(
        uic.contribution_type,
        jsonb_build_object(
            'patterns', uic.data_contribution,
            'frequency', COUNT(*),
            'consistency', AVG(uic.consistency_score)
        )
    ) INTO usage_patterns
    FROM public.user_integration_contributions uic
    WHERE uic.company_integration_id = company_integration_uuid
    AND uic.contribution_type = 'usage_pattern'
    GROUP BY uic.contribution_type;
    
    -- Aggregate performance metrics
    SELECT jsonb_object_agg(
        uic.contribution_type,
        jsonb_build_object(
            'metrics', uic.data_contribution,
            'average_score', AVG(uic.impact_score),
            'trend', 'stable'
        )
    ) INTO performance_metrics
    FROM public.user_integration_contributions uic
    WHERE uic.company_integration_id = company_integration_uuid
    AND uic.contribution_type = 'performance_metrics'
    GROUP BY uic.contribution_type;
    
    -- Aggregate error patterns
    SELECT jsonb_object_agg(
        uic.contribution_type,
        jsonb_build_object(
            'errors', uic.data_contribution,
            'frequency', COUNT(*),
            'severity', AVG(uic.impact_score)
        )
    ) INTO error_patterns
    FROM public.user_integration_contributions uic
    WHERE uic.company_integration_id = company_integration_uuid
    AND uic.contribution_type = 'error_reporting'
    GROUP BY uic.contribution_type;
    
    -- Aggregate optimization insights
    SELECT jsonb_object_agg(
        uic.contribution_type,
        jsonb_build_object(
            'insights', uic.data_contribution,
            'priority', AVG(uic.impact_score),
            'feasibility', AVG(uic.contribution_confidence)
        )
    ) INTO optimization_insights
    FROM public.user_integration_contributions uic
    WHERE uic.company_integration_id = company_integration_uuid
    AND uic.contribution_type = 'optimization_suggestion'
    GROUP BY uic.contribution_type;
    
    -- Find cross-user correlations
    SELECT jsonb_agg(
        jsonb_build_object(
            'users', ARRAY[uic1.user_id, uic2.user_id],
            'correlation_type', uic1.contribution_type,
            'correlation_strength', uic1.contribution_confidence * uic2.contribution_confidence,
            'shared_patterns', uic1.data_contribution
        )
    ) INTO cross_user_correlations
    FROM public.user_integration_contributions uic1
    JOIN public.user_integration_contributions uic2 ON uic1.contribution_type = uic2.contribution_type
    WHERE uic1.company_integration_id = company_integration_uuid
    AND uic2.company_integration_id = company_integration_uuid
    AND uic1.user_id < uic2.user_id
    AND uic1.contribution_confidence > 0.7
    AND uic2.contribution_confidence > 0.7;
    
    -- Find user synergy opportunities
    SELECT jsonb_agg(
        jsonb_build_object(
            'users', ARRAY[uic1.user_id, uic2.user_id],
            'synergy_type', 'complementary_usage',
            'synergy_score', uic1.impact_score + uic2.impact_score,
            'opportunity', 'Shared best practices and optimization'
        )
    ) INTO user_synergy_opportunities
    FROM public.user_integration_contributions uic1
    JOIN public.user_integration_contributions uic2 ON uic1.contribution_type = uic2.contribution_type
    WHERE uic1.company_integration_id = company_integration_uuid
    AND uic2.company_integration_id = company_integration_uuid
    AND uic1.user_id < uic2.user_id
    AND uic1.impact_score > 70
    AND uic2.impact_score > 70;
    
    -- Find conflicting user patterns
    SELECT jsonb_agg(
        jsonb_build_object(
            'users', ARRAY[uic1.user_id, uic2.user_id],
            'conflict_type', 'usage_pattern_conflict',
            'conflict_score', ABS(uic1.impact_score - uic2.impact_score),
            'resolution_suggestion', 'Standardize usage patterns across users'
        )
    ) INTO conflicting_patterns
    FROM public.user_integration_contributions uic1
    JOIN public.user_integration_contributions uic2 ON uic1.contribution_type = uic2.contribution_type
    WHERE uic1.company_integration_id = company_integration_uuid
    AND uic2.company_integration_id = company_integration_uuid
    AND uic1.user_id < uic2.user_id
    AND ABS(uic1.impact_score - uic2.impact_score) > 30;
    
    -- Update or create company integration intelligence
    INSERT INTO public.company_integration_intelligence (
        company_integration_id,
        aggregated_data_quality_score,
        aggregated_reliability_score,
        aggregated_usage_patterns,
        aggregated_performance_metrics,
        aggregated_error_patterns,
        aggregated_optimization_insights,
        total_contributing_users,
        active_contributors,
        contribution_diversity_score,
        user_consensus_score,
        cross_user_correlations,
        user_synergy_opportunities,
        conflicting_user_patterns,
        last_aggregation_at,
        updated_at
    ) VALUES (
        company_integration_uuid,
        COALESCE(aggregated_data_quality, 0),
        COALESCE(aggregated_reliability, 0),
        COALESCE(usage_patterns, '{}'),
        COALESCE(performance_metrics, '{}'),
        COALESCE(error_patterns, '{}'),
        COALESCE(optimization_insights, '{}'),
        COALESCE(total_contributors, 0),
        COALESCE(active_contributors, 0),
        COALESCE(contribution_diversity, 0),
        COALESCE(user_consensus, 0),
        COALESCE(cross_user_correlations, '[]'),
        COALESCE(user_synergy_opportunities, '[]'),
        COALESCE(conflicting_patterns, '[]'),
        NOW(),
        NOW()
    )
    ON CONFLICT (company_integration_id) DO UPDATE SET
        aggregated_data_quality_score = EXCLUDED.aggregated_data_quality_score,
        aggregated_reliability_score = EXCLUDED.aggregated_reliability_score,
        aggregated_usage_patterns = EXCLUDED.aggregated_usage_patterns,
        aggregated_performance_metrics = EXCLUDED.aggregated_performance_metrics,
        aggregated_error_patterns = EXCLUDED.aggregated_error_patterns,
        aggregated_optimization_insights = EXCLUDED.aggregated_optimization_insights,
        total_contributing_users = EXCLUDED.total_contributing_users,
        active_contributors = EXCLUDED.active_contributors,
        contribution_diversity_score = EXCLUDED.contribution_diversity_score,
        user_consensus_score = EXCLUDED.user_consensus_score,
        cross_user_correlations = EXCLUDED.cross_user_correlations,
        user_synergy_opportunities = EXCLUDED.user_synergy_opportunities,
        conflicting_user_patterns = EXCLUDED.conflicting_user_patterns,
        last_aggregation_at = EXCLUDED.last_aggregation_at,
        updated_at = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- STEP 5: CREATE AUTOMATIC CONTRIBUTION TRIGGER
-- ====================================================================

-- Function to automatically create user contributions when user integrations change
CREATE OR REPLACE FUNCTION auto_create_user_contribution()
RETURNS TRIGGER AS $$
DECLARE
    company_integration_record RECORD;
    user_profile_record RECORD;
    contribution_data JSONB;
BEGIN
    -- Get user's company information
    SELECT * INTO user_profile_record 
    FROM public.user_profiles 
    WHERE id = NEW.user_id;
    
    -- Find matching company integration
    SELECT * INTO company_integration_record 
    FROM public.company_integrations 
    WHERE company_id = user_profile_record.company_id 
    AND integration_slug = NEW.integration_name;
    
    -- If company integration exists, create contribution
    IF company_integration_record.id IS NOT NULL THEN
        -- Determine contribution type based on integration status
        CASE NEW.status
            WHEN 'connected' THEN
                contribution_data := jsonb_build_object(
                    'connection_method', 'user_oauth',
                    'last_sync', NEW.last_sync_at,
                    'data_quality', 85,
                    'usage_frequency', 'high'
                );
            WHEN 'error' THEN
                contribution_data := jsonb_build_object(
                    'error_message', NEW.error_message,
                    'error_count', 1,
                    'last_error', NEW.last_sync_at
                );
            ELSE
                contribution_data := jsonb_build_object(
                    'status', NEW.status,
                    'last_update', NEW.updated_at
                );
        END CASE;
        
        -- Insert or update user contribution
        INSERT INTO public.user_integration_contributions (
            user_integration_id,
            company_integration_id,
            contribution_type,
            contribution_status,
            contribution_confidence,
            data_contribution,
            data_freshness_hours,
            data_quality_score,
            impact_score,
            reliability_score,
            consistency_score
        ) VALUES (
            NEW.id,
            company_integration_record.id,
            CASE NEW.status
                WHEN 'connected' THEN 'data_source'
                WHEN 'error' THEN 'error_reporting'
                ELSE 'usage_pattern'
            END,
            'active',
            CASE NEW.status
                WHEN 'connected' THEN 0.9
                WHEN 'error' THEN 0.7
                ELSE 0.5
            END,
            contribution_data,
            CASE 
                WHEN NEW.last_sync_at IS NOT NULL THEN 
                    EXTRACT(EPOCH FROM (NOW() - NEW.last_sync_at)) / 3600
                ELSE 24
            END,
            CASE NEW.status
                WHEN 'connected' THEN 85
                WHEN 'error' THEN 30
                ELSE 50
            END,
            CASE NEW.status
                WHEN 'connected' THEN 80
                WHEN 'error' THEN 20
                ELSE 40
            END,
            CASE NEW.status
                WHEN 'connected' THEN 75
                WHEN 'error' THEN 25
                ELSE 50
            END,
            CASE NEW.status
                WHEN 'connected' THEN 80
                WHEN 'error' THEN 30
                ELSE 60
            END
        )
        ON CONFLICT (user_integration_id, company_integration_id, contribution_type) 
        DO UPDATE SET
            contribution_status = EXCLUDED.contribution_status,
            contribution_confidence = EXCLUDED.contribution_confidence,
            data_contribution = EXCLUDED.data_contribution,
            data_freshness_hours = EXCLUDED.data_freshness_hours,
            data_quality_score = EXCLUDED.data_quality_score,
            impact_score = EXCLUDED.impact_score,
            reliability_score = EXCLUDED.reliability_score,
            consistency_score = EXCLUDED.consistency_score,
            updated_at = NOW();
        
        -- Trigger aggregation of company intelligence
        PERFORM aggregate_user_contributions_to_company_intelligence(company_integration_record.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user_integrations changes
CREATE TRIGGER trigger_auto_create_user_contribution
    AFTER INSERT OR UPDATE ON public.user_integrations
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_user_contribution();

-- ====================================================================
-- STEP 6: CREATE INDEXES FOR PERFORMANCE
-- ====================================================================

-- User integration contributions indexes
CREATE INDEX IF NOT EXISTS idx_user_integration_contributions_user_integration_id 
ON public.user_integration_contributions(user_integration_id);

CREATE INDEX IF NOT EXISTS idx_user_integration_contributions_company_integration_id 
ON public.user_integration_contributions(company_integration_id);

CREATE INDEX IF NOT EXISTS idx_user_integration_contributions_type 
ON public.user_integration_contributions(contribution_type);

CREATE INDEX IF NOT EXISTS idx_user_integration_contributions_status 
ON public.user_integration_contributions(contribution_status);

-- Company integration intelligence indexes
CREATE INDEX IF NOT EXISTS idx_company_integration_intelligence_company_integration_id 
ON public.company_integration_intelligence(company_integration_id);

CREATE INDEX IF NOT EXISTS idx_company_integration_intelligence_quality_score 
ON public.company_integration_intelligence(aggregated_data_quality_score DESC);

-- User integration responsibilities indexes
CREATE INDEX IF NOT EXISTS idx_user_integration_responsibilities_user_id 
ON public.user_integration_responsibilities(user_id);

CREATE INDEX IF NOT EXISTS idx_user_integration_responsibilities_company_integration_id 
ON public.user_integration_responsibilities(company_integration_id);

CREATE INDEX IF NOT EXISTS idx_user_integration_responsibilities_type 
ON public.user_integration_responsibilities(responsibility_type);

-- ====================================================================
-- STEP 7: CREATE RLS POLICIES
-- ====================================================================

-- Enable RLS on all tables
ALTER TABLE public.user_integration_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_integration_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_integration_responsibilities ENABLE ROW LEVEL SECURITY;

-- User integration contributions policies
CREATE POLICY "Users can view their own contributions" ON public.user_integration_contributions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_integrations ui
            WHERE ui.id = user_integration_contributions.user_integration_id
            AND ui.user_id = auth.uid()
        )
    );

CREATE POLICY "Company members can view all contributions" ON public.user_integration_contributions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.company_integrations ci
            JOIN public.user_profiles up ON up.company_id = ci.company_id
            WHERE ci.id = user_integration_contributions.company_integration_id
            AND up.id = auth.uid()
        )
    );

-- Company integration intelligence policies
CREATE POLICY "Company members can view integration intelligence" ON public.company_integration_intelligence
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.company_integrations ci
            JOIN public.user_profiles up ON up.company_id = ci.company_id
            WHERE ci.id = company_integration_intelligence.company_integration_id
            AND up.id = auth.uid()
        )
    );

-- User integration responsibilities policies
CREATE POLICY "Users can view their own responsibilities" ON public.user_integration_responsibilities
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Company admins can manage responsibilities" ON public.user_integration_responsibilities
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.company_integrations ci
            JOIN public.user_profiles up ON up.company_id = ci.company_id
            WHERE ci.id = user_integration_responsibilities.company_integration_id
            AND up.id = auth.uid()
            AND up.role IN ('owner', 'admin')
        )
    );

-- ====================================================================
-- STEP 8: ADD COMMENTS FOR DOCUMENTATION
-- ====================================================================

COMMENT ON TABLE public.user_integration_contributions IS 'Bridge table connecting user integrations to company integrations for collaborative intelligence';
COMMENT ON COLUMN public.user_integration_contributions.contribution_type IS 'Type of contribution (data_source, configuration, usage_pattern, etc.)';
COMMENT ON COLUMN public.user_integration_contributions.contribution_confidence IS 'Confidence level in the contribution quality (0-1)';
COMMENT ON COLUMN public.user_integration_contributions.data_contribution IS 'Actual data contributed by the user for this integration';
COMMENT ON COLUMN public.user_integration_contributions.impact_score IS 'Impact score of this contribution on company intelligence (0-100)';

COMMENT ON TABLE public.company_integration_intelligence IS 'Aggregated intelligence from multiple user contributions for comprehensive company analysis';
COMMENT ON COLUMN public.company_integration_intelligence.aggregated_data_quality_score IS 'Average data quality score from all contributing users';
COMMENT ON COLUMN public.company_integration_intelligence.aggregated_reliability_score IS 'Average reliability score from all contributing users';
COMMENT ON COLUMN public.company_integration_intelligence.cross_user_correlations IS 'Correlations discovered between different users patterns';
COMMENT ON COLUMN public.company_integration_intelligence.user_synergy_opportunities IS 'Opportunities for collaboration between users';

COMMENT ON TABLE public.user_integration_responsibilities IS 'Define user responsibilities and permissions for company integrations';
COMMENT ON COLUMN public.user_integration_responsibilities.responsibility_type IS 'Type of responsibility (owner, admin, user, viewer, etc.)';
COMMENT ON COLUMN public.user_integration_responsibilities.auto_contribute IS 'Whether user automatically contributes data to company intelligence';
COMMENT ON COLUMN public.user_integration_responsibilities.contribution_frequency IS 'How often the user contributes data (realtime, hourly, daily, etc.)'; 