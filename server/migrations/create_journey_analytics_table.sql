-- Create journey_analytics table for tracking user journey patterns and analytics
CREATE TABLE IF NOT EXISTS journey_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  journey_id TEXT NOT NULL,
  completion_duration INTEGER, -- Duration in minutes
  response_count INTEGER DEFAULT 0,
  maturity_assessment JSONB,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_journey_analytics_user_id ON journey_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_journey_analytics_organization_id ON journey_analytics(organization_id);
CREATE INDEX IF NOT EXISTS idx_journey_analytics_journey_id ON journey_analytics(journey_id);
CREATE INDEX IF NOT EXISTS idx_journey_analytics_completed_at ON journey_analytics(completed_at);

-- Enable RLS
ALTER TABLE journey_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own journey analytics" ON journey_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own journey analytics" ON journey_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journey analytics" ON journey_analytics
  FOR UPDATE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_journey_analytics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER journey_analytics_updated_at
  BEFORE UPDATE ON journey_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_journey_analytics_updated_at();
