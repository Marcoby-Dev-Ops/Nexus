-- Add personal memory system to support hybrid personal-business intelligence
-- This enables users to capture personal thoughts, goals, and insights within business context

-- Add personal fields to existing profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS personal_manifest JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS learning_goals TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS personal_interests TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS thought_capture_enabled BOOLEAN DEFAULT true;

-- Create personal thoughts table for long-term memory
CREATE TABLE IF NOT EXISTS personal_thoughts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('idea', 'learning', 'reflection', 'goal')),
  tags TEXT[] DEFAULT '{}',
  business_context JSONB DEFAULT '{}',
  connections UUID[] DEFAULT '{}', -- Links to other thoughts or business data
  search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for fast search
CREATE INDEX IF NOT EXISTS personal_thoughts_search_idx ON personal_thoughts USING gin(search_vector);
CREATE INDEX IF NOT EXISTS personal_thoughts_user_id_idx ON personal_thoughts(user_id);
CREATE INDEX IF NOT EXISTS personal_thoughts_category_idx ON personal_thoughts(category);
CREATE INDEX IF NOT EXISTS personal_thoughts_created_at_idx ON personal_thoughts(created_at DESC);

-- Create table to link personal insights to business outcomes
CREATE TABLE IF NOT EXISTS insight_business_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  personal_thought_id UUID REFERENCES personal_thoughts(id) ON DELETE CASCADE,
  business_metric_id UUID, -- Flexible reference to business data
  business_context JSONB DEFAULT '{}',
  connection_type TEXT NOT NULL, -- 'inspired_by', 'led_to', 'solved', 'improved'
  impact_description TEXT,
  impact_score INTEGER CHECK (impact_score >= 1 AND impact_score <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS insight_connections_thought_idx ON insight_business_connections(personal_thought_id);
CREATE INDEX IF NOT EXISTS insight_connections_metric_idx ON insight_business_connections(business_metric_id);

-- Create personal memory timeline view
CREATE OR REPLACE VIEW personal_memory_timeline AS
SELECT 
  pt.id,
  pt.user_id,
  pt.content,
  pt.category,
  pt.tags,
  pt.business_context,
  pt.created_at,
  pt.updated_at,
  COALESCE(
    json_agg(
      json_build_object(
        'connection_id', ibc.id,
        'type', ibc.connection_type,
        'impact', ibc.impact_description,
        'score', ibc.impact_score
      )
    ) FILTER (WHERE ibc.id IS NOT NULL), 
    '[]'::json
  ) as business_connections
FROM personal_thoughts pt
LEFT JOIN insight_business_connections ibc ON pt.id = ibc.personal_thought_id
GROUP BY pt.id, pt.user_id, pt.content, pt.category, pt.tags, pt.business_context, pt.created_at, pt.updated_at
ORDER BY pt.created_at DESC;

-- Enhanced RLS policies for personal memory
ALTER TABLE personal_thoughts ENABLE ROW LEVEL SECURITY;
ALTER TABLE insight_business_connections ENABLE ROW LEVEL SECURITY;

-- Users can only access their own personal thoughts
DROP POLICY IF EXISTS "Users can view own personal thoughts" ON personal_thoughts;
CREATE POLICY "Users can view own personal thoughts" ON personal_thoughts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own personal thoughts" ON personal_thoughts;
CREATE POLICY "Users can insert own personal thoughts" ON personal_thoughts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own personal thoughts" ON personal_thoughts;
CREATE POLICY "Users can update own personal thoughts" ON personal_thoughts
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own personal thoughts" ON personal_thoughts;
CREATE POLICY "Users can delete own personal thoughts" ON personal_thoughts
  FOR DELETE USING (auth.uid() = user_id);

-- Users can only access their own insight connections
DROP POLICY IF EXISTS "Users can view own insight connections" ON insight_business_connections;
CREATE POLICY "Users can view own insight connections" ON insight_business_connections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM personal_thoughts pt 
      WHERE pt.id = insight_business_connections.personal_thought_id 
      AND pt.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own insight connections" ON insight_business_connections;
CREATE POLICY "Users can insert own insight connections" ON insight_business_connections
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM personal_thoughts pt 
      WHERE pt.id = insight_business_connections.personal_thought_id 
      AND pt.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own insight connections" ON insight_business_connections;
CREATE POLICY "Users can update own insight connections" ON insight_business_connections
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM personal_thoughts pt 
      WHERE pt.id = insight_business_connections.personal_thought_id 
      AND pt.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own insight connections" ON insight_business_connections;
CREATE POLICY "Users can delete own insight connections" ON insight_business_connections
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM personal_thoughts pt 
      WHERE pt.id = insight_business_connections.personal_thought_id 
      AND pt.user_id = auth.uid()
    )
  );

-- Create function to search personal thoughts with business context
CREATE OR REPLACE FUNCTION search_personal_thoughts(
  query_text TEXT,
  user_uuid UUID DEFAULT auth.uid(),
  category_filter TEXT DEFAULT NULL,
  business_context_filter JSONB DEFAULT NULL,
  limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  category TEXT,
  tags TEXT[],
  business_context JSONB,
  relevance_score REAL,
  created_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE sql STABLE
AS $$
  SELECT 
    pt.id,
    pt.content,
    pt.category,
    pt.tags,
    pt.business_context,
    ts_rank(pt.search_vector, plainto_tsquery('english', query_text)) as relevance_score,
    pt.created_at
  FROM personal_thoughts pt
  WHERE 
    pt.user_id = user_uuid
    AND pt.search_vector @@ plainto_tsquery('english', query_text)
    AND (category_filter IS NULL OR pt.category = category_filter)
    AND (business_context_filter IS NULL OR pt.business_context @> business_context_filter)
  ORDER BY relevance_score DESC, pt.created_at DESC
  LIMIT limit_count;
$$;

-- Create function to get personal insights for AI context
CREATE OR REPLACE FUNCTION get_personal_context_for_ai(
  user_uuid UUID DEFAULT auth.uid(),
  business_context_filter JSONB DEFAULT NULL,
  recent_days INTEGER DEFAULT 30,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  thought_content TEXT,
  category TEXT,
  tags TEXT[],
  business_context JSONB,
  days_ago INTEGER,
  has_business_impact BOOLEAN
) 
LANGUAGE sql STABLE
AS $$
  SELECT 
    pt.content as thought_content,
    pt.category,
    pt.tags,
    pt.business_context,
    EXTRACT(days FROM NOW() - pt.created_at)::INTEGER as days_ago,
    EXISTS(
      SELECT 1 FROM insight_business_connections ibc 
      WHERE ibc.personal_thought_id = pt.id
    ) as has_business_impact
  FROM personal_thoughts pt
  WHERE 
    pt.user_id = user_uuid
    AND pt.created_at >= NOW() - (recent_days || ' days')::INTERVAL
    AND (business_context_filter IS NULL OR pt.business_context @> business_context_filter)
  ORDER BY pt.created_at DESC
  LIMIT limit_count;
$$;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_personal_thoughts_updated_at ON personal_thoughts;
CREATE TRIGGER update_personal_thoughts_updated_at
  BEFORE UPDATE ON personal_thoughts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample personal manifest data for existing users (optional)
-- This can be customized based on your user onboarding flow
UPDATE user_profiles 
SET personal_manifest = jsonb_build_object(
  'initialized', true,
  'onboarding_completed', false,
  'preferred_capture_frequency', 'daily',
  'ai_memory_enabled', true
)
WHERE personal_manifest = '{}' OR personal_manifest IS NULL; 