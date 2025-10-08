import { callEdgeFunction } from '@/lib/database';
import { logger } from '@/shared/utils/logger';

export interface VectorSearchResult {
  id: string;
  title: string;
  content: string;
  type: string;
  tags?: string[];
  similarity: number;
  metadata?: Record<string, any>;
}

export interface VectorSearchFilter {
  user_id?: string;
  company_id?: string;
  type?: string;
  category?: string;
}

export interface VectorSearchOptions {
  maxResults?: number;
  threshold?: number;
  filter?: VectorSearchFilter;
}

class VectorSearch {
  async searchVectorsByText(
    userId: string,
    query: string,
    maxResults: number = 10,
    filter: VectorSearchFilter = {}
  ): Promise<VectorSearchResult[]> {
    try {
      const response = await callEdgeFunction('vector_search', {
        query,
        userId,
        maxResults,
        filter: {
          user_id: userId,
          ...filter
        }
      });

      if (!response.success) {
        logger.error('Vector search failed:', response.error);
        return [];
      }

      return response.data || [];
    } catch (error) {
      logger.error('Error in vector search:', error);
      return [];
    }
  }

  async insertDocumentWithEmbedding(data: {
    title: string;
    content: string;
    embedding?: number[];
    user_id: string;
    company_id?: string;
    tags?: string[];
    metadata?: Record<string, any>;
  }): Promise<{ success: boolean; id?: string }> {
    try {
      const response = await callEdgeFunction('insert_document', {
        ...data,
        type: 'document'
      });

      if (!response.success) {
        logger.error('Document insertion failed:', response.error);
        return { success: false };
      }

      return {
        success: true,
        id: response.data?.id
      };
    } catch (error) {
      logger.error('Error inserting document:', error);
      return { success: false };
    }
  }

  async insertThoughtWithEmbedding(data: {
    title: string;
    content: string;
    embedding?: number[];
    user_id: string;
    company_id?: string;
    category?: string;
    tags?: string[];
    metadata?: Record<string, any>;
  }): Promise<{ success: boolean; id?: string }> {
    try {
      const response = await callEdgeFunction('insert_thought', {
        ...data,
        type: 'thought'
      });

      if (!response.success) {
        logger.error('Thought insertion failed:', response.error);
        return { success: false };
      }

      return {
        success: true,
        id: response.data?.id
      };
    } catch (error) {
      logger.error('Error inserting thought:', error);
      return { success: false };
    }
  }

  async searchDocuments(
    query: string,
    options: VectorSearchOptions = {}
  ): Promise<VectorSearchResult[]> {
    return this.searchVectorsByText(
      options.filter?.user_id || '',
      query,
      options.maxResults || 10,
      { ...options.filter, type: 'document' }
    );
  }

  async searchThoughts(
    query: string,
    options: VectorSearchOptions = {}
  ): Promise<VectorSearchResult[]> {
    return this.searchVectorsByText(
      options.filter?.user_id || '',
      query,
      options.maxResults || 10,
      { ...options.filter, type: 'thought' }
    );
  }

  async searchBusinessData(
    query: string,
    options: VectorSearchOptions = {}
  ): Promise<VectorSearchResult[]> {
    return this.searchVectorsByText(
      options.filter?.user_id || '',
      query,
      options.maxResults || 10,
      { ...options.filter, type: 'business_data' }
    );
  }
}

export const vectorSearch = new VectorSearch();
