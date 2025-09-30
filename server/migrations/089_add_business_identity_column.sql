-- Migration: Add business_identity column to companies table
-- Description: Add business_identity JSONB column to store structured business identity data

-- Add business_identity column to companies table
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS business_identity JSONB DEFAULT '{}';

-- Create index for business_identity queries
CREATE INDEX IF NOT EXISTS idx_companies_business_identity ON companies USING GIN (business_identity);

-- Add comment to document the column
COMMENT ON COLUMN companies.business_identity IS 'Structured business identity data including foundation, mission/vision, values, and strategic context';
