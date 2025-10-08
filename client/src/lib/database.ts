/**
 * Database client for PostgreSQL with pgvector
 * Replaces Supabase client with direct PostgreSQL connection
 */

import { callRPC, selectData, selectOne, insertOne, updateOne, deleteOne, upsertOne, selectWithOptions, callEdgeFunction, getAuthHeaders } from './api-client';

// Export the new API client functions
export {
  callRPC,
  selectData,
  selectOne,
  insertOne,
  updateOne,
  deleteOne,
  upsertOne,
  selectWithOptions,
  callEdgeFunction,
  getAuthHeaders
};

// Re-export ApiClient for modules that import it from '@/lib/database'
export { ApiClient } from './api-client';

// Vector search functions for pgvector
export const vectorSearch = {
  /**
   * Search documents by vector similarity
   */
  async searchDocuments(
    queryEmbedding: number[],
    matchCount: number = 5,
    filter: Record<string, any> = {}
  ) {
    return callRPC('match_documents', {
      query_embedding: queryEmbedding,
      match_count: matchCount,
      filter: filter
    });
  },

  /**
   * Search thoughts by vector similarity
   */
  async searchThoughts(
    queryEmbedding: number[],
    matchCount: number = 5,
    filter: Record<string, any> = {}
  ) {
    return callRPC('match_thoughts', {
      query_embedding: queryEmbedding,
      match_count: matchCount,
      filter: filter
    });
  },

  /**
   * Insert document with embedding
   */
  async insertDocumentWithEmbedding(
    data: {
      title: string;
      content: string;
      embedding: number[];
      user_id: string;
      company_id?: string;
      tags?: string[];
      metadata?: Record<string, any>;
    }
  ) {
    return insertOne('documents', data);
  },

  /**
   * Insert thought with embedding
   */
  async insertThoughtWithEmbedding(
    data: {
      title: string;
      content: string;
      embedding: number[];
      user_id: string;
      company_id?: string;
      category?: string;
      tags?: string[];
      metadata?: Record<string, any>;
    }
  ) {
    return insertOne('thoughts', data);
  }
};

// Legacy compatibility - redirect to new functions
export const database = {
  from: (table: string) => ({
    select: (columns?: string) => selectData(table, columns),
    insert: (data: any) => insertOne(table, data),
    update: (data: any) => updateOne(table, data.id, data),
    delete: (id: string) => deleteOne(table, id),
    upsert: (data: any, onConflict?: string) => upsertOne(table, data, onConflict)
  }),
  rpc: callRPC
};

// Remove deprecated Supabase export
// export const supabase = database;
