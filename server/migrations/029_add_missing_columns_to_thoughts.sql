-- Add missing columns to thoughts table for vector search functionality
-- Migration: 029_add_missing_columns_to_thoughts.sql

-- Add missing columns to thoughts table
ALTER TABLE thoughts 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add missing columns to documents table
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_thoughts_company_id ON thoughts(company_id);
CREATE INDEX IF NOT EXISTS idx_thoughts_category ON thoughts(category);
CREATE INDEX IF NOT EXISTS idx_thoughts_tags ON thoughts USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_documents_company_id ON documents(company_id);
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING GIN(tags);

-- Add comments for documentation
COMMENT ON COLUMN thoughts.company_id IS 'Reference to the company this thought belongs to';
COMMENT ON COLUMN thoughts.title IS 'Title or summary of the thought';
COMMENT ON COLUMN thoughts.category IS 'Category or type of the thought';
COMMENT ON COLUMN thoughts.tags IS 'Array of tags for categorizing and searching thoughts';

COMMENT ON COLUMN documents.company_id IS 'Reference to the company this document belongs to';
COMMENT ON COLUMN documents.title IS 'Title of the document';
COMMENT ON COLUMN documents.tags IS 'Array of tags for categorizing and searching documents';
