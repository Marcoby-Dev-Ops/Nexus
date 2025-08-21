-- Migration: Disable RLS for insight_feedback table
-- The server handles security through application-level filtering, so RLS is not needed

-- Disable RLS for insight_feedback table
ALTER TABLE insight_feedback DISABLE ROW LEVEL SECURITY;

-- Drop the RLS policies since they're not needed
DROP POLICY IF EXISTS "Users can view own insight feedback" ON insight_feedback;
DROP POLICY IF EXISTS "Users can insert own insight feedback" ON insight_feedback;
DROP POLICY IF EXISTS "Users can update own insight feedback" ON insight_feedback;
DROP POLICY IF EXISTS "System can update learning flags" ON insight_feedback;
