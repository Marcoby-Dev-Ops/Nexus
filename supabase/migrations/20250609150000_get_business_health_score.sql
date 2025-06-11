-- Migration: Create get_business_health_score RPC
-- This stub returns placeholder metrics; replace with real calculations later
CREATE OR REPLACE FUNCTION public.get_business_health_score()
RETURNS TABLE(
  score integer,
  breakdown jsonb
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    ROUND((80 + 75 + 85 + 90)::numeric / 4)::integer AS score,
    jsonb_build_object(
      'revenue', 80,
      'subscriptions', 75,
      'sales', 85,
      'active_users', 90
    ) AS breakdown;
$$; 