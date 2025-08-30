/**
 * RAG Types
 * 
 * Shared types for RAG functionality to avoid circular dependencies
 */

export interface DocumentChunk {
  id: string;
  content: string;
  contentType: string;
  metadata: Record<string, any>;
  similarity?: number;
}

export interface RAGContext {
  relevantDocuments: DocumentChunk[];
  userContext: {
    company: string;
    industry: string;
    role: string;
  };
  queryIntent: string;
  confidence: number;
}

export interface EmbeddingRequest {
  text: string;
  model?: string;
  tenantId?: string;
}

export interface EmbeddingResponse {
  success: boolean;
  embedding?: number[];
  error?: string;
}

export interface VectorSearchRequest {
  query: string;
  companyId: string;
  limit?: number;
  threshold?: number;
  contentType?: string;
}

export interface VectorSearchResponse {
  success: boolean;
  documents?: DocumentChunk[];
  error?: string;
}

