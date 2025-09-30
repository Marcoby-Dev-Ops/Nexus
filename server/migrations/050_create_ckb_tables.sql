-- Migration: Create CKB (Company Knowledge Base) Tables - Fixed for Authentik
-- Description: Tables for company knowledge base functionality

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ckb_documents table - Company Knowledge Base document storage with vector embeddings
CREATE TABLE IF NOT EXISTS ckb_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    file_path VARCHAR(500),
    file_type VARCHAR(50),
    file_size INTEGER,
    source VARCHAR(100) NOT NULL CHECK (source IN ('upload', 'onedrive', 'gdrive', 'manual')),
    metadata JSONB DEFAULT '{}',
    embedding_vector vector(1536), -- For semantic search
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ckb_search_logs table - Knowledge base search analytics and usage tracking
CREATE TABLE IF NOT EXISTS ckb_search_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL, -- Authentik user ID (hash)
    query TEXT NOT NULL,
    results_count INTEGER NOT NULL DEFAULT 0,
    search_type VARCHAR(50) NOT NULL CHECK (search_type IN ('semantic', 'qa')),
    response_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ckb_storage_connections table - External storage integration for knowledge base
CREATE TABLE IF NOT EXISTS ckb_storage_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL, -- Authentik user ID (hash)
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ckb_documents_company_id ON ckb_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_ckb_documents_source ON ckb_documents(source);
CREATE INDEX IF NOT EXISTS idx_ckb_documents_is_active ON ckb_documents(is_active);
CREATE INDEX IF NOT EXISTS idx_ckb_documents_created_at ON ckb_documents(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ckb_search_logs_company_id ON ckb_search_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_ckb_search_logs_user_id ON ckb_search_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ckb_search_logs_created_at ON ckb_search_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ckb_storage_connections_company_id ON ckb_storage_connections(company_id);
CREATE INDEX IF NOT EXISTS idx_ckb_storage_connections_user_id ON ckb_storage_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_ckb_storage_connections_provider ON ckb_storage_connections(provider);
CREATE INDEX IF NOT EXISTS idx_ckb_storage_connections_is_active ON ckb_storage_connections(is_active);

-- Create triggers for updated_at
CREATE TRIGGER update_ckb_documents_updated_at
    BEFORE UPDATE ON ckb_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ckb_storage_connections_updated_at
    BEFORE UPDATE ON ckb_storage_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Security is handled at the application level, not through RLS policies
