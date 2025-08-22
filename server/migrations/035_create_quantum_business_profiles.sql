-- Migration: Create Quantum Business Profiles
-- This migration creates the quantum_business_profiles table for advanced business intelligence

CREATE TABLE IF NOT EXISTS quantum_business_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    profile_data JSONB NOT NULL DEFAULT '{}',
    quantum_score DECIMAL(5,2),
    last_analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_quantum_business_profiles_company_id ON quantum_business_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_quantum_business_profiles_quantum_score ON quantum_business_profiles(quantum_score);
CREATE INDEX IF NOT EXISTS idx_quantum_business_profiles_last_analyzed ON quantum_business_profiles(last_analyzed_at);

-- Enable RLS
ALTER TABLE quantum_business_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own company's quantum profiles" ON quantum_business_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM companies c 
            WHERE c.id = quantum_business_profiles.company_id 
            AND c.owner_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can insert own company's quantum profiles" ON quantum_business_profiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM companies c 
            WHERE c.id = quantum_business_profiles.company_id 
            AND c.owner_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can update own company's quantum profiles" ON quantum_business_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM companies c 
            WHERE c.id = quantum_business_profiles.company_id 
            AND c.owner_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can delete own company's quantum profiles" ON quantum_business_profiles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM companies c 
            WHERE c.id = quantum_business_profiles.company_id 
            AND c.owner_id::text = auth.uid()::text
        )
    );

-- Create trigger for updated_at
CREATE TRIGGER update_quantum_business_profiles_updated_at
    BEFORE UPDATE ON quantum_business_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE quantum_business_profiles IS 'Stores quantum business model profiles with health scores and maturity levels';
COMMENT ON COLUMN quantum_business_profiles.id IS 'Unique identifier for the quantum business profile';
COMMENT ON COLUMN quantum_business_profiles.company_id IS 'Reference to the company this profile belongs to';
COMMENT ON COLUMN quantum_business_profiles.profile_data IS 'JSONB containing the complete quantum business profile data';
COMMENT ON COLUMN quantum_business_profiles.health_score IS 'Overall business health score (0-100)';
COMMENT ON COLUMN quantum_business_profiles.maturity_level IS 'Business maturity level (startup, growing, scaling, mature)';
COMMENT ON COLUMN quantum_business_profiles.created_at IS 'Timestamp when the profile was created';
COMMENT ON COLUMN quantum_business_profiles.updated_at IS 'Timestamp when the profile was last updated';
