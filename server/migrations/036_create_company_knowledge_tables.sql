-- Migration: Create Company Knowledge Tables
-- This migration creates tables for storing company knowledge and insights

-- Company knowledge base table
CREATE TABLE IF NOT EXISTS company_knowledge (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100),
    tags TEXT[],
    source_url TEXT,
    created_by UUID NOT NULL,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Company insights table
CREATE TABLE IF NOT EXISTS company_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    insight_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    data JSONB NOT NULL DEFAULT '{}',
    confidence_score DECIMAL(3,2),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Company documents table
CREATE TABLE IF NOT EXISTS company_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR(50),
    file_size BIGINT,
    uploaded_by UUID NOT NULL,
    is_processed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_company_knowledge_company_id ON company_knowledge(company_id);
CREATE INDEX IF NOT EXISTS idx_company_knowledge_category ON company_knowledge(category);
CREATE INDEX IF NOT EXISTS idx_company_knowledge_tags ON company_knowledge USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_company_knowledge_created_by ON company_knowledge(created_by);

CREATE INDEX IF NOT EXISTS idx_company_insights_company_id ON company_insights(company_id);
CREATE INDEX IF NOT EXISTS idx_company_insights_type ON company_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_company_insights_generated_at ON company_insights(generated_at);

CREATE INDEX IF NOT EXISTS idx_company_documents_company_id ON company_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_company_documents_file_type ON company_documents(file_type);
CREATE INDEX IF NOT EXISTS idx_company_documents_uploaded_by ON company_documents(uploaded_by);

-- Enable RLS on all tables
ALTER TABLE company_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for company_knowledge
CREATE POLICY "Users can view own company's knowledge" ON company_knowledge
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM companies c 
            WHERE c.id = company_knowledge.company_id 
            AND c.owner_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can insert own company's knowledge" ON company_knowledge
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM companies c 
            WHERE c.id = company_knowledge.company_id 
            AND c.owner_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can update own company's knowledge" ON company_knowledge
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM companies c 
            WHERE c.id = company_knowledge.company_id 
            AND c.owner_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can delete own company's knowledge" ON company_knowledge
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM companies c 
            WHERE c.id = company_knowledge.company_id 
            AND c.owner_id::text = auth.uid()::text
        )
    );

-- Create RLS policies for company_insights
CREATE POLICY "Users can view own company's insights" ON company_insights
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM companies c 
            WHERE c.id = company_insights.company_id 
            AND c.owner_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can insert own company's insights" ON company_insights
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM companies c 
            WHERE c.id = company_insights.company_id 
            AND c.owner_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can update own company's insights" ON company_insights
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM companies c 
            WHERE c.id = company_insights.company_id 
            AND c.owner_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can delete own company's insights" ON company_insights
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM companies c 
            WHERE c.id = company_insights.company_id 
            AND c.owner_id::text = auth.uid()::text
        )
    );

-- Create RLS policies for company_documents
CREATE POLICY "Users can view own company's documents" ON company_documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM companies c 
            WHERE c.id = company_documents.company_id 
            AND c.owner_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can insert own company's documents" ON company_documents
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM companies c 
            WHERE c.id = company_documents.company_id 
            AND c.owner_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can update own company's documents" ON company_documents
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM companies c 
            WHERE c.id = company_documents.company_id 
            AND c.owner_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can delete own company's documents" ON company_documents
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM companies c 
            WHERE c.id = company_documents.company_id 
            AND c.owner_id::text = auth.uid()::text
        )
    );

-- Create triggers for updated_at
CREATE TRIGGER update_company_knowledge_updated_at
    BEFORE UPDATE ON company_knowledge
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_insights_updated_at
    BEFORE UPDATE ON company_insights
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_documents_updated_at
    BEFORE UPDATE ON company_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
