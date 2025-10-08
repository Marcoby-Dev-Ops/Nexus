/**
 * RAG (Retrieval-Augmented Generation) Service
 * 
 * This service handles document retrieval, embedding generation, and context augmentation
 * for the AI chat system.
 */

import { callEdgeFunction } from '../api-client';
import type { 
  DocumentChunk, 
  RAGContext, 
  EmbeddingRequest, 
  EmbeddingResponse, 
  VectorSearchRequest, 
  VectorSearchResponse 
} from './RAGTypes';

export type { 
  DocumentChunk, 
  RAGContext, 
  EmbeddingRequest, 
  EmbeddingResponse, 
  VectorSearchRequest, 
  VectorSearchResponse 
};

class RAGService {
  private embeddingModel = 'text-embedding-3-small';
  private defaultLimit = 5;
  private defaultThreshold = 0.7;

  /**
   * Generate embeddings for text using OpenAI
   */
  async generateEmbedding(text: string, model?: string): Promise<number[]> {
    try {
      const response = await callEdgeFunction('ai_embeddings', {
        text,
        model: model || this.embeddingModel,
        tenantId: 'nexus'
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to generate embedding');
      }

      return response.data.embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  /**
   * Search for relevant documents using vector similarity
   */
  async searchDocuments(request: VectorSearchRequest): Promise<DocumentChunk[]> {
    try {
      const { query, companyId, limit = this.defaultLimit, threshold = this.defaultThreshold, contentType } = request;

      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);

      // Search for similar documents
      const response = await callEdgeFunction('ai_vector_search', {
        queryEmbedding,
        companyId,
        limit,
        threshold,
        contentType
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to search documents');
      }

      return response.data.documents || [];
    } catch (error) {
      console.error('Error searching documents:', error);
      return [];
    }
  }

  /**
   * Analyze query intent and determine what type of information is needed
   */
  analyzeQueryIntent(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    // Business strategy queries
    if (lowerQuery.includes('strategy') || lowerQuery.includes('plan') || lowerQuery.includes('goal')) {
      return 'business_strategy';
    }
    
    // Financial queries
    if (lowerQuery.includes('finance') || lowerQuery.includes('revenue') || lowerQuery.includes('cost') || lowerQuery.includes('budget')) {
      return 'financial';
    }
    
    // Sales queries
    if (lowerQuery.includes('sales') || lowerQuery.includes('pipeline') || lowerQuery.includes('deal') || lowerQuery.includes('customer')) {
      return 'sales';
    }
    
    // Marketing queries
    if (lowerQuery.includes('marketing') || lowerQuery.includes('campaign') || lowerQuery.includes('lead') || lowerQuery.includes('brand')) {
      return 'marketing';
    }
    
    // Operations queries
    if (lowerQuery.includes('operation') || lowerQuery.includes('process') || lowerQuery.includes('workflow') || lowerQuery.includes('efficiency')) {
      return 'operations';
    }
    
    // Company information queries
    if (lowerQuery.includes('company') || lowerQuery.includes('business') || lowerQuery.includes('organization')) {
      return 'company_info';
    }
    
    return 'general';
  }

  /**
   * Build RAG context for AI chat
   */
  async buildRAGContext(
    query: string, 
    companyId: string, 
    userContext: { company: string; industry: string; role: string }
  ): Promise<RAGContext> {
    try {
      // Analyze query intent
      const queryIntent = this.analyzeQueryIntent(query);
      
      // Search for relevant documents
      const relevantDocuments = await this.searchDocuments({
        query,
        companyId,
        limit: this.defaultLimit,
        threshold: this.defaultThreshold,
        contentType: queryIntent !== 'general' ? queryIntent : undefined
      });

      // Calculate confidence based on document relevance
      const confidence = relevantDocuments.length > 0 
        ? Math.max(...relevantDocuments.map(doc => doc.similarity || 0))
        : 0;

      return {
        relevantDocuments,
        userContext,
        queryIntent,
        confidence
      };
    } catch (error) {
      console.error('Error building RAG context:', error);
      return {
        relevantDocuments: [],
        userContext,
        queryIntent: 'general',
        confidence: 0
      };
    }
  }

  /**
   * Format RAG context for AI system prompt
   */
  formatRAGContextForPrompt(ragContext: RAGContext): string {
    if (ragContext.relevantDocuments.length === 0) {
      return '';
    }

    let contextPrompt = '\n\nRELEVANT DOCUMENTATION:';
    
    // Add company-specific context
    contextPrompt += `\nBased on your company (${ragContext.userContext.company}) in the ${ragContext.userContext.industry} industry, here is relevant information:`;
    
    // Add relevant documents
    ragContext.relevantDocuments.forEach((doc, index) => {
      contextPrompt += `\n\nDocument ${index + 1} (${doc.contentType}):`;
      contextPrompt += `\n${doc.content}`;
      
      // Add metadata if available
      if (doc.metadata && Object.keys(doc.metadata).length > 0) {
        contextPrompt += `\nMetadata: ${JSON.stringify(doc.metadata)}`;
      }
    });

    // Add confidence indicator
    if (ragContext.confidence > 0.8) {
      contextPrompt += '\n\nNote: This information is highly relevant to your query.';
    } else if (ragContext.confidence > 0.6) {
      contextPrompt += '\n\nNote: This information is moderately relevant to your query.';
    } else {
      contextPrompt += '\n\nNote: This information may be tangentially related to your query.';
    }

    return contextPrompt;
  }

  /**
   * Store document chunks in vector database
   */
  async storeDocument(
    content: string,
    contentType: string,
    companyId: string,
    metadata: Record<string, any> = {}
  ): Promise<boolean> {
    try {
      const response = await callEdgeFunction('ai_store_document', {
        content,
        contentType,
        companyId,
        metadata
      });

      return response.success;
    } catch (error) {
      console.error('Error storing document:', error);
      return false;
    }
  }

  /**
   * Process and chunk documents for storage
   */
  async processDocument(
    document: string,
    contentType: string,
    companyId: string,
    metadata: Record<string, any> = {}
  ): Promise<boolean> {
    try {
      // Split document into chunks (simple implementation)
      const chunks = this.chunkDocument(document, 1000); // 1000 character chunks
      
      // Store each chunk
      const storePromises = chunks.map((chunk, index) => 
        this.storeDocument(chunk, contentType, companyId, {
          ...metadata,
          chunkIndex: index,
          totalChunks: chunks.length
        })
      );

      const results = await Promise.all(storePromises);
      return results.every(result => result);
    } catch (error) {
      console.error('Error processing document:', error);
      return false;
    }
  }

  /**
   * Split document into chunks for vector storage
   */
  private chunkDocument(document: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    let currentChunk = '';
    
    const sentences = document.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += (currentChunk ? '. ' : '') + sentence;
      }
    }
    
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }

  /**
   * Get RAG statistics for a company
   */
  async getRAGStats(companyId: string): Promise<{
    totalDocuments: number;
    documentTypes: Record<string, number>;
    lastUpdated: string;
  }> {
    try {
      const response = await callEdgeFunction('ai_rag_stats', { companyId });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to get RAG stats');
      }

      return response.data;
    } catch (error) {
      console.error('Error getting RAG stats:', error);
      return {
        totalDocuments: 0,
        documentTypes: {},
        lastUpdated: new Date().toISOString()
      };
    }
  }
}

export const ragService = new RAGService();
export default ragService;
