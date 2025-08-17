-- Migration: Create Personal Thoughts Table
-- This table stores user's personal thoughts and ideas

CREATE TABLE IF NOT EXISTS personal_thoughts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userid VARCHAR(255) NOT NULL, -- External user ID (Authentik hash)
    company_id UUID REFERENCES companies(id),
    content TEXT NOT NULL,
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    createdat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_personal_thoughts_userid ON personal_thoughts(userid);
CREATE INDEX IF NOT EXISTS idx_personal_thoughts_company_id ON personal_thoughts(company_id);
CREATE INDEX IF NOT EXISTS idx_personal_thoughts_createdat ON personal_thoughts(createdat);

-- Trigger for updatedat
DROP TRIGGER IF EXISTS update_personal_thoughts_updatedat ON personal_thoughts;
CREATE TRIGGER update_personal_thoughts_updatedat 
    BEFORE UPDATE ON personal_thoughts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
