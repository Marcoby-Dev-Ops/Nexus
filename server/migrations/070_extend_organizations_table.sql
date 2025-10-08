-- Migration: Extend organizations table with company fields
-- This consolidates companies and organizations into a single entity

-- Add company-related fields to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS size TEXT,
ADD COLUMN IF NOT EXISTS founded_year INTEGER,
ADD COLUMN IF NOT EXISTS revenue_range TEXT,
ADD COLUMN IF NOT EXISTS domain TEXT,
ADD COLUMN IF NOT EXISTS website TEXT;

-- Add index for industry queries
CREATE INDEX IF NOT EXISTS idx_organizations_industry ON organizations(industry);

-- Add index for size queries
CREATE INDEX IF NOT EXISTS idx_organizations_size ON organizations(size);

-- Update organizations table comment
COMMENT ON TABLE organizations IS 'Consolidated table for both organizations and companies. Contains business entity information and user membership management.';

-- Add comments for new columns
COMMENT ON COLUMN organizations.industry IS 'Industry classification (e.g., Technology, Healthcare, Finance)';
COMMENT ON COLUMN organizations.size IS 'Company size (e.g., 1-10, 11-50, 51-200, 201-500, 500+)';
COMMENT ON COLUMN organizations.founded_year IS 'Year the company was founded';
COMMENT ON COLUMN organizations.revenue_range IS 'Revenue range (e.g., <$1M, $1M-$10M, $10M-$100M, $100M+)';
COMMENT ON COLUMN organizations.domain IS 'Company domain name';
COMMENT ON COLUMN organizations.website IS 'Company website URL';
