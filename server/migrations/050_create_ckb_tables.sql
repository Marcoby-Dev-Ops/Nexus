-- Create CKB (Corporate Knowledge Base) tables
-- Migration: 050_create_ckb_tables.sql

-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create ckb_documents table
CREATE TABLE IF NOT EXISTS ckb_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('pdf', 'docx', 'txt', 'xlsx', 'csv', 'pptx')),
    source VARCHAR(50) NOT NULL CHECK (source IN ('onedrive', 'gdrive', 'upload')),
    source_id VARCHAR(255) NOT NULL,
    source_url TEXT NOT NULL,
    embedding vector(1536), -- OpenAI text-embedding-3-small dimension
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ckb_documents_company_id ON ckb_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_ckb_documents_content_type ON ckb_documents(content_type);
CREATE INDEX IF NOT EXISTS idx_ckb_documents_source ON ckb_documents(source);
CREATE INDEX IF NOT EXISTS idx_ckb_documents_created_at ON ckb_documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ckb_documents_embedding ON ckb_documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create ckb_search_logs table for analytics
CREATE TABLE IF NOT EXISTS ckb_search_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    results_count INTEGER NOT NULL DEFAULT 0,
    search_type VARCHAR(50) NOT NULL CHECK (search_type IN ('semantic', 'qa')),
    response_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for search logs
CREATE INDEX IF NOT EXISTS idx_ckb_search_logs_company_id ON ckb_search_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_ckb_search_logs_user_id ON ckb_search_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ckb_search_logs_created_at ON ckb_search_logs(created_at DESC);

-- Create ckb_storage_connections table for OAuth connections
CREATE TABLE IF NOT EXISTS ckb_storage_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('onedrive', 'gdrive')),
    connection_name VARCHAR(255) NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    folder_ids TEXT[], -- Array of folder IDs to monitor
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for storage connections
CREATE INDEX IF NOT EXISTS idx_ckb_storage_connections_company_id ON ckb_storage_connections(company_id);
CREATE INDEX IF NOT EXISTS idx_ckb_storage_connections_user_id ON ckb_storage_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_ckb_storage_connections_provider ON ckb_storage_connections(provider);
CREATE INDEX IF NOT EXISTS idx_ckb_storage_connections_is_active ON ckb_storage_connections(is_active);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ckb_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_ckb_documents_updated_at
    BEFORE UPDATE ON ckb_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_ckb_updated_at();

CREATE TRIGGER update_ckb_storage_connections_updated_at
    BEFORE UPDATE ON ckb_storage_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_ckb_updated_at();

-- Add RLS (Row Level Security) policies
ALTER TABLE ckb_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ckb_search_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ckb_storage_connections ENABLE ROW LEVEL SECURITY;

-- RLS policies for ckb_documents
CREATE POLICY "Users can view their company's documents" ON ckb_documents
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert documents for their company" ON ckb_documents
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update their company's documents" ON ckb_documents
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their company's documents" ON ckb_documents
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

-- RLS policies for ckb_search_logs
CREATE POLICY "Users can view their company's search logs" ON ckb_search_logs
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert search logs for their company" ON ckb_search_logs
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

-- RLS policies for ckb_storage_connections
CREATE POLICY "Users can view their company's storage connections" ON ckb_storage_connections
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert storage connections for their company" ON ckb_storage_connections
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update their company's storage connections" ON ckb_storage_connections
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their company's storage connections" ON ckb_storage_connections
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON ckb_documents TO authenticated;
GRANT SELECT, INSERT ON ckb_search_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ckb_storage_connections TO authenticated;

-- Create view for document statistics
CREATE OR REPLACE VIEW ckb_document_stats AS
SELECT 
    company_id,
    COUNT(*) as total_documents,
    COUNT(DISTINCT content_type) as file_types,
    COUNT(DISTINCT source) as connected_sources,
    MAX(created_at) as last_document_added,
    AVG(LENGTH(content)) as avg_content_length
FROM ckb_documents
GROUP BY company_id;

-- Grant access to the view
GRANT SELECT ON ckb_document_stats TO authenticated;
