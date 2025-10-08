-- Migration: Add Missing Columns for Codebase Compatibility
-- Description: Add columns that the frontend/backend code expects but are missing from the database

-- Add missing columns to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS business_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS personal_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('owner', 'admin', 'manager', 'user')),
ADD COLUMN IF NOT EXISTS department VARCHAR(100),
ADD COLUMN IF NOT EXISTS mobile VARCHAR(20),
ADD COLUMN IF NOT EXISTS work_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS display_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS work_location VARCHAR(50) CHECK (work_location IN ('office', 'remote', 'hybrid')),
ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS github_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS twitter_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS certifications TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS languages JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS address JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS emergency_contact JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS profile_completion_percentage INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- Add missing columns to companies table
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS address JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS contact_info JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tax_info JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS billing_info JSONB DEFAULT '{}';

-- Add missing columns to user_integrations table
ALTER TABLE user_integrations 
ADD COLUMN IF NOT EXISTS integration_type VARCHAR(100);

-- Add missing columns to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS org_group_id VARCHAR(255);

-- Add missing columns to user_preferences table
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS push_notifications BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sidebar_collapsed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_department ON user_profiles(department);
CREATE INDEX IF NOT EXISTS idx_user_profiles_company_id ON user_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_timezone ON user_profiles(timezone);
CREATE INDEX IF NOT EXISTS idx_organizations_tenant_id ON organizations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_organizations_org_group_id ON organizations(org_group_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_push_notifications ON user_preferences(push_notifications);
CREATE INDEX IF NOT EXISTS idx_user_preferences_sidebar_collapsed ON user_preferences(sidebar_collapsed);

-- Update existing user_profiles to have default role if null
UPDATE user_profiles SET role = 'user' WHERE role IS NULL;

-- Make role NOT NULL after setting defaults
ALTER TABLE user_profiles ALTER COLUMN role SET NOT NULL;

-- Migration tracking is handled by the migration runner
