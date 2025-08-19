-- Migration: Create company knowledge tables with pgvector support
-- This migration sets up tables for storing company knowledge data and vector embeddings

-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create table for storing company knowledge data
CREATE TABLE IF NOT EXISTS company_knowledge_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id)
);

-- Create table for storing company knowledge vectors
CREATE TABLE IF NOT EXISTS company_knowledge_vectors (
    id VARCHAR(255) PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    embedding vector(1536), -- OpenAI embedding dimension
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_company_knowledge_data_company_id 
ON company_knowledge_data(company_id);

CREATE INDEX IF NOT EXISTS idx_company_knowledge_vectors_company_id 
ON company_knowledge_vectors(company_id);

CREATE INDEX IF NOT EXISTS idx_company_knowledge_vectors_content_type 
ON company_knowledge_vectors(content_type);

-- Create vector index for similarity search
CREATE INDEX IF NOT EXISTS idx_company_knowledge_vectors_embedding 
ON company_knowledge_vectors 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_company_knowledge_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_company_knowledge_data_updated_at ON company_knowledge_data;
CREATE TRIGGER update_company_knowledge_data_updated_at
    BEFORE UPDATE ON company_knowledge_data
    FOR EACH ROW
    EXECUTE FUNCTION update_company_knowledge_updated_at();

DROP TRIGGER IF EXISTS update_company_knowledge_vectors_updated_at ON company_knowledge_vectors;
CREATE TRIGGER update_company_knowledge_vectors_updated_at
    BEFORE UPDATE ON company_knowledge_vectors
    FOR EACH ROW
    EXECUTE FUNCTION update_company_knowledge_updated_at();

-- Create function to calculate knowledge completeness score
CREATE OR REPLACE FUNCTION calculate_knowledge_strength(company_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    knowledge_data JSONB;
    required_fields TEXT[] := ARRAY['companyName', 'mission', 'uniqueValueProposition', 'targetAudience'];
    important_fields TEXT[] := ARRAY['vision', 'industry', 'revenueModel', 'shortTermGoals', 'longTermGoals'];
    field TEXT;
    value TEXT;
    score NUMERIC := 0;
    total_weight NUMERIC := 0;
    field_weight NUMERIC;
BEGIN
    -- Get company knowledge data
    SELECT data INTO knowledge_data
    FROM company_knowledge_data
    WHERE company_id = company_uuid;
    
    IF knowledge_data IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Check required fields (weight: 2.0)
    FOREACH field IN ARRAY required_fields
    LOOP
        value := knowledge_data->>field;
        IF value IS NOT NULL AND length(trim(value)) > 10 THEN
            score := score + 2.0;
        END IF;
        total_weight := total_weight + 2.0;
    END LOOP;
    
    -- Check important fields (weight: 1.0)
    FOREACH field IN ARRAY important_fields
    LOOP
        value := knowledge_data->>field;
        IF value IS NOT NULL AND length(trim(value)) > 10 THEN
            score := score + 1.0;
        END IF;
        total_weight := total_weight + 1.0;
    END LOOP;
    
    -- Return percentage score
    IF total_weight > 0 THEN
        RETURN ROUND((score / total_weight) * 100);
    ELSE
        RETURN 0;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create view for company knowledge summary
CREATE OR REPLACE VIEW company_knowledge_summary AS
SELECT 
    c.id as company_id,
    c.name as company_name,
    ckd.data,
    ckd.created_at as knowledge_created_at,
    ckd.updated_at as knowledge_updated_at,
    calculate_knowledge_strength(c.id) as knowledge_strength,
    COUNT(ckv.id) as vector_count
FROM companies c
LEFT JOIN company_knowledge_data ckd ON c.id = ckd.company_id
LEFT JOIN company_knowledge_vectors ckv ON c.id = ckv.company_id
GROUP BY c.id, c.name, ckd.data, ckd.created_at, ckd.updated_at;

-- Note: RLS policies and permissions will be added later when the auth system is properly configured
-- For now, we'll create the tables without RLS to avoid dependency issues
