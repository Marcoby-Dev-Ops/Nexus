-- Update quantum_business_profiles table to use organization_id instead of company_id
-- This migration changes the table structure to work with organizations

-- First, check if the table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'quantum_business_profiles') THEN
        -- Add organization_id column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'quantum_business_profiles' AND column_name = 'organization_id') THEN
            ALTER TABLE quantum_business_profiles ADD COLUMN organization_id UUID;
        END IF;
        
        -- Create index on organization_id
        IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_quantum_business_profiles_organization_id') THEN
            CREATE INDEX idx_quantum_business_profiles_organization_id ON quantum_business_profiles(organization_id);
        END IF;
        
        -- Add RLS policy for organization_id if RLS is enabled
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'quantum_business_profiles' AND row_security = 'YES') THEN
            -- Drop old company_id policy if it exists
            DROP POLICY IF EXISTS "Users can manage quantum profiles for their company" ON quantum_business_profiles;
            
            -- Create new organization_id policy
            CREATE POLICY "Users can manage quantum profiles for their organization" 
            ON quantum_business_profiles FOR ALL 
            USING (
                organization_id IN (
                    SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
                )
            );
        END IF;
        
        RAISE NOTICE 'Quantum business profiles table updated successfully';
    ELSE
        RAISE NOTICE 'Quantum business profiles table does not exist - creating it';
        
        -- Create the table with organization_id
        CREATE TABLE quantum_business_profiles (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            organization_id UUID NOT NULL,
            profile_data JSONB NOT NULL,
            health_score INTEGER DEFAULT 0,
            maturity_level TEXT DEFAULT 'startup',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes
        CREATE INDEX idx_quantum_business_profiles_organization_id ON quantum_business_profiles(organization_id);
        CREATE INDEX idx_quantum_business_profiles_health_score ON quantum_business_profiles(health_score);
        CREATE INDEX idx_quantum_business_profiles_maturity_level ON quantum_business_profiles(maturity_level);
        
        -- Enable RLS
        ALTER TABLE quantum_business_profiles ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policy
        CREATE POLICY "Users can manage quantum profiles for their organization" 
        ON quantum_business_profiles FOR ALL 
        USING (
            organization_id IN (
                SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
            )
        );
        
        RAISE NOTICE 'Quantum business profiles table created successfully';
    END IF;
END $$;

-- Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'quantum_business_profiles' 
ORDER BY ordinal_position;
