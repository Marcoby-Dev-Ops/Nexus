-- Migration: Fix analytics_events RLS policies
-- This migration adds proper RLS policies for analytics_events table to prevent 403 errors

-- ====================================================================
-- ENABLE RLS ON ANALYTICS_EVENTS (if not already enabled)
-- ====================================================================

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- DROP EXISTING POLICIES (if any) TO AVOID CONFLICTS
-- ====================================================================

DROP POLICY IF EXISTS "Users can read own analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Users can insert own analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Users can update own analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Users can delete own analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Service role can access analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Authenticated users can read analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Authenticated users can insert analytics events" ON public.analytics_events;

-- ====================================================================
-- CREATE PROPER RLS POLICIES FOR ANALYTICS_EVENTS
-- ====================================================================

-- Users can read their own analytics events
CREATE POLICY "Users can read own analytics events" ON public.analytics_events
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own analytics events
CREATE POLICY "Users can insert own analytics events" ON public.analytics_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own analytics events
CREATE POLICY "Users can update own analytics events" ON public.analytics_events
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own analytics events
CREATE POLICY "Users can delete own analytics events" ON public.analytics_events
    FOR DELETE USING (auth.uid() = user_id);

-- Service role has full access (for edge functions and admin operations)
CREATE POLICY "Service role can access analytics events" ON public.analytics_events
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ====================================================================
-- GRANT SERVICE ROLE ACCESS
-- ====================================================================

-- Grant service role access to analytics_events table
GRANT ALL PRIVILEGES ON TABLE public.analytics_events TO service_role;

-- ====================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ====================================================================

-- Create indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON public.analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_events_eventtype ON public.analytics_events(eventtype);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON public.analytics_events(session_id);

-- ====================================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- ====================================================================

COMMENT ON TABLE public.analytics_events IS 'Analytics events for tracking user behavior and application metrics';
COMMENT ON COLUMN public.analytics_events.user_id IS 'User ID for the event (nullable for anonymous events)';
COMMENT ON COLUMN public.analytics_events.eventtype IS 'Type of analytics event (e.g., page_view, button_click, error)';
COMMENT ON COLUMN public.analytics_events.properties IS 'JSON object containing event-specific properties';
COMMENT ON COLUMN public.analytics_events.session_id IS 'Session identifier for grouping related events';
COMMENT ON COLUMN public.analytics_events.source IS 'Source of the event (e.g., web, mobile, api)';
COMMENT ON COLUMN public.analytics_events.version IS 'Version of the analytics tracking system';

-- ====================================================================
-- VERIFICATION QUERY
-- ====================================================================

-- This query should return the policies we just created
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
-- FROM pg_policies 
-- WHERE tablename = 'analytics_events'; 