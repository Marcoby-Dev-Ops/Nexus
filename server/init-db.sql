-- Nexus Database Base Schema Bootstrap
-- Applies core tables/functions needed before incremental migrations run.

-- Required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Track applied migrations (compatible with migrate.js expectations)
CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    version VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(64),
    execution_time_ms INTEGER
);

-- Shared updated_at trigger helper
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

---------------------------------------------------------------------------------------------------
-- Companies (internal company accounts referenced throughout the platform)
---------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS companies (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name      TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE companies
    ADD COLUMN IF NOT EXISTS legal_name TEXT,
    ADD COLUMN IF NOT EXISTS domain TEXT,
    ADD COLUMN IF NOT EXISTS website TEXT,
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS industry TEXT,
    ADD COLUMN IF NOT EXISTS size TEXT,
    ADD COLUMN IF NOT EXISTS timezone TEXT,
    ADD COLUMN IF NOT EXISTS country_code CHAR(2),
    ADD COLUMN IF NOT EXISTS region TEXT,
    ADD COLUMN IF NOT EXISTS logo_url TEXT,
    ADD COLUMN IF NOT EXISTS address JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS contact_info JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS tax_info JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS billing_info JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS owner_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'free',
    ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 5;

CREATE INDEX IF NOT EXISTS idx_companies_domain ON companies(domain);
CREATE INDEX IF NOT EXISTS idx_companies_owner_id ON companies(owner_id);

DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

---------------------------------------------------------------------------------------------------
-- Organizations (external organizations / CRM entities)
---------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organizations (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name      VARCHAR(255) NOT NULL,
    slug      VARCHAR(255) UNIQUE,
    description TEXT,
    type      VARCHAR(50) DEFAULT 'external' CHECK (type IN ('internal', 'external', 'client', 'partner')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE organizations
    ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS domain TEXT,
    ADD COLUMN IF NOT EXISTS website TEXT,
    ADD COLUMN IF NOT EXISTS industry TEXT,
    ADD COLUMN IF NOT EXISTS size TEXT,
    ADD COLUMN IF NOT EXISTS founded_year INTEGER,
    ADD COLUMN IF NOT EXISTS revenue_range TEXT,
    ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS org_group_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(type);
CREATE INDEX IF NOT EXISTS idx_organizations_domain ON organizations(domain);
CREATE INDEX IF NOT EXISTS idx_organizations_industry ON organizations(industry);
CREATE INDEX IF NOT EXISTS idx_organizations_size ON organizations(size);
CREATE INDEX IF NOT EXISTS idx_organizations_tenant_id ON organizations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_organizations_org_group_id ON organizations(org_group_id);

DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

---------------------------------------------------------------------------------------------------
-- Organization membership
---------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    permissions JSONB DEFAULT '{}'::jsonb,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_user_organizations_user_id ON user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_org_id ON user_organizations(organization_id);

---------------------------------------------------------------------------------------------------
-- Company membership
---------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS company_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'member',
    permissions JSONB DEFAULT '{}'::jsonb,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(company_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_company_members_company_id ON company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_company_members_user_id ON company_members(user_id);

---------------------------------------------------------------------------------------------------
-- User Profiles
---------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255),
    display_name VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('owner', 'admin', 'manager', 'user')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
    company_id UUID,
    organization_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_profiles
    ADD COLUMN IF NOT EXISTS business_email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS personal_email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
    ADD COLUMN IF NOT EXISTS mobile VARCHAR(20),
    ADD COLUMN IF NOT EXISTS work_phone VARCHAR(20),
    ADD COLUMN IF NOT EXISTS avatar_url TEXT,
    ADD COLUMN IF NOT EXISTS bio TEXT,
    ADD COLUMN IF NOT EXISTS company_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS organization_id UUID,
    ADD COLUMN IF NOT EXISTS department VARCHAR(100),
    ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC',
    ADD COLUMN IF NOT EXISTS work_location VARCHAR(50),
    ADD COLUMN IF NOT EXISTS website VARCHAR(255),
    ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(255),
    ADD COLUMN IF NOT EXISTS github_url VARCHAR(255),
    ADD COLUMN IF NOT EXISTS twitter_url VARCHAR(255),
    ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}'::text[],
    ADD COLUMN IF NOT EXISTS certifications TEXT[] DEFAULT '{}'::text[],
    ADD COLUMN IF NOT EXISTS languages JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS address JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS emergency_contact JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS profile_completion_percentage INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50) DEFAULT 'free',
    ADD COLUMN IF NOT EXISTS signup_completed BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS business_profile_completed BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_company_id ON user_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

---------------------------------------------------------------------------------------------------
-- User Preferences
---------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL UNIQUE,
    theme VARCHAR(50) DEFAULT 'system',
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    notifications_enabled BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT false,
    sidebar_collapsed BOOLEAN DEFAULT false,
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

---------------------------------------------------------------------------------------------------
-- External user mappings (Authentik etc.)
---------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_user_id VARCHAR(255) NOT NULL UNIQUE,
    internal_user_id VARCHAR(255) NOT NULL,
    provider VARCHAR(50) DEFAULT 'authentik',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_mappings_external_id ON user_mappings(external_user_id);

DROP TRIGGER IF EXISTS update_user_mappings_updated_at ON user_mappings;
CREATE TRIGGER update_user_mappings_updated_at
    BEFORE UPDATE ON user_mappings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

---------------------------------------------------------------------------------------------------
-- Integrations metadata
---------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(100),
    category VARCHAR(100),
    description TEXT,
    icon_url TEXT,
    config_schema JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integrations_slug ON integrations(slug);

ALTER TABLE integrations
    ADD COLUMN IF NOT EXISTS type VARCHAR(100);

DROP TRIGGER IF EXISTS update_integrations_updated_at ON integrations;
CREATE TRIGGER update_integrations_updated_at
    BEFORE UPDATE ON integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

---------------------------------------------------------------------------------------------------
-- User integrations (per-user credentials)
---------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    integration_name VARCHAR(100) NOT NULL,
    integration_id UUID REFERENCES integrations(id),
    integration_slug VARCHAR(100),
    credentials JSONB,
    config JSONB DEFAULT '{}'::jsonb,
    settings JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(50) DEFAULT 'active',
    integration_type VARCHAR(100),
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, integration_name)
);

CREATE INDEX IF NOT EXISTS idx_user_integrations_user_id ON user_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_integrations_integration_slug ON user_integrations(integration_slug);

DROP TRIGGER IF EXISTS update_user_integrations_updated_at ON user_integrations;
CREATE TRIGGER update_user_integrations_updated_at
    BEFORE UPDATE ON user_integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

---------------------------------------------------------------------------------------------------
-- OAuth tokens (per-provider access & refresh tokens)
---------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS oauth_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    integration_slug VARCHAR(100) NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_type VARCHAR(50) DEFAULT 'Bearer',
    expires_at TIMESTAMP WITH TIME ZONE,
    scope TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user_id ON oauth_tokens(user_id);

DROP TRIGGER IF EXISTS update_oauth_tokens_updated_at ON oauth_tokens;
CREATE TRIGGER update_oauth_tokens_updated_at
    BEFORE UPDATE ON oauth_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

---------------------------------------------------------------------------------------------------
-- Business health snapshots (used by analytics dashboards)
---------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS business_health_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    org_id UUID REFERENCES companies(id),
    overall_score INTEGER NOT NULL DEFAULT 0,
    data_quality_score INTEGER NOT NULL DEFAULT 0,
    connected_sources INTEGER NOT NULL DEFAULT 0,
    verified_sources INTEGER NOT NULL DEFAULT 0,
    completion_percentage INTEGER NOT NULL DEFAULT 0,
    category_scores JSONB DEFAULT '{}'::jsonb,
    data_sources TEXT[] DEFAULT '{}'::text[],
    last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_health_snapshots_user_id ON business_health_snapshots(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_business_health_snapshots_user_id ON business_health_snapshots(user_id);

DROP TRIGGER IF EXISTS update_business_health_snapshots_updated_at ON business_health_snapshots;
CREATE TRIGGER update_business_health_snapshots_updated_at
    BEFORE UPDATE ON business_health_snapshots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

---------------------------------------------------------------------------------------------------
-- Onboarding progress tracking
---------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS onboarding_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL UNIQUE,
    current_phase VARCHAR(100),
    completed_phases TEXT[] DEFAULT '{}'::text[],
    total_steps INTEGER DEFAULT 0,
    completed_steps INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_progress_user_id ON onboarding_progress(user_id);

DROP TRIGGER IF EXISTS update_onboarding_progress_updated_at ON onboarding_progress;
CREATE TRIGGER update_onboarding_progress_updated_at
    BEFORE UPDATE ON onboarding_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

---------------------------------------------------------------------------------------------------
-- Seed a default organization (idempotent)
---------------------------------------------------------------------------------------------------
INSERT INTO organizations (name, slug, description)
VALUES ('Default Organization', 'default', 'Default organization for new users')
ON CONFLICT (slug) DO NOTHING;
