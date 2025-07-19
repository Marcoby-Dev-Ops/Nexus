-- Migration: Create get_personal_analytics function for user dashboards
-- Follows Nexus conventions: secure, scalable, extensible, documented

-- Drop if exists for idempotency
DROP FUNCTION IF EXISTS get_personal_analytics(UUID);

CREATE OR REPLACE FUNCTION get_personal_analytics(user_uuid UUID DEFAULT auth.uid())
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    -- Total thoughts by category
    result := jsonb_build_object(
        'total_by_category', (
            SELECT jsonb_object_agg(category, count) FROM (
                SELECT category, COUNT(*) AS count
                FROM personal_thoughts
                WHERE user_id = user_uuid
                GROUP BY category
            ) t
        ),
        -- Recent activity (last 7 and 30 days)
        'recent_activity', jsonb_build_object(
            'last_7_days', (
                SELECT COUNT(*) FROM personal_thoughts
                WHERE user_id = user_uuid AND created_at >= NOW() - INTERVAL '7 days'
            ),
            'last_30_days', (
                SELECT COUNT(*) FROM personal_thoughts
                WHERE user_id = user_uuid AND created_at >= NOW() - INTERVAL '30 days'
            )
        ),
        -- Number of business connections
        'business_connections', (
            SELECT COUNT(DISTINCT personal_thought_id)
            FROM insight_business_connections ibc
            JOIN personal_thoughts pt ON pt.id = ibc.personal_thought_id
            WHERE pt.user_id = user_uuid
        ),
        -- Most common tags
        'top_tags', (
            SELECT jsonb_agg(tag) FROM (
                SELECT tag FROM (
                    SELECT unnest(tags) AS tag
                    FROM personal_thoughts
                    WHERE user_id = user_uuid AND tags IS NOT NULL
                ) all_tags
                GROUP BY tag
                ORDER BY COUNT(*) DESC, tag
                LIMIT 5
            ) top
        ),
        -- Activity streak (days with at least one thought in a row)
        'activity_streak', (
            SELECT COALESCE(MAX(streak), 0) FROM (
                SELECT COUNT(*) AS streak
                FROM (
                    SELECT created_at::date AS day, COUNT(*)
                    FROM personal_thoughts
                    WHERE user_id = user_uuid
                    GROUP BY created_at::date
                    ORDER BY day DESC
                    LIMIT 30
                ) days
                WHERE day >= (SELECT MAX(created_at::date) FROM personal_thoughts WHERE user_id = user_uuid) - INTERVAL '29 days'
            ) s
        )
    );
    RETURN result;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_personal_analytics(UUID) TO authenticated;

-- Comments for maintainability
COMMENT ON FUNCTION get_personal_analytics(UUID) IS 'Returns a JSON object with personal analytics for the specified user, including category counts, recent activity, business connections, top tags, and activity streak.'; 