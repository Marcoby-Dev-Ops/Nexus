-- Migration: Create get_business_health_score RPC
-- Enhanced version that pulls live data from multiple integrated sources
CREATE OR REPLACE FUNCTION public.get_business_health_score()
RETURNS TABLE(
  score integer,
  breakdown jsonb,
  last_updated timestamptz,
  data_sources text[],
  completeness_percentage integer
)
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  current_user_id uuid;
  current_company_id uuid;
  sales_score integer := 0;
  marketing_score integer := 0;
  finance_score integer := 0;
  operations_score integer := 0;
  support_score integer := 0;
  overall_score integer := 0;
  sources_used text[] := ARRAY[]::text[];
  total_data_points integer := 0;
  available_data_points integer := 0;
  
  -- Data variables
  hubspot_data jsonb;
  apollo_data jsonb;
  marcoby_data jsonb;
  kpi_data jsonb;
BEGIN
  -- Get current user and company
  current_user_id := auth.uid();
  
  -- Get user's company
  SELECT company_id INTO current_company_id
  FROM user_profiles 
  WHERE user_id = current_user_id;
  
  IF current_company_id IS NULL THEN
    -- Return minimal data for users without companies
    RETURN QUERY
    SELECT 
      0 as score,
      jsonb_build_object(
        'sales', 0,
        'marketing', 0,
        'finance', 0,
        'operations', 0,
        'support', 0,
        'message', 'No company profile found'
      ) as breakdown,
      NOW() as last_updated,
      ARRAY[]::text[] as data_sources,
      0 as completeness_percentage;
    RETURN;
  END IF;
  
  -- 1. SALES METRICS (HubSpot + Apollo integration)
  BEGIN
    -- Get latest HubSpot metrics
    SELECT 
      jsonb_build_object(
        'deals_count', COUNT(CASE WHEN status = 'open' THEN 1 END),
        'deals_value', COALESCE(SUM(CASE WHEN status = 'open' THEN amount ELSE 0 END), 0),
        'closed_deals', COUNT(CASE WHEN status = 'closed_won' THEN 1 END),
        'conversion_rate', CASE 
          WHEN COUNT(*) > 0 THEN (COUNT(CASE WHEN status = 'closed_won' THEN 1 END) * 100.0 / COUNT(*))
          ELSE 0 
        END
      ) INTO hubspot_data
    FROM deals 
    WHERE company_id = current_company_id 
      AND created_at >= NOW() - INTERVAL '90 days';
    
    -- Get Apollo outreach metrics
    SELECT 
      jsonb_build_object(
        'contacts_added', COUNT(*),
        'email_opens', COALESCE(SUM((metadata->>'email_opens')::integer), 0),
        'responses', COALESCE(SUM((metadata->>'responses')::integer), 0)
      ) INTO apollo_data
    FROM contacts 
    WHERE company_id = current_company_id 
      AND created_at >= NOW() - INTERVAL '30 days';
    
    -- Calculate sales score
    sales_score := LEAST(100, GREATEST(0, 
      COALESCE((hubspot_data->>'conversion_rate')::numeric, 0) + 
      CASE WHEN (apollo_data->>'contacts_added')::integer > 50 THEN 20 ELSE 0 END +
      CASE WHEN (hubspot_data->>'deals_count')::integer > 10 THEN 30 ELSE 0 END
    ));
    
    IF hubspot_data IS NOT NULL OR apollo_data IS NOT NULL THEN
      sources_used := array_append(sources_used, 'CRM');
      available_data_points := available_data_points + 1;
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    -- Handle errors gracefully
    sales_score := 0;
  END;
  
  -- 2. MARKETING METRICS (Website analytics + lead generation)
  BEGIN
    -- Get marketing KPIs from snapshots
    SELECT 
      jsonb_build_object(
        'website_traffic', COALESCE(MAX(CASE WHEN kpi_key = 'website_traffic' THEN (value->>'value')::integer END), 0),
        'lead_conversion', COALESCE(MAX(CASE WHEN kpi_key = 'lead_conversion_rate' THEN (value->>'value')::numeric END), 0),
        'social_engagement', COALESCE(MAX(CASE WHEN kpi_key = 'social_engagement' THEN (value->>'value')::integer END), 0)
      ) INTO kpi_data
    FROM ai_kpi_snapshots 
    WHERE org_id = current_company_id 
      AND department_id = 'marketing'
      AND captured_at >= NOW() - INTERVAL '30 days';
    
    marketing_score := LEAST(100, GREATEST(0,
      CASE WHEN (kpi_data->>'website_traffic')::integer > 1000 THEN 30 ELSE 0 END +
      CASE WHEN (kpi_data->>'lead_conversion')::numeric > 2.0 THEN 40 ELSE 0 END +
      CASE WHEN (kpi_data->>'social_engagement')::integer > 100 THEN 30 ELSE 0 END
    ));
    
    IF kpi_data IS NOT NULL THEN
      sources_used := array_append(sources_used, 'Marketing KPIs');
      available_data_points := available_data_points + 1;
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    marketing_score := 0;
  END;
  
  -- 3. FINANCE METRICS (Revenue + profitability)
  BEGIN
    -- Get financial KPIs
    SELECT 
      jsonb_build_object(
        'monthly_revenue', COALESCE(MAX(CASE WHEN kpi_key = 'monthly_revenue' THEN (value->>'value')::numeric END), 0),
        'profit_margin', COALESCE(MAX(CASE WHEN kpi_key = 'profit_margin' THEN (value->>'value')::numeric END), 0),
        'cash_flow', COALESCE(MAX(CASE WHEN kpi_key = 'cash_flow' THEN (value->>'value')::numeric END), 0)
      ) INTO kpi_data
    FROM ai_kpi_snapshots 
    WHERE org_id = current_company_id 
      AND department_id = 'finance'
      AND captured_at >= NOW() - INTERVAL '30 days';
    
    finance_score := LEAST(100, GREATEST(0,
      CASE WHEN (kpi_data->>'monthly_revenue')::numeric > 10000 THEN 40 ELSE 0 END +
      CASE WHEN (kpi_data->>'profit_margin')::numeric > 20 THEN 30 ELSE 0 END +
      CASE WHEN (kpi_data->>'cash_flow')::numeric > 0 THEN 30 ELSE 0 END
    ));
    
    IF kpi_data IS NOT NULL THEN
      sources_used := array_append(sources_used, 'Financial KPIs');
      available_data_points := available_data_points + 1;
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    finance_score := 0;
  END;
  
  -- 4. OPERATIONS METRICS (Marcoby Cloud + automation)
  BEGIN
    -- Get operational KPIs
    SELECT 
      jsonb_build_object(
        'uptime', COALESCE(MAX(CASE WHEN kpi_key = 'service_uptime' THEN (value->>'value')::numeric END), 99.0),
        'automation_coverage', COALESCE(MAX(CASE WHEN kpi_key = 'automation_coverage' THEN (value->>'value')::numeric END), 0),
        'asset_utilization', COALESCE(MAX(CASE WHEN kpi_key = 'asset_utilization' THEN (value->>'value')::numeric END), 0)
      ) INTO marcoby_data
    FROM ai_kpi_snapshots 
    WHERE org_id = current_company_id 
      AND department_id = 'operations'
      AND captured_at >= NOW() - INTERVAL '30 days';
    
    operations_score := LEAST(100, GREATEST(0,
      CASE WHEN (marcoby_data->>'uptime')::numeric > 99.5 THEN 40 ELSE 0 END +
      CASE WHEN (marcoby_data->>'automation_coverage')::numeric > 50 THEN 30 ELSE 0 END +
      CASE WHEN (marcoby_data->>'asset_utilization')::numeric BETWEEN 60 AND 90 THEN 30 ELSE 0 END
    ));
    
    IF marcoby_data IS NOT NULL THEN
      sources_used := array_append(sources_used, 'Marcoby Cloud');
      available_data_points := available_data_points + 1;
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    operations_score := 0;
  END;
  
  -- 5. SUPPORT METRICS (Customer satisfaction + response times)
  BEGIN
    -- Get support KPIs
    SELECT 
      jsonb_build_object(
        'response_time', COALESCE(MAX(CASE WHEN kpi_key = 'avg_response_time' THEN (value->>'value')::numeric END), 24),
        'satisfaction_score', COALESCE(MAX(CASE WHEN kpi_key = 'customer_satisfaction' THEN (value->>'value')::numeric END), 0),
        'ticket_resolution', COALESCE(MAX(CASE WHEN kpi_key = 'ticket_resolution_rate' THEN (value->>'value')::numeric END), 0)
      ) INTO kpi_data
    FROM ai_kpi_snapshots 
    WHERE org_id = current_company_id 
      AND department_id = 'support'
      AND captured_at >= NOW() - INTERVAL '30 days';
    
    support_score := LEAST(100, GREATEST(0,
      CASE WHEN (kpi_data->>'response_time')::numeric < 2 THEN 30 ELSE 0 END +
      CASE WHEN (kpi_data->>'satisfaction_score')::numeric > 8 THEN 40 ELSE 0 END +
      CASE WHEN (kpi_data->>'ticket_resolution')::numeric > 90 THEN 30 ELSE 0 END
    ));
    
    IF kpi_data IS NOT NULL THEN
      sources_used := array_append(sources_used, 'Support KPIs');
      available_data_points := available_data_points + 1;
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    support_score := 0;
  END;
  
  -- Calculate overall score (weighted average)
  total_data_points := 5; -- sales, marketing, finance, operations, support
  overall_score := ROUND(
    (sales_score * 0.25) + 
    (marketing_score * 0.20) + 
    (finance_score * 0.25) + 
    (operations_score * 0.20) + 
    (support_score * 0.10)
  );
  
  -- Return comprehensive results
  RETURN QUERY
  SELECT 
    overall_score as score,
    jsonb_build_object(
      'sales', sales_score,
      'marketing', marketing_score,
      'finance', finance_score,
      'operations', operations_score,
      'support', support_score,
      'details', jsonb_build_object(
        'hubspot_data', hubspot_data,
        'apollo_data', apollo_data,
        'marcoby_data', marcoby_data,
        'company_id', current_company_id
      )
    ) as breakdown,
    NOW() as last_updated,
    sources_used as data_sources,
    CASE 
      WHEN total_data_points > 0 THEN ROUND((available_data_points * 100.0) / total_data_points)
      ELSE 0 
    END as completeness_percentage;
END;
$$; 