-- Migration: Create Missing Dashboard Tables
-- This creates the missing tables needed by the NarrativeDashboard component
-- Using the same column naming convention as personal_thoughts (userid without underscore)

-- Deals - Sales opportunity and deal tracking for business development
CREATE TABLE IF NOT EXISTS deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Contacts - Business contact management system for customer and partner relationships
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Note: business_health table already exists as business_health_snapshots in init-db.sql

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_deals_userid ON deals(userid);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_probability ON deals(probability);
CREATE INDEX IF NOT EXISTS idx_deals_expected_close_date ON deals(expected_close_date);
CREATE INDEX IF NOT EXISTS idx_deals_customer_name ON deals(customer_name);

CREATE INDEX IF NOT EXISTS idx_contacts_userid ON contacts(userid);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company);
CREATE INDEX IF NOT EXISTS idx_contacts_last_name ON contacts(last_name);

-- Note: business_health_snapshots indexes already exist in init-db.sql
