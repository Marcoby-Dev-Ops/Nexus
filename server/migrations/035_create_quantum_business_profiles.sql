-- Migration: Create quantum business profiles table
-- Description: Stores quantum business model profiles with health scores and maturity levels

CREATE TABLE IF NOT EXISTS quantum_business_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    profile_data JSONB NOT NULL,
    health_score INTEGER NOT NULL CHECK (health_score >= 0 AND health_score <= 100),
    maturity_level TEXT NOT NULL CHECK (maturity_level IN ('startup', 'growing', 'scaling', 'mature')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_quantum_business_profiles_company_id ON quantum_business_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_quantum_business_profiles_health_score ON quantum_business_profiles(health_score);
CREATE INDEX IF NOT EXISTS idx_quantum_business_profiles_maturity_level ON quantum_business_profiles(maturity_level);
CREATE INDEX IF NOT EXISTS idx_quantum_business_profiles_updated_at ON quantum_business_profiles(updated_at);

-- Create unique constraint to ensure one profile per company
CREATE UNIQUE INDEX IF NOT EXISTS idx_quantum_business_profiles_company_unique ON quantum_business_profiles(company_id);

-- Note: RLS policies will be added later when the company_id() function is available
-- For now, we'll create the table without RLS to avoid dependency issues

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_quantum_business_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_quantum_business_profiles_updated_at
    BEFORE UPDATE ON quantum_business_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_quantum_business_profiles_updated_at();

-- Add comments
COMMENT ON TABLE quantum_business_profiles IS 'Stores quantum business model profiles with health scores and maturity levels';
COMMENT ON COLUMN quantum_business_profiles.id IS 'Unique identifier for the quantum business profile';
COMMENT ON COLUMN quantum_business_profiles.company_id IS 'Reference to the company this profile belongs to';
COMMENT ON COLUMN quantum_business_profiles.profile_data IS 'JSONB containing the complete quantum business profile data';
COMMENT ON COLUMN quantum_business_profiles.health_score IS 'Overall business health score (0-100)';
COMMENT ON COLUMN quantum_business_profiles.maturity_level IS 'Business maturity level (startup, growing, scaling, mature)';
COMMENT ON COLUMN quantum_business_profiles.created_at IS 'Timestamp when the profile was created';
COMMENT ON COLUMN quantum_business_profiles.updated_at IS 'Timestamp when the profile was last updated';
