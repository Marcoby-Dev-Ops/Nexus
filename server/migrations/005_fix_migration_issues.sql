-- Migration: Fix Migration Issues
-- This migration addresses the remaining database issues:
-- 1. Missing ensure_user_profile function
-- 2. Table schema inconsistencies
-- 3. Missing tables referenced in the application

-- First, let's ensure the user_profiles table has the correct schema
-- Drop the existing table if it exists with wrong schema
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Recreate user_profiles table with correct schema
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    avatar_url TEXT,
    bio TEXT,
    company_name VARCHAR(255),
    job_title VARCHAR(255),
    location VARCHAR(255),
    website VARCHAR(255),
    social_links JSONB,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Create unique constraint on user_id to ensure one profile per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_user_id_unique ON user_profiles(user_id);

-- Create the missing ensure_user_profile function
CREATE OR REPLACE FUNCTION ensure_user_profile(user_id_param UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    avatar_url TEXT,
    bio TEXT,
    company_name VARCHAR(255),
    job_title VARCHAR(255),
    location VARCHAR(255),
    website VARCHAR(255),
    social_links JSONB,
    preferences JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Try to get existing profile
    RETURN QUERY
    SELECT 
        up.id,
        up.user_id,
        up.first_name,
        up.last_name,
        up.email,
        up.phone,
        up.avatar_url,
        up.bio,
        up.company_name,
        up.job_title,
        up.location,
        up.website,
        up.social_links,
        up.preferences,
        up.created_at,
        up.updated_at
    FROM user_profiles up
    WHERE up.user_id = user_id_param;
    
    -- If no profile found, create one and return it
    IF NOT FOUND THEN
        INSERT INTO user_profiles (
            user_id,
            first_name,
            last_name,
            email,
            phone,
            avatar_url,
            bio,
            company_name,
            job_title,
            location,
            website,
            social_links,
            preferences,
            created_at,
            updated_at
        ) VALUES (
            user_id_param,
            NULL,
            NULL,
            NULL,
            NULL,
            NULL,
            NULL,
            NULL,
            NULL,
            NULL,
            NULL,
            '{}'::JSONB,
            '{}'::JSONB,
            NOW(),
            NOW()
        );
        
        -- Return the newly created profile
        RETURN QUERY
        SELECT 
            up.id,
            up.user_id,
            up.first_name,
            up.last_name,
            up.email,
            up.phone,
            up.avatar_url,
            up.bio,
            up.company_name,
            up.job_title,
            up.location,
            up.website,
            up.social_links,
            up.preferences,
            up.created_at,
            up.updated_at
        FROM user_profiles up
        WHERE up.user_id = user_id_param;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_user_profiles_updated_at();

-- Ensure user_preferences table exists (referenced in the functions)
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL,
    theme VARCHAR(50) DEFAULT 'system',
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(100) DEFAULT 'UTC',
    notifications_enabled BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT false,
    sidebar_collapsed BOOLEAN DEFAULT false,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for user_preferences
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Create trigger for user_preferences updated_at
CREATE TRIGGER trigger_update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_user_profiles_updated_at();

-- Ensure companies table exists (referenced in user_profiles)
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    industry VARCHAR(100),
    size VARCHAR(50),
    website VARCHAR(255),
    logo_url TEXT,
    owner_id UUID,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    settings JSONB DEFAULT '{}',
    subscription_plan VARCHAR(50) DEFAULT 'free',
    max_users INTEGER DEFAULT 5
);

-- Create index for companies
CREATE INDEX IF NOT EXISTS idx_companies_owner_id ON companies(owner_id);

-- Create trigger for companies updated_at
CREATE TRIGGER trigger_update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_user_profiles_updated_at();

-- Ensure personal_thoughts table exists (referenced in the application)
-- Drop the table first to ensure correct schema
DROP TABLE IF EXISTS personal_thoughts CASCADE;
CREATE TABLE personal_thoughts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    userid VARCHAR(255) NOT NULL, -- External user ID (Authentik hash)
    title VARCHAR(255),
    content TEXT NOT NULL,
    category VARCHAR(100),
    tags TEXT[],
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for personal_thoughts
CREATE INDEX IF NOT EXISTS idx_personal_thoughts_userid ON personal_thoughts(userid);
CREATE INDEX IF NOT EXISTS idx_personal_thoughts_category ON personal_thoughts(category);
CREATE INDEX IF NOT EXISTS idx_personal_thoughts_created_at ON personal_thoughts(created_at);

-- Create trigger for personal_thoughts updated_at
CREATE TRIGGER trigger_update_personal_thoughts_updated_at
    BEFORE UPDATE ON personal_thoughts
    FOR EACH ROW
    EXECUTE FUNCTION update_user_profiles_updated_at();

-- Ensure deals table exists (referenced in the application)
-- Drop the table first to ensure correct schema
DROP TABLE IF EXISTS deals CASCADE;
CREATE TABLE deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    userid VARCHAR(255) NOT NULL, -- External user ID (Authentik hash)
    title VARCHAR(255) NOT NULL,
    description TEXT,
    value DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'USD',
    stage VARCHAR(50) DEFAULT 'prospecting',
    probability INTEGER CHECK (probability >= 0 AND probability <= 100),
    expected_close_date DATE,
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    tags TEXT[],
    notes TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for deals
CREATE INDEX IF NOT EXISTS idx_deals_userid ON deals(userid);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_probability ON deals(probability);
CREATE INDEX IF NOT EXISTS idx_deals_expected_close_date ON deals(expected_close_date);
CREATE INDEX IF NOT EXISTS idx_deals_customer_name ON deals(customer_name);

-- Create trigger for deals updated_at
CREATE TRIGGER trigger_update_deals_updated_at
    BEFORE UPDATE ON deals
    FOR EACH ROW
    EXECUTE FUNCTION update_user_profiles_updated_at();

-- Ensure contacts table exists (referenced in the application)
-- Drop the table first to ensure correct schema
DROP TABLE IF EXISTS contacts CASCADE;
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    userid VARCHAR(255) NOT NULL, -- External user ID (Authentik hash)
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    company VARCHAR(255),
    job_title VARCHAR(255),
    department VARCHAR(100),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    notes TEXT,
    tags TEXT[],
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for contacts
CREATE INDEX IF NOT EXISTS idx_contacts_userid ON contacts(userid);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company);
CREATE INDEX IF NOT EXISTS idx_contacts_last_name ON contacts(last_name);

-- Create trigger for contacts updated_at
CREATE TRIGGER trigger_update_contacts_updated_at
    BEFORE UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_user_profiles_updated_at();

-- Ensure business_health table exists (referenced in the application)
-- Drop the table first to ensure correct schema
DROP TABLE IF EXISTS business_health CASCADE;
CREATE TABLE business_health (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    userid VARCHAR(255) NOT NULL, -- External user ID (Authentik hash)
    company_id UUID REFERENCES companies(id),
    metric_name VARCHAR(255) NOT NULL,
    metric_value DECIMAL(15,2),
    metric_unit VARCHAR(50),
    category VARCHAR(100),
    period VARCHAR(20), -- 'daily', 'weekly', 'monthly', 'yearly'
    date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for business_health
CREATE INDEX IF NOT EXISTS idx_business_health_userid ON business_health(userid);
CREATE INDEX IF NOT EXISTS idx_business_health_metric_name ON business_health(metric_name);
CREATE INDEX IF NOT EXISTS idx_business_health_category ON business_health(category);
CREATE INDEX IF NOT EXISTS idx_business_health_date ON business_health(date);

-- Create trigger for business_health updated_at
CREATE TRIGGER trigger_update_business_health_updated_at
    BEFORE UPDATE ON business_health
    FOR EACH ROW
    EXECUTE FUNCTION update_user_profiles_updated_at();

-- Add RLS policies for security (if RLS is enabled)
-- Note: These will only work if RLS is enabled on the tables
DO $$
BEGIN
    -- Enable RLS on tables if not already enabled
    ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
    ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
    ALTER TABLE personal_thoughts ENABLE ROW LEVEL SECURITY;
    ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
    ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
    ALTER TABLE business_health ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN OTHERS THEN
        -- RLS might already be enabled or not supported, continue
        NULL;
END $$;

-- Create RLS policies (basic ones - can be enhanced later)
DO $$
BEGIN
    -- User profiles policy
    EXECUTE 'CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (user_id::text = current_user)';
    EXECUTE 'CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (user_id::text = current_user)';
    EXECUTE 'CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (user_id::text = current_user)';
EXCEPTION
    WHEN OTHERS THEN
        -- Policies might already exist, continue
        NULL;
END $$;
