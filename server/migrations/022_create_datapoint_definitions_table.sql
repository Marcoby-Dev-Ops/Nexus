-- Migration: Create Data Point Definitions Table
-- This migration creates the datapoint_definitions table for defining available data points

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create datapoint_definitions table
CREATE TABLE IF NOT EXISTS datapoint_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Definition details
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(50) NOT NULL DEFAULT 'general',
  data_type VARCHAR(50) NOT NULL DEFAULT 'string',
  is_required BOOLEAN NOT NULL DEFAULT false,
  suggested_integrations TEXT[] DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_datapoint_definitions_name ON datapoint_definitions(name);
CREATE INDEX IF NOT EXISTS idx_datapoint_definitions_category ON datapoint_definitions(category);
CREATE INDEX IF NOT EXISTS idx_datapoint_definitions_required ON datapoint_definitions(is_required);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_datapoint_definitions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_datapoint_definitions_updated_at ON datapoint_definitions;
CREATE TRIGGER update_datapoint_definitions_updated_at
  BEFORE UPDATE ON datapoint_definitions
  FOR EACH ROW
  EXECUTE FUNCTION update_datapoint_definitions_updated_at();

-- Enable Row Level Security
ALTER TABLE datapoint_definitions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all authenticated users to read definitions)
CREATE POLICY "All users can view datapoint definitions" ON datapoint_definitions
  FOR SELECT USING (auth.role() = 'authenticated');

-- Insert sample data point definitions
INSERT INTO datapoint_definitions (id, name, description, category, data_type, is_required, suggested_integrations, created_at, updated_at)
VALUES 
  (uuid_generate_v4(), 'revenue', 'Total revenue from all sources', 'finance', 'currency', true, ARRAY['hubspot', 'salesforce', 'quickbooks'], NOW(), NOW()),
  (uuid_generate_v4(), 'customers', 'Total number of customers', 'sales', 'number', true, ARRAY['hubspot', 'salesforce', 'stripe'], NOW(), NOW()),
  (uuid_generate_v4(), 'conversion_rate', 'Lead to customer conversion rate', 'sales', 'percentage', false, ARRAY['hubspot', 'salesforce'], NOW(), NOW()),
  (uuid_generate_v4(), 'mrr', 'Monthly Recurring Revenue', 'finance', 'currency', true, ARRAY['stripe', 'quickbooks', 'hubspot'], NOW(), NOW()),
  (uuid_generate_v4(), 'leads', 'Total number of leads', 'marketing', 'number', false, ARRAY['hubspot', 'salesforce'], NOW(), NOW()),
  (uuid_generate_v4(), 'opportunities', 'Total number of opportunities', 'sales', 'number', false, ARRAY['hubspot', 'salesforce'], NOW(), NOW()),
  (uuid_generate_v4(), 'response_time', 'Average response time to inquiries', 'support', 'duration', false, ARRAY['zendesk', 'intercom'], NOW(), NOW()),
  (uuid_generate_v4(), 'satisfaction', 'Customer satisfaction score', 'support', 'rating', false, ARRAY['zendesk', 'intercom', 'hubspot'], NOW(), NOW())
ON CONFLICT (name) DO NOTHING;
