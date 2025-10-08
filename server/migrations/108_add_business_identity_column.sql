-- Renamed from 089_add_business_identity_column.sql
-- Migration: Add business_identity column to companies table
-- Description: Add business_identity JSONB column to store structured business identity data

ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS business_identity JSONB DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_companies_business_identity ON companies USING GIN (business_identity);

COMMENT ON COLUMN companies.business_identity IS 'Structured business identity data including foundation, mission/vision, values, and strategic context';
