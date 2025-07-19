-- Business Benchmarking and Peer Comparison Infrastructure
-- Supports living business assessment with historical data and peer comparisons

-- Business Health History Table
-- Tracks historical business health scores for trend analysis
CREATE TABLE IF NOT EXISTS public.business_health_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  overall_score integer NOT NULL,
  connected_sources integer DEFAULT 0,
  verified_sources integer DEFAULT 0,
  category_scores jsonb DEFAULT '{}',
  data_quality_score integer DEFAULT 0,
  completion_percentage integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Business Profiles Table  
-- Stores business information for peer comparison grouping
CREATE TABLE IF NOT EXISTS public.business_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text,
  industry text,
  business_size text CHECK (business_size IN ('Startup', 'Small Business', 'Medium Business', 'Enterprise')),
  founded_year integer,
  employee_count integer,
  annual_revenue_range text,
  location_country text,
  location_region text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Achievements Table
-- Tracks user achievements and milestones
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  points_earned integer DEFAULT 0,
  unlocked_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Add RLS policies for all tables
ALTER TABLE public.business_health_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Business Health History Policies
CREATE POLICY "Users can view their own health history" ON public.business_health_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own health history" ON public.business_health_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Business Profiles Policies
CREATE POLICY "Users can view their own business profile" ON public.business_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own business profile" ON public.business_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own business profile" ON public.business_profiles
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- User Achievements Policies
CREATE POLICY "Users can view their own achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements" ON public.user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_health_history_user_id ON public.business_health_history(user_id);
CREATE INDEX IF NOT EXISTS idx_business_health_history_created_at ON public.business_health_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_profiles_industry ON public.business_profiles(industry);
CREATE INDEX IF NOT EXISTS idx_business_profiles_size ON public.business_profiles(business_size);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);

-- Function to get anonymized business scores for benchmarking
CREATE OR REPLACE FUNCTION public.get_anonymized_business_scores(
  user_industry text DEFAULT NULL,
  user_size text DEFAULT NULL,
  exclude_user uuid DEFAULT NULL
)
RETURNS TABLE (
  score integer,
  industry text,
  business_size text,
  category_scores jsonb
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bh.overall_score as score,
    COALESCE(bp.industry, 'Unknown') as industry,
    COALESCE(bp.business_size, 'Unknown') as business_size,
    bh.category_scores
  FROM (
    -- Get the latest health score for each user
    SELECT DISTINCT ON (bh_inner.user_id) 
      bh_inner.user_id,
      bh_inner.overall_score,
      bh_inner.category_scores
    FROM public.business_health_history bh_inner
    WHERE (exclude_user IS NULL OR bh_inner.user_id != exclude_user)
    ORDER BY bh_inner.user_id, bh_inner.created_at DESC
  ) bh
  LEFT JOIN public.business_profiles bp ON bh.user_id = bp.user_id
  WHERE 
    -- Filter by industry if specified
    (user_industry IS NULL OR bp.industry = user_industry OR bp.industry IS NULL)
    AND
    -- Filter by business size if specified  
    (user_size IS NULL OR bp.business_size = user_size OR bp.business_size IS NULL)
    AND
    -- Exclude the requesting user
    (exclude_user IS NULL OR bh.user_id != exclude_user)
  ORDER BY bh.overall_score DESC;
END;
$$;

-- Function to get peer businesses for comparison
CREATE OR REPLACE FUNCTION public.get_peer_businesses(
  user_industry text DEFAULT NULL,
  user_size text DEFAULT NULL,
  exclude_user uuid DEFAULT NULL
)
RETURNS TABLE (
  overall_score integer,
  category_scores jsonb,
  industry text,
  business_size text
)
LANGUAGE plpgsql
SECURITY DEFINER  
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bh.overall_score,
    bh.category_scores,
    bp.industry,
    bp.business_size
  FROM (
    -- Get the latest health score for each user
    SELECT DISTINCT ON (bh_inner.user_id) 
      bh_inner.user_id,
      bh_inner.overall_score,
      bh_inner.category_scores
    FROM public.business_health_history bh_inner
    WHERE (exclude_user IS NULL OR bh_inner.user_id != exclude_user)
    ORDER BY bh_inner.user_id, bh_inner.created_at DESC
  ) bh
  INNER JOIN public.business_profiles bp ON bh.user_id = bp.user_id
  WHERE 
    -- Match industry
    (user_industry IS NULL OR bp.industry = user_industry)
    AND
    -- Match business size
    (user_size IS NULL OR bp.business_size = user_size)
    AND
    -- Exclude the requesting user
    (exclude_user IS NULL OR bh.user_id != exclude_user)
  ORDER BY bh.overall_score DESC;
END;
$$;

-- Function to get industry insights
CREATE OR REPLACE FUNCTION public.get_industry_insights(
  industry_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  avg_score numeric;
  top_categories text[];
  common_connections text[];
BEGIN
  -- Calculate industry average score
  SELECT AVG(bh.overall_score)::integer INTO avg_score
  FROM (
    SELECT DISTINCT ON (bh_inner.user_id) 
      bh_inner.overall_score
    FROM public.business_health_history bh_inner
    INNER JOIN public.business_profiles bp ON bh_inner.user_id = bp.user_id
    WHERE bp.industry = industry_name
    ORDER BY bh_inner.user_id, bh_inner.created_at DESC
  ) bh;

  -- Get most common categories (simplified - would need more complex logic)
  top_categories := ARRAY['Communications', 'Sales', 'Finance'];
  
  -- Get common connections (simplified - would query actual integration data)
  common_connections := ARRAY['Gmail', 'HubSpot CRM', 'Google Analytics'];

  -- Build result
  result := jsonb_build_object(
    'industry', industry_name,
    'averageScore', COALESCE(avg_score, 52),
    'topCategories', to_jsonb(top_categories),
    'commonConnections', to_jsonb(common_connections),
    'growthOpportunities', to_jsonb(ARRAY[
      'Connect financial data sources',
      'Verify business profile information',
      'Set up CRM integration'
    ])
  );

  RETURN result;
END;
$$;

-- Function to automatically record business health history
CREATE OR REPLACE FUNCTION public.record_business_health_snapshot(
  p_user_id uuid,
  p_overall_score integer,
  p_connected_sources integer DEFAULT 0,
  p_verified_sources integer DEFAULT 0,
  p_category_scores jsonb DEFAULT '{}',
  p_data_quality_score integer DEFAULT 0,
  p_completion_percentage integer DEFAULT 0
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  snapshot_id uuid;
BEGIN
  INSERT INTO public.business_health_history (
    user_id,
    overall_score,
    connected_sources,
    verified_sources,
    category_scores,
    data_quality_score,
    completion_percentage
  ) VALUES (
    p_user_id,
    p_overall_score,
    p_connected_sources,
    p_verified_sources,
    p_category_scores,
    p_data_quality_score,
    p_completion_percentage
  ) RETURNING id INTO snapshot_id;

  RETURN snapshot_id;
END;
$$;

-- Create updated_at trigger for business_profiles
CREATE TRIGGER update_business_profiles_updated_at
  BEFORE UPDATE ON public.business_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample business profiles for testing (remove in production)
INSERT INTO public.business_profiles (user_id, business_name, industry, business_size, founded_year) 
VALUES 
  (auth.uid(), 'Sample Business', 'Technology', 'Small Business', 2023)
ON CONFLICT (user_id) DO NOTHING;

-- Insert sample business health history for testing
INSERT INTO public.business_health_history (user_id, overall_score, connected_sources, verified_sources, category_scores, data_quality_score, completion_percentage)
VALUES 
  (auth.uid(), 25, 2, 1, '{"sales": 30, "finance": 20, "operations": 25, "marketing": 15, "communications": 40, "business_profile": 60}', 65, 30)
ON CONFLICT DO NOTHING; 