import { selectData, selectOne, insertOne, updateOne, deleteOne, callEdgeFunction } from '@/lib/api-client';
import { vectorSearch } from '@/lib/database';
import { logger } from '@/shared/utils/logger';

export interface RAGContext {
  userId: string;
  companyId?: string;
  sessionId?: string;
  currentTopic?: string;
  recentInteractions?: string[];
  userPreferences?: Record<string, any>;
}

export interface RAGDocument {
  id: string;
  content: string;
  metadata: {
    source: string;
    timestamp: string;
    type: string;
    tags?: string[];
    relevance_score?: number;
  };
}

export interface RAGQuery {
  query: string;
  context: RAGContext;
  maxResults?: number;
  threshold?: number;
}

export interface RAGResult {
  documents: RAGDocument[];
  query: string;
  context: RAGContext;
  totalResults: number;
  processingTime: number;
}

class ContextualRAG {
  private embeddingsCache: Map<string, number[]> = new Map();

  async searchRelevantDocuments(query: RAGQuery): Promise<RAGResult> {
    const startTime = Date.now();
    
    try {
      // Extract relevant documents based on query and context
      const documents = await this.retrieveDocuments(query);
      
      // Filter and rank documents based on relevance
      const rankedDocuments = await this.rankDocuments(documents, query);
      
      // Apply threshold filtering
      const filteredDocuments = this.applyThreshold(rankedDocuments, query.threshold || 0.7);
      
      return {
        documents: filteredDocuments.slice(0, query.maxResults || 10),
        query: query.query,
        context: query.context,
        totalResults: filteredDocuments.length,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      logger.error('Error in contextual RAG search:', error);
      return {
        documents: [],
        query: query.query,
        context: query.context,
        totalResults: 0,
        processingTime: Date.now() - startTime,
      };
    }
  }

  async retrieveDocuments(query: RAGQuery): Promise<RAGDocument[]> {
    try {
      // Use vector search to find relevant documents
      const searchResults = await vectorSearch.searchVectorsByText(
        query.context.userId,
        query.query,
        query.maxResults || 20,
        {
          company_id: query.context.companyId,
          type: 'document'
        }
      );

      // Convert search results to RAGDocument format
      const documents: RAGDocument[] = searchResults.map((result: any) => ({
        id: result.id,
        content: result.content,
        metadata: {
          source: result.title || 'Unknown',
          timestamp: new Date().toISOString(),
          type: result.type || 'document',
          tags: result.tags || [],
          relevance_score: result.similarity || 0
        }
      }));

      // Also search thoughts for additional context
      const thoughtResults = await vectorSearch.searchVectorsByText(
        query.context.userId,
        query.query,
        Math.floor((query.maxResults || 20) / 2),
        {
          company_id: query.context.companyId,
          type: 'thought'
        }
      );

      const thoughtDocuments: RAGDocument[] = thoughtResults.map((result: any) => ({
        id: result.id,
        content: result.content,
        metadata: {
          source: result.title || 'Thought',
          timestamp: new Date().toISOString(),
          type: 'thought',
          tags: result.tags || [],
          relevance_score: result.similarity || 0
        }
      }));

      return [...documents, ...thoughtDocuments];
    } catch (error) {
      logger.error('Error retrieving documents:', error);
      return [];
    }
  }

  private async rankDocuments(documents: RAGDocument[], query: RAGQuery): Promise<RAGDocument[]> {
    try {
      // Sort by relevance score (already done by vector search)
      return documents.sort((a, b) => 
        (b.metadata.relevance_score || 0) - (a.metadata.relevance_score || 0)
      );
    } catch (error) {
      logger.error('Error ranking documents:', error);
      return documents;
    }
  }

  private applyThreshold(documents: RAGDocument[], threshold: number): RAGDocument[] {
    return documents.filter(doc => (doc.metadata.relevance_score || 0) >= threshold);
  }

  async generateContextualResponse(query: string, context: RAGContext): Promise<string> {
    try {
      const ragQuery: RAGQuery = {
        query,
        context,
        maxResults: 5,
        threshold: 0.6,
      };

      const result = await this.searchRelevantDocuments(ragQuery);
      
      if (result.documents.length === 0) {
        return "I don't have enough relevant context to provide a specific answer. Could you provide more details?";
      }

      // Combine relevant documents into context
      const contextText = result.documents
        .map(doc => doc.content)
        .join('\n\n');

      // In a real implementation, this would call an AI model
      // For now, return a simple response based on the context
      return `Based on your previous interactions and thoughts, here's what I found:\n\n${contextText.substring(0, 500)}...`;
    } catch (error) {
      logger.error('Error generating contextual response:', error);
      return "I'm having trouble accessing your contextual information right now. Please try again.";
    }
  }

  async updateUserContext(userId: string, context: Partial<RAGContext>): Promise<void> {
    try {
      // Store user context in database
      await insertOne('user_context', {
        user_id: userId,
        context_data: context,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error updating user context:', error);
    }
  }

  async storeDocument(
    userId: string,
    content: string,
    metadata: {
      title?: string;
      source?: string;
      type?: string;
      tags?: string[];
      companyId?: string;
    }
  ): Promise<void> {
    try {
      // Store document with embedding
      await vectorSearch.insertDocumentWithEmbedding({
        title: metadata.title || 'Document',
        content,
        embedding: [], // Will be generated by the database trigger
        user_id: userId,
        company_id: metadata.companyId,
        tags: metadata.tags,
        metadata: {
          source: metadata.source || 'user_input',
          type: metadata.type || 'document',
          ...metadata
        }
      });
    } catch (error) {
      logger.error('Error storing document:', error);
    }
  }

  async storeThought(
    userId: string,
    content: string,
    metadata: {
      title?: string;
      category?: string;
      tags?: string[];
      companyId?: string;
    }
  ): Promise<void> {
    try {
      // Store thought with embedding
      await vectorSearch.insertThoughtWithEmbedding({
        title: metadata.title || 'Thought',
        content,
        embedding: [], // Will be generated by the database trigger
        user_id: userId,
        company_id: metadata.companyId,
        category: metadata.category,
        tags: metadata.tags,
        metadata: {
          type: 'thought',
          ...metadata
        }
      });
    } catch (error) {
      logger.error('Error storing thought:', error);
    }
  }
}

export { ContextualRAG };
export const contextualRAG = new ContextualRAG(); 