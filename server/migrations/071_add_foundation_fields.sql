-- Migration: Create Business Identity Table
-- Description: Dedicated table for business identity that can be linked to companies
-- This separates business identity/branding data from operational company data

-- Create identity table
CREATE TABLE IF NOT EXISTS identities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foundation (Core Information) - Direct columns for fast querying
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    legal_structure VARCHAR(50) DEFAULT 'LLC' CHECK (legal_structure IN ('LLC', 'C-Corp', 'S-Corp', 'Partnership', 'Sole Proprietorship', 'Non-Profit', 'Other')),
    founded_date DATE,
    industry VARCHAR(100),
    sector VARCHAR(100),
    business_model VARCHAR(50) DEFAULT 'B2B' CHECK (business_model IN ('B2B', 'B2C', 'B2B2C', 'Marketplace', 'SaaS', 'E-commerce', 'Consulting', 'Other')),
    company_stage VARCHAR(50) DEFAULT 'Startup' CHECK (company_stage IN ('Idea', 'Startup', 'Growth', 'Mature', 'Enterprise')),
    company_size VARCHAR(50),
    website VARCHAR(255),
    description TEXT,
    
    -- Contact & Address (structured data)
    address JSONB DEFAULT '{}',
    contact_info JSONB DEFAULT '{}',
    
    -- Mission & Vision (Core identity statements)
    mission_statement TEXT,
    vision_statement TEXT,
    core_values TEXT[],
    
    -- Complex sections stored in JSONB for flexibility
    mission_vision_values JSONB DEFAULT '{}',
    products_services JSONB DEFAULT '{}',
    target_market JSONB DEFAULT '{}',
    competitive_landscape JSONB DEFAULT '{}',
    business_operations JSONB DEFAULT '{}',
    financial_context JSONB DEFAULT '{}',
    strategic_context JSONB DEFAULT '{}',
    
    -- Metadata
    completeness JSONB DEFAULT '{"overall": 0, "sections": {}}',
    version VARCHAR(20) DEFAULT '1.0.0',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Add identity_id to companies table
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS identity_id UUID REFERENCES identities(id) ON DELETE SET NULL;

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_identities_industry ON identities(industry);
CREATE INDEX IF NOT EXISTS idx_identities_company_stage ON identities(company_stage);
CREATE INDEX IF NOT EXISTS idx_identities_business_model ON identities(business_model);
CREATE INDEX IF NOT EXISTS idx_identities_deleted_at ON identities(deleted_at) WHERE deleted_at IS NULL;

-- GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_identities_products_services ON identities USING GIN (products_services);
CREATE INDEX IF NOT EXISTS idx_identities_target_market ON identities USING GIN (target_market);
CREATE INDEX IF NOT EXISTS idx_identities_business_operations ON identities USING GIN (business_operations);

-- Index for company-identity relationship
CREATE INDEX IF NOT EXISTS idx_companies_identity_id ON companies(identity_id);

-- Add comments
COMMENT ON TABLE identities IS 'Business identity profiles linked to companies - contains branding, mission, values, and strategic context';
COMMENT ON COLUMN identities.name IS 'Display name of the entity';
COMMENT ON COLUMN identities.legal_name IS 'Official legal name';
COMMENT ON COLUMN identities.legal_structure IS 'Legal business structure: LLC, C-Corp, S-Corp, Partnership, Sole Proprietorship, Non-Profit, Other';
COMMENT ON COLUMN identities.founded_date IS 'Date founded/established';
COMMENT ON COLUMN identities.industry IS 'Primary industry';
COMMENT ON COLUMN identities.sector IS 'Specific sector within industry';
COMMENT ON COLUMN identities.business_model IS 'Primary business model: B2B, B2C, B2B2C, Marketplace, SaaS, E-commerce, Consulting, Other';
COMMENT ON COLUMN identities.company_stage IS 'Current development stage: Idea, Startup, Growth, Mature, Enterprise';
COMMENT ON COLUMN identities.company_size IS 'Size/scale of organization';
COMMENT ON COLUMN identities.mission_statement IS 'Mission statement';
COMMENT ON COLUMN identities.vision_statement IS 'Vision statement';
COMMENT ON COLUMN identities.core_values IS 'Core values array';
COMMENT ON COLUMN identities.mission_vision_values IS 'Extended mission/vision data (culture, brand voice, etc.)';
COMMENT ON COLUMN identities.products_services IS 'Products, services, and value proposition';
COMMENT ON COLUMN identities.target_market IS 'Target market, customer segments, and personas';
COMMENT ON COLUMN identities.competitive_landscape IS 'Competitors, positioning, and market analysis';
COMMENT ON COLUMN identities.business_operations IS 'Team, processes, and technology stack';
COMMENT ON COLUMN identities.financial_context IS 'Revenue, funding, and financial goals';
COMMENT ON COLUMN identities.strategic_context IS 'Goals, priorities, and challenges';
COMMENT ON COLUMN identities.completeness IS 'Completion tracking for each section';

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_identities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_identities_updated_at
    BEFORE UPDATE ON identities
    FOR EACH ROW
    EXECUTE FUNCTION update_identities_updated_at();

