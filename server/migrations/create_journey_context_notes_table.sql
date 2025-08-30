-- Create journey_context_notes table for storing knowledge enhancements
CREATE TABLE IF NOT EXISTS journey_context_notes (
  id TEXT PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  journey_id TEXT NOT NULL,
  step_id TEXT NOT NULL,
  note_type TEXT NOT NULL CHECK (note_type IN ('insight', 'pattern', 'recommendation', 'learning')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_journey_context_notes_company_id ON journey_context_notes(company_id);
CREATE INDEX IF NOT EXISTS idx_journey_context_notes_journey_id ON journey_context_notes(journey_id);
CREATE INDEX IF NOT EXISTS idx_journey_context_notes_note_type ON journey_context_notes(note_type);
CREATE INDEX IF NOT EXISTS idx_journey_context_notes_created_at ON journey_context_notes(created_at);

-- Enable RLS
ALTER TABLE journey_context_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their organization's context notes" ON journey_context_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.company_id = journey_context_notes.company_id 
      AND user_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert context notes for their organization" ON journey_context_notes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.company_id = journey_context_notes.company_id 
      AND user_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update context notes for their organization" ON journey_context_notes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.company_id = journey_context_notes.company_id 
      AND user_profiles.user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_journey_context_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER journey_context_notes_updated_at
  BEFORE UPDATE ON journey_context_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_journey_context_notes_updated_at();
