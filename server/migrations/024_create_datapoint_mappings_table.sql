-- Migration: Create Data Point Mappings Table
-- This migration creates the datapoint_mappings table for mapping data points to integrations

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create datapoint_mappings table
CREATE TABLE IF NOT EXISTS datapoint_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- References (without foreign key constraints for flexibility)
  user_id UUID NOT NULL,
  datapoint_definition_id UUID NOT NULL,
  user_integration_id UUID NOT NULL,
  
  -- Mapping configuration
  mapping_type VARCHAR(50) NOT NULL DEFAULT 'direct',
  mapping_config JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, datapoint_definition_id, user_integration_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_datapoint_mappings_user_id ON datapoint_mappings(user_id);
CREATE INDEX IF NOT EXISTS idx_datapoint_mappings_definition_id ON datapoint_mappings(datapoint_definition_id);
CREATE INDEX IF NOT EXISTS idx_datapoint_mappings_integration_id ON datapoint_mappings(user_integration_id);
CREATE INDEX IF NOT EXISTS idx_datapoint_mappings_active ON datapoint_mappings(is_active);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_datapoint_mappings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_datapoint_mappings_updated_at ON datapoint_mappings;
CREATE TRIGGER update_datapoint_mappings_updated_at
  BEFORE UPDATE ON datapoint_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_datapoint_mappings_updated_at();

-- Enable Row Level Security
ALTER TABLE datapoint_mappings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own datapoint mappings" ON datapoint_mappings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own datapoint mappings" ON datapoint_mappings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own datapoint mappings" ON datapoint_mappings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own datapoint mappings" ON datapoint_mappings
  FOR DELETE USING (auth.uid() = user_id);
