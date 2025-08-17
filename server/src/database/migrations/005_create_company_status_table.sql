-- Migration: Create Company Status Table
-- This table tracks company health and performance metrics

CREATE TABLE IF NOT EXISTS company_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    overall_score DECIMAL(5,2) DEFAULT 0,
    financial_health DECIMAL(5,2) DEFAULT 0,
    operational_efficiency DECIMAL(5,2) DEFAULT 0,
    market_position DECIMAL(5,2) DEFAULT 0,
    customer_satisfaction DECIMAL(5,2) DEFAULT 0,
    team_performance DECIMAL(5,2) DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_company_status_company_id ON company_status(company_id);
CREATE INDEX IF NOT EXISTS idx_company_status_last_updated ON company_status(last_updated);
CREATE INDEX IF NOT EXISTS idx_company_status_overall_score ON company_status(overall_score);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_company_status_updated_at ON company_status;
CREATE TRIGGER update_company_status_updated_at 
    BEFORE UPDATE ON company_status 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
