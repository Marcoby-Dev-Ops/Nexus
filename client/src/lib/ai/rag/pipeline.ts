import LRU from 'lru-cache';
// import { NexusAIGatewayService } from '@/ai/services/NexusAIGatewayService'; // Removed - server-side service
import { vectorSearch } from '@/lib/database';
import { logger } from '@/shared/utils/logger';

// Cache for embeddings to avoid recomputation
const embeddingCache = new LRU<string, number[]>({
  max: 1000,
  ttl: 1000 * 60 * 60, // 1 hour
});

/**
 * Generate embeddings for text using AI service
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const cacheKey = `embedding:${text.substring(0, 100)}`;
  
  // Check cache first
  const cached = embeddingCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // const aiService = new NexusAIGatewayService(); // Removed - server-side service
    const embedding = await aiService.generateEmbedding(text);
    
    // Cache the result
    embeddingCache.set(cacheKey, embedding);
    
    return embedding;
  } catch (error) {
    logger.error('Failed to generate embedding:', error);
    throw new Error('Failed to generate embedding for text');
  }
}

/**
 * Upsert vectors to PostgreSQL with pgvector
 */
export async function upsertVectors(tenantId: string, items: Array<{ id: string; vector: number[]; content: string; metadata?: Record<string, any> }>) {
  try {
    const results = await Promise.all(
      items.map(async (item) => {
        // Determine if this is a document or thought based on metadata
        const isDocument = item.metadata?.type === 'document';
        
        if (isDocument) {
          return vectorSearch.insertDocumentWithEmbedding({
            title: item.metadata?.title || `Document ${item.id}`,
            content: item.content,
            embedding: item.vector,
            user_id: tenantId,
            company_id: item.metadata?.company_id,
            tags: item.metadata?.tags,
            metadata: item.metadata
          });
        } else {
          return vectorSearch.insertThoughtWithEmbedding({
            title: item.metadata?.title || `Thought ${item.id}`,
            content: item.content,
            embedding: item.vector,
            user_id: tenantId,
            company_id: item.metadata?.company_id,
            category: item.metadata?.category,
            tags: item.metadata?.tags,
            metadata: item.metadata
          });
        }
      })
    );

    logger.info(`Upserted ${results.length} vectors for tenant ${tenantId}`);
    return results;
  } catch (error) {
    logger.error('Failed to upsert vectors:', error);
    throw error;
  }
}

/**
 * Search vectors using pgvector similarity search
 */
export async function searchVectors(tenantId: string, queryVector: number[], k: number = 5, filter?: Record<string, any>) {
  try {
    // Search both documents and thoughts
    const [documentResults, thoughtResults] = await Promise.all([
      vectorSearch.searchDocuments(queryVector, k, { user_id: tenantId, ...filter }),
      vectorSearch.searchThoughts(queryVector, k, { user_id: tenantId, ...filter })
    ]);

    // Combine and sort by similarity
    const allResults = [
      ...(documentResults.data || []).map((doc: any) => ({
        ...doc,
        type: 'document'
      })),
      ...(thoughtResults.data || []).map((thought: any) => ({
        ...thought,
        type: 'thought'
      }))
    ].sort((a, b) => b.similarity - a.similarity);

    // Return top k results
    return allResults.slice(0, k);
  } catch (error) {
    logger.error('Failed to search vectors:', error);
    throw error;
  }
}

/**
 * Search vectors by text query (generates embedding first)
 */
export async function searchVectorsByText(tenantId: string, queryText: string, k: number = 5, filter?: Record<string, any>) {
  try {
    // Generate embedding for the query text
    const queryEmbedding = await generateEmbedding(queryText);
    
    // Search using the generated embedding
    return searchVectors(tenantId, queryEmbedding, k, filter);
  } catch (error) {
    logger.error('Failed to search vectors by text:', error);
    throw error;
  }
}

/**
 * Batch process text items and store with embeddings
 */
export async function processAndStoreTexts(
  tenantId: string, 
  items: Array<{ id: string; text: string; metadata?: Record<string, any> }>
) {
  try {
    // Generate embeddings for all texts
    const itemsWithEmbeddings = await Promise.all(
      items.map(async (item) => ({
        ...item,
        vector: await generateEmbedding(item.text)
      }))
    );

    // Store in database
    return upsertVectors(tenantId, itemsWithEmbeddings);
  } catch (error) {
    logger.error('Failed to process and store texts:', error);
    throw error;
  }
}

/**
 * Get similar items for a given text
 */
export async function getSimilarItems(
  tenantId: string, 
  text: string, 
  k: number = 5, 
  filter?: Record<string, any>
) {
  try {
    return searchVectorsByText(tenantId, text, k, filter);
  } catch (error) {
    logger.error('Failed to get similar items:', error);
    throw error;
  }
}


