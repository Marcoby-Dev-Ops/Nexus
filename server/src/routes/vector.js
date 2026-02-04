const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { createError } = require('../middleware/errorHandler');
const { query } = require('../database/connection');
const { logger } = require('../utils/logger');

// Initialize the AI Gateway service
let aiGateway;
try {
  const { NexusAIGatewayService } = require('../../services/NexusAIGatewayService');
  aiGateway = new NexusAIGatewayService({
    enableOpenAI: true,
    enableOpenRouter: true,
    enableLocal: true,
    maxRetries: 3,
    retryDelayMs: 1000,
    enableUsageTracking: true,
    enableCircuitBreaker: true,
  });
  logger.info('AI Gateway service initialized for vector routes');
} catch (error) {
  logger.error('Failed to initialize AI Gateway service for vector routes:', error.message);
  aiGateway = {
    generateEmbeddings: async () => ({ success: false, error: 'AI Gateway service not available' }),
    chat: async () => ({ success: false, error: 'AI Gateway service not available' })
  };
}

const router = express.Router();

/**
 * POST /api/vector/search - Search documents by vector similarity
 */
router.post('/search', authenticateToken, async (req, res) => {
  try {
    const { query_embedding, match_count = 5, filter = {} } = req.body;
    const userId = req.user.id;

    if (!query_embedding || !Array.isArray(query_embedding)) {
      throw createError('query_embedding must be an array of numbers', 400);
    }

    if (match_count < 1 || match_count > 100) {
      throw createError('match_count must be between 1 and 100', 400);
    }

    // Build the match_documents function call
    let sql = `
      SELECT 
        id,
        content,
        metadata,
        1 - (embedding <=> $1) as similarity
      FROM documents 
      WHERE user_id = $2
    `;
    
    const params = [query_embedding, userId];
    let paramIndex = 3;

    // Add additional filters
    if (filter && Object.keys(filter).length > 0) {
      Object.entries(filter).forEach(([key, value]) => {
        if (key === 'metadata') {
          // Handle JSONB metadata filtering
          sql += ` AND metadata @> $${paramIndex}`;
          params.push(JSON.stringify(value));
        } else {
          sql += ` AND ${key} = $${paramIndex}`;
          params.push(value);
        }
        paramIndex++;
      });
    }

    sql += `
      ORDER BY embedding <=> $1
      LIMIT $${paramIndex}
    `;
    params.push(match_count);

    logger.info('Executing vector search', { userId, matchCount: match_count });

    const result = await query(sql, params);

    if (result.error) {
      throw createError(`Vector search failed: ${result.error}`, 500);
    }

    res.json({
      success: true,
      data: result.data || []
    });

  } catch (error) {
    logger.error('Vector search error:', error);
    res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Vector search failed'
    });
  }
});

/**
 * POST /api/vector/embed - Generate embedding for text
 */
router.post('/embed', authenticateToken, async (req, res) => {
  try {
    const { text, model = 'text-embedding-ada-002' } = req.body;
    const userId = req.user.id;

    if (!text || typeof text !== 'string') {
      throw createError('text must be a non-empty string', 400);
    }

    // Generate real embedding using AI service
    const embeddingResponse = await aiGateway.generateEmbeddings({
      text: text,
      model: model,
      tenantId: req.user?.company_id || 'default-tenant',
      userId: req.user?.id || 'anonymous'
    });

    if (!embeddingResponse.success) {
      throw createError(embeddingResponse.error || 'Failed to generate embedding', 500);
    }

    const { embedding } = embeddingResponse.data;

    logger.info('Generated embedding', { userId, textLength: text.length, model });

    res.json({
      success: true,
      data: {
        embedding: embedding,
        model: model,
        text_length: text.length
      }
    });

  } catch (error) {
    logger.error('Embedding generation error:', error);
    res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Embedding generation failed'
    });
  }
});

/**
 * POST /api/vector/thoughts/search - Search thoughts by vector similarity
 */
router.post('/thoughts/search', authenticateToken, async (req, res) => {
  try {
    const { query_embedding, match_count = 5, filter = {} } = req.body;
    const userId = req.user.id;

    if (!query_embedding || !Array.isArray(query_embedding)) {
      throw createError('query_embedding must be an array of numbers', 400);
    }

    if (match_count < 1 || match_count > 100) {
      throw createError('match_count must be between 1 and 100', 400);
    }

    // Build the match_thoughts function call
    let sql = `
      SELECT 
        id,
        content,
        metadata,
        1 - (embedding <=> $1) as similarity
      FROM thoughts 
      WHERE user_id = $2
    `;
    
    const params = [query_embedding, userId];
    let paramIndex = 3;

    // Add additional filters
    if (filter && Object.keys(filter).length > 0) {
      Object.entries(filter).forEach(([key, value]) => {
        if (key === 'metadata') {
          // Handle JSONB metadata filtering
          sql += ` AND metadata @> $${paramIndex}`;
          params.push(JSON.stringify(value));
        } else {
          sql += ` AND ${key} = $${paramIndex}`;
          params.push(value);
        }
        paramIndex++;
      });
    }

    sql += `
      ORDER BY embedding <=> $1
      LIMIT $${paramIndex}
    `;
    params.push(match_count);

    logger.info('Executing thoughts vector search', { userId, matchCount: match_count });

    const result = await query(sql, params);

    if (result.error) {
      throw createError(`Thoughts vector search failed: ${result.error}`, 500);
    }

    res.json({
      success: true,
      data: result.data || []
    });

  } catch (error) {
    logger.error('Thoughts vector search error:', error);
    res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Thoughts vector search failed'
    });
  }
});

/**
 * POST /api/vector/documents/insert - Insert document with embedding
 */
router.post('/documents/insert', authenticateToken, async (req, res) => {
  try {
    const { content, metadata = {}, embedding } = req.body;
    const userId = req.user.id;

    if (!content || typeof content !== 'string') {
      throw createError('content must be a non-empty string', 400);
    }

    if (!embedding || !Array.isArray(embedding)) {
      throw createError('embedding must be an array of numbers', 400);
    }

    // Convert embedding array to PostgreSQL vector format
    const vectorString = `[${embedding.join(',')}]`;

    const sql = `
      INSERT INTO documents (user_id, content, metadata, embedding, created_at, updated_at)
      VALUES ($1, $2, $3, $4::vector, NOW(), NOW())
      RETURNING id, content, metadata, created_at
    `;

    const params = [userId, content, JSON.stringify(metadata), vectorString];

    logger.info('Inserting document with embedding', { userId, contentLength: content.length });

    const result = await query(sql, params);

    if (result.error) {
      throw createError(`Document insert failed: ${result.error}`, 500);
    }

    res.json({
      success: true,
      data: result.data[0]
    });

  } catch (error) {
    logger.error('Document insert error:', error);
    res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Document insert failed'
    });
  }
});

/**
 * POST /api/vector/thoughts/insert - Insert thought with embedding
 */
router.post('/thoughts/insert', authenticateToken, async (req, res) => {
  try {
    const { content, metadata = {}, embedding } = req.body;
    const userId = req.user.id;

    if (!content || typeof content !== 'string') {
      throw createError('content must be a non-empty string', 400);
    }

    if (!embedding || !Array.isArray(embedding)) {
      throw createError('embedding must be an array of numbers', 400);
    }

    // Convert embedding array to PostgreSQL vector format
    const vectorString = `[${embedding.join(',')}]`;

    const sql = `
      INSERT INTO thoughts (user_id, content, metadata, embedding, created_at, updated_at)
      VALUES ($1, $2, $3, $4::vector, NOW(), NOW())
      RETURNING id, content, metadata, created_at
    `;

    const params = [userId, content, JSON.stringify(metadata), vectorString];

    logger.info('Inserting thought with embedding', { userId, contentLength: content.length });

    const result = await query(sql, params);

    if (result.error) {
      throw createError(`Thought insert failed: ${result.error}`, 500);
    }

    res.json({
      success: true,
      data: result.data[0]
    });

  } catch (error) {
    logger.error('Thought insert error:', error);
    res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Thought insert failed'
    });
  }
});

/**
 * POST /api/vector/thoughts/semantic - Semantic search thoughts by text query
 * Combines embedding generation + vector search in one call
 */
router.post('/thoughts/semantic', authenticateToken, async (req, res) => {
  try {
    const { query: searchQuery, match_count = 5 } = req.body;
    const userId = req.user.id;

    if (!searchQuery || typeof searchQuery !== 'string') {
      throw createError('query must be a non-empty string', 400);
    }

    if (match_count < 1 || match_count > 20) {
      throw createError('match_count must be between 1 and 20', 400);
    }

    // Step 1: Generate embedding for the search query
    const embeddingResponse = await aiGateway.generateEmbeddings({
      text: searchQuery,
      model: 'text-embedding-3-small',
      tenantId: req.user?.company_id || 'default-tenant',
      userId: userId
    });

    if (!embeddingResponse.success || !embeddingResponse.data?.embedding) {
      // Fallback: return empty results if embedding fails (don't block the chat)
      logger.warn('Embedding generation failed, returning empty semantic results');
      return res.json({ success: true, data: [] });
    }

    const queryEmbedding = embeddingResponse.data.embedding;
    const vectorString = `[${queryEmbedding.join(',')}]`;

    // Step 2: Search thoughts by vector similarity
    const sql = `
      SELECT
        id,
        title,
        content,
        category,
        tags,
        1 - (embedding <=> $1::vector) as similarity
      FROM thoughts
      WHERE user_id = $2
        AND embedding IS NOT NULL
      ORDER BY embedding <=> $1::vector
      LIMIT $3
    `;

    const result = await query(sql, [vectorString, userId, match_count]);

    if (result.error) {
      logger.error('Semantic search query failed:', result.error);
      return res.json({ success: true, data: [] });
    }

    // Filter by minimum similarity threshold (0.5)
    const relevantThoughts = (result.data || []).filter(t => t.similarity > 0.5);

    logger.info('Semantic thoughts search', {
      userId,
      query: searchQuery.substring(0, 50),
      resultsFound: relevantThoughts.length
    });

    res.json({
      success: true,
      data: relevantThoughts
    });

  } catch (error) {
    logger.error('Semantic thoughts search error:', error);
    // Don't fail the request - return empty results
    res.json({
      success: true,
      data: []
    });
  }
});

/**
 * GET /api/vector/stats - Get vector search statistics
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const sql = `
      SELECT 
        'documents' as table_name,
        COUNT(*) as total_records,
        COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END) as records_with_embeddings
      FROM documents 
      WHERE user_id = $1
      UNION ALL
      SELECT 
        'thoughts' as table_name,
        COUNT(*) as total_records,
        COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END) as records_with_embeddings
      FROM thoughts 
      WHERE user_id = $1
    `;

    const result = await query(sql, [userId]);

    if (result.error) {
      throw createError(`Stats query failed: ${result.error}`, 500);
    }

    res.json({
      success: true,
      data: result.data || []
    });

  } catch (error) {
    logger.error('Vector stats error:', error);
    res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Vector stats failed'
    });
  }
});

module.exports = router;
