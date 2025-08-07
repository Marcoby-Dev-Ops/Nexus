-- Migration: Enhance Companies Intelligence System
-- This migration applies the same comprehensive logic from user_profiles to companies
-- for integration and analysis purposes

-- ====================================================================
-- STEP 1: ADD INTELLIGENCE SYSTEM FIELDS
-- ====================================================================

-- Add intelligence system fields to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS intelligence_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS intelligence_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS intelligence_profile JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS integration_status JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS analysis_metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS business_context JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS ai_insights JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS performance_metrics JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS risk_assessment JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS growth_indicators JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS market_position JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS competitive_analysis JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS customer_intelligence JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS operational_metrics JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS financial_health JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS technology_stack JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS compliance_status JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS sustainability_metrics JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS innovation_index JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS talent_analytics JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS supply_chain_metrics JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS brand_health JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS stakeholder_sentiment JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS regulatory_landscape JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS market_trends JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS industry_benchmarks JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS predictive_analytics JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS scenario_planning JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS kpi_dashboard JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS alert_configuration JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS reporting_schedule JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS data_quality_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_intelligence_update TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS intelligence_version TEXT DEFAULT '1.0';

-- ====================================================================
-- STEP 2: CREATE COMPANY INTELLIGENCE PROFILES TABLE
-- ====================================================================

-- Create a dedicated table for company intelligence profiles
CREATE TABLE IF NOT EXISTS public.company_intelligence_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    
    -- Intelligence System Status
    intelligence_completed BOOLEAN DEFAULT false,
    intelligence_score INTEGER DEFAULT 0,
    data_quality_score INTEGER DEFAULT 0,
    last_analysis_at TIMESTAMPTZ,
    
    -- Integration Intelligence
    active_integrations TEXT[] DEFAULT '{}',
    integration_health JSONB DEFAULT '{}',
    data_freshness JSONB DEFAULT '{}',
    sync_status JSONB DEFAULT '{}',
    
    -- Business Intelligence
    business_context JSONB DEFAULT '{}',
    market_position JSONB DEFAULT '{}',
    competitive_landscape JSONB DEFAULT '{}',
    industry_benchmarks JSONB DEFAULT '{}',
    
    -- Performance Intelligence
    kpi_metrics JSONB DEFAULT '{}',
    performance_trends JSONB DEFAULT '{}',
    goal_tracking JSONB DEFAULT '{}',
    alert_triggers JSONB DEFAULT '{}',
    
    -- Risk & Compliance Intelligence
    risk_assessment JSONB DEFAULT '{}',
    compliance_status JSONB DEFAULT '{}',
    regulatory_landscape JSONB DEFAULT '{}',
    threat_analysis JSONB DEFAULT '{}',
    
    -- Customer Intelligence
    customer_segments JSONB DEFAULT '{}',
    customer_satisfaction JSONB DEFAULT '{}',
    customer_lifetime_value JSONB DEFAULT '{}',
    churn_analytics JSONB DEFAULT '{}',
    
    -- Financial Intelligence
    financial_health JSONB DEFAULT '{}',
    cash_flow_analysis JSONB DEFAULT '{}',
    profitability_metrics JSONB DEFAULT '{}',
    cost_optimization JSONB DEFAULT '{}',
    
    -- Operational Intelligence
    operational_efficiency JSONB DEFAULT '{}',
    process_optimization JSONB DEFAULT '{}',
    resource_utilization JSONB DEFAULT '{}',
    quality_metrics JSONB DEFAULT '{}',
    
    -- Technology Intelligence
    technology_stack JSONB DEFAULT '{}',
    digital_transformation JSONB DEFAULT '{}',
    cybersecurity_posture JSONB DEFAULT '{}',
    innovation_index JSONB DEFAULT '{}',
    
    -- Talent Intelligence
    talent_analytics JSONB DEFAULT '{}',
    employee_engagement JSONB DEFAULT '{}',
    skill_gaps JSONB DEFAULT '{}',
    succession_planning JSONB DEFAULT '{}',
    
    -- Sustainability Intelligence
    sustainability_metrics JSONB DEFAULT '{}',
    environmental_impact JSONB DEFAULT '{}',
    social_responsibility JSONB DEFAULT '{}',
    governance_metrics JSONB DEFAULT '{}',
    
    -- Predictive Intelligence
    predictive_analytics JSONB DEFAULT '{}',
    scenario_planning JSONB DEFAULT '{}',
    trend_analysis JSONB DEFAULT '{}',
    forecasting_models JSONB DEFAULT '{}',
    
    -- AI Insights
    ai_insights JSONB DEFAULT '[]',
    correlation_discoveries JSONB DEFAULT '[]',
    anomaly_detections JSONB DEFAULT '[]',
    recommendation_engine JSONB DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version TEXT DEFAULT '1.0',
    
    -- Constraints
    UNIQUE(company_id)
);

-- ====================================================================
-- STEP 3: CREATE COMPANY INTEGRATION ANALYSIS TABLE
-- ====================================================================

-- Create a table to track integration analysis for companies
CREATE TABLE IF NOT EXISTS public.company_integration_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    integration_id UUID REFERENCES public.integrations(id) ON DELETE CASCADE,
    
    -- Integration Analysis
    integration_name TEXT NOT NULL,
    analysis_status TEXT DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'analyzing', 'completed', 'error')),
    data_coverage_percentage INTEGER DEFAULT 0,
    data_quality_score INTEGER DEFAULT 0,
    last_analysis_at TIMESTAMPTZ,
    
    -- Cross-Platform Intelligence
    cross_platform_correlations JSONB DEFAULT '[]',
    data_synergy_opportunities JSONB DEFAULT '[]',
    integration_gaps JSONB DEFAULT '[]',
    optimization_recommendations JSONB DEFAULT '[]',
    
    -- Business Impact Analysis
    business_impact_score INTEGER DEFAULT 0,
    roi_analysis JSONB DEFAULT '{}',
    efficiency_gains JSONB DEFAULT '{}',
    cost_savings JSONB DEFAULT '{}',
    
    -- Technical Analysis
    api_performance JSONB DEFAULT '{}',
    data_freshness JSONB DEFAULT '{}',
    error_rates JSONB DEFAULT '{}',
    sync_frequency JSONB DEFAULT '{}',
    
    -- Intelligence Metrics
    insights_generated INTEGER DEFAULT 0,
    predictions_accuracy DECIMAL(5,2) DEFAULT 0,
    anomaly_detections INTEGER DEFAULT 0,
    correlation_discoveries INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(company_id, integration_id)
);

-- ====================================================================
-- STEP 4: CREATE COMPANY INTELLIGENCE TRIGGERS
-- ====================================================================

-- Function to update company intelligence when integrations change
CREATE OR REPLACE FUNCTION update_company_intelligence()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the company's intelligence profile
    INSERT INTO public.company_intelligence_profiles (
        company_id,
        intelligence_completed,
        intelligence_score,
        data_quality_score,
        active_integrations,
        integration_health,
        last_analysis_at,
        updated_at
    ) VALUES (
        NEW.company_id,
        false, -- Will be calculated
        0,     -- Will be calculated
        0,     -- Will be calculated
        ARRAY[NEW.integration_name],
        jsonb_build_object(NEW.integration_name, jsonb_build_object(
            'status', NEW.status,
            'last_sync', NEW.last_sync_at,
            'data_quality', 0
        )),
        NOW(),
        NOW()
    )
    ON CONFLICT (company_id) DO UPDATE SET
        active_integrations = CASE 
            WHEN NEW.status = 'connected' THEN 
                company_intelligence_profiles.active_integrations || NEW.integration_name
            ELSE 
                array_remove(company_intelligence_profiles.active_integrations, NEW.integration_name)
        END,
        integration_health = company_intelligence_profiles.integration_health || 
            jsonb_build_object(NEW.integration_name, jsonb_build_object(
                'status', NEW.status,
                'last_sync', NEW.last_sync_at,
                'data_quality', 0
            )),
        last_analysis_at = NOW(),
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user_integrations changes
DROP TRIGGER IF EXISTS trigger_update_company_intelligence ON public.user_integrations;
CREATE TRIGGER trigger_update_company_intelligence
    AFTER INSERT OR UPDATE OR DELETE ON public.user_integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_company_intelligence();

-- ====================================================================
-- STEP 5: CREATE INTELLIGENCE SCORING FUNCTION
-- ====================================================================

-- Function to calculate company intelligence score
CREATE OR REPLACE FUNCTION calculate_company_intelligence_score(company_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    score INTEGER := 0;
    integration_count INTEGER;
    data_quality_avg DECIMAL;
    profile_completeness DECIMAL;
BEGIN
    -- Count active integrations
    SELECT COUNT(*) INTO integration_count
    FROM public.user_integrations ui
    JOIN public.user_profiles up ON ui.user_id = up.id
    WHERE up.company_id = company_uuid 
    AND ui.status = 'connected';
    
    -- Integration score (max 40 points)
    score := score + LEAST(integration_count * 8, 40);
    
    -- Get average data quality
    SELECT COALESCE(AVG(data_quality_score), 0) INTO data_quality_avg
    FROM public.company_integration_analysis
    WHERE company_id = company_uuid;
    
    -- Data quality score (max 30 points)
    score := score + LEAST(data_quality_avg * 0.3, 30);
    
    -- Profile completeness score (max 30 points)
    SELECT 
        CASE 
            WHEN name IS NOT NULL THEN 5 ELSE 0 END +
        CASE 
            WHEN industry IS NOT NULL THEN 5 ELSE 0 END +
        CASE 
            WHEN size IS NOT NULL THEN 5 ELSE 0 END +
        CASE 
            WHEN website IS NOT NULL THEN 3 ELSE 0 END +
        CASE 
            WHEN description IS NOT NULL THEN 3 ELSE 0 END +
        CASE 
            WHEN founded IS NOT NULL THEN 2 ELSE 0 END +
        CASE 
            WHEN employee_count IS NOT NULL THEN 3 ELSE 0 END +
        CASE 
            WHEN mrr IS NOT NULL THEN 2 ELSE 0 END +
        CASE 
            WHEN gross_margin IS NOT NULL THEN 2 ELSE 0 END
    INTO profile_completeness
    FROM public.companies
    WHERE id = company_uuid;
    
    score := score + LEAST(profile_completeness, 30);
    
    RETURN LEAST(score, 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- STEP 6: CREATE INTELLIGENCE UPDATE FUNCTION
-- ====================================================================

-- Function to update company intelligence
CREATE OR REPLACE FUNCTION update_company_intelligence_profile(company_uuid UUID)
RETURNS VOID AS $$
DECLARE
    intelligence_score INTEGER;
BEGIN
    -- Calculate intelligence score
    SELECT calculate_company_intelligence_score(company_uuid) INTO intelligence_score;
    
    -- Update company intelligence profile
    UPDATE public.company_intelligence_profiles
    SET 
        intelligence_score = intelligence_score,
        intelligence_completed = (intelligence_score >= 50),
        last_analysis_at = NOW(),
        updated_at = NOW()
    WHERE company_id = company_uuid;
    
    -- Update main companies table
    UPDATE public.companies
    SET 
        intelligence_score = intelligence_score,
        intelligence_completed = (intelligence_score >= 50),
        last_intelligence_update = NOW(),
        updated_at = NOW()
    WHERE id = company_uuid;
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- STEP 7: CREATE INDEXES FOR PERFORMANCE
-- ====================================================================

-- Indexes for company intelligence
CREATE INDEX IF NOT EXISTS idx_company_intelligence_profiles_company_id 
ON public.company_intelligence_profiles(company_id);

CREATE INDEX IF NOT EXISTS idx_company_intelligence_profiles_score 
ON public.company_intelligence_profiles(intelligence_score DESC);

CREATE INDEX IF NOT EXISTS idx_company_intelligence_profiles_completed 
ON public.company_intelligence_profiles(intelligence_completed);

-- Indexes for integration analysis
CREATE INDEX IF NOT EXISTS idx_company_integration_analysis_company_id 
ON public.company_integration_analysis(company_id);

CREATE INDEX IF NOT EXISTS idx_company_integration_analysis_integration_id 
ON public.company_integration_analysis(integration_id);

CREATE INDEX IF NOT EXISTS idx_company_integration_analysis_status 
ON public.company_integration_analysis(analysis_status);

-- Indexes for companies table intelligence fields
CREATE INDEX IF NOT EXISTS idx_companies_intelligence_score 
ON public.companies(intelligence_score DESC);

CREATE INDEX IF NOT EXISTS idx_companies_intelligence_completed 
ON public.companies(intelligence_completed);

-- ====================================================================
-- STEP 8: ADD COMMENTS FOR DOCUMENTATION
-- ====================================================================

COMMENT ON COLUMN public.companies.intelligence_completed IS 'Whether the company has completed intelligence setup and analysis';
COMMENT ON COLUMN public.companies.intelligence_score IS 'Overall intelligence score (0-100) based on data quality and integration coverage';
COMMENT ON COLUMN public.companies.intelligence_profile IS 'Detailed intelligence profile with analysis results and insights';
COMMENT ON COLUMN public.companies.integration_status IS 'Status of all integrations for this company';
COMMENT ON COLUMN public.companies.analysis_metadata IS 'Metadata about intelligence analysis and processing';
COMMENT ON COLUMN public.companies.business_context IS 'Business context and operational intelligence';
COMMENT ON COLUMN public.companies.ai_insights IS 'AI-generated insights and recommendations';
COMMENT ON COLUMN public.companies.performance_metrics IS 'Key performance indicators and metrics';
COMMENT ON COLUMN public.companies.risk_assessment IS 'Risk assessment and mitigation strategies';
COMMENT ON COLUMN public.companies.growth_indicators IS 'Growth indicators and trend analysis';
COMMENT ON COLUMN public.companies.market_position IS 'Market position and competitive analysis';
COMMENT ON COLUMN public.companies.competitive_analysis IS 'Competitive landscape and positioning';
COMMENT ON COLUMN public.companies.customer_intelligence IS 'Customer insights and behavior analysis';
COMMENT ON COLUMN public.companies.operational_metrics IS 'Operational efficiency and process metrics';
COMMENT ON COLUMN public.companies.financial_health IS 'Financial health and performance indicators';
COMMENT ON COLUMN public.companies.technology_stack IS 'Technology stack and digital transformation status';
COMMENT ON COLUMN public.companies.compliance_status IS 'Compliance and regulatory status';
COMMENT ON COLUMN public.companies.sustainability_metrics IS 'Sustainability and ESG metrics';
COMMENT ON COLUMN public.companies.innovation_index IS 'Innovation and R&D metrics';
COMMENT ON COLUMN public.companies.talent_analytics IS 'Talent and workforce analytics';
COMMENT ON COLUMN public.companies.supply_chain_metrics IS 'Supply chain and logistics metrics';
COMMENT ON COLUMN public.companies.brand_health IS 'Brand health and reputation metrics';
COMMENT ON COLUMN public.companies.stakeholder_sentiment IS 'Stakeholder sentiment and engagement';
COMMENT ON COLUMN public.companies.regulatory_landscape IS 'Regulatory landscape and compliance requirements';
COMMENT ON COLUMN public.companies.market_trends IS 'Market trends and industry analysis';
COMMENT ON COLUMN public.companies.industry_benchmarks IS 'Industry benchmarks and peer comparisons';
COMMENT ON COLUMN public.companies.predictive_analytics IS 'Predictive analytics and forecasting';
COMMENT ON COLUMN public.companies.scenario_planning IS 'Scenario planning and what-if analysis';
COMMENT ON COLUMN public.companies.kpi_dashboard IS 'KPI dashboard and performance tracking';
COMMENT ON COLUMN public.companies.alert_configuration IS 'Alert configuration and notification settings';
COMMENT ON COLUMN public.companies.reporting_schedule IS 'Reporting schedule and automation settings';
COMMENT ON COLUMN public.companies.data_quality_score IS 'Overall data quality score (0-100)';
COMMENT ON COLUMN public.companies.last_intelligence_update IS 'Last time intelligence was updated';
COMMENT ON COLUMN public.companies.intelligence_version IS 'Version of intelligence system';

COMMENT ON TABLE public.company_intelligence_profiles IS 'Comprehensive intelligence profiles for companies with detailed analysis and insights';
COMMENT ON TABLE public.company_integration_analysis IS 'Analysis of integration data and cross-platform intelligence for companies'; 