const { query } = require('./connection');
const { logger } = require('../utils/logger');

/**
 * Generate embedding for text using AI Gateway
 */
async function generateEmbedding(text) {
  try {
    const { NexusAIGatewayService } = require('../../services/NexusAIGatewayService');
    const aiGateway = new NexusAIGatewayService();
    
    const response = await aiGateway.generateEmbeddings({
      text: text,
      model: 'text-embedding-3-small',
      tenantId: 'onboarding'
    });

    if (response.success && response.data && response.data.embedding) {
      return response.data.embedding;
    } else {
      throw new Error('Failed to generate embedding');
    }
  } catch (error) {
    logger.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Insert thought with embedding
 */
async function insertThoughtWithEmbedding(data) {
  try {
    // Generate embedding if not provided
    let embedding = data.embedding;
    if (!embedding) {
      embedding = await generateEmbedding(data.content);
    }

    // Convert embedding array to PostgreSQL vector format
    const vectorString = Array.isArray(embedding) 
      ? `[${embedding.join(',')}]` 
      : embedding;

    const result = await query(`
      INSERT INTO thoughts (
        id, user_id, company_id, title, content, category, 
        tags, metadata, embedding, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8::vector, NOW(), NOW()
      ) RETURNING id
    `, [
      data.user_id,
      data.company_id,
      data.title,
      data.content,
      data.category || 'general',
      data.tags || [],
      JSON.stringify(data.metadata || {}),
      vectorString
    ]);

    if (result.error) {
      throw new Error(result.error);
    }

    logger.info('Stored thought with embedding', { 
      thoughtId: result.data?.[0]?.id,
      title: data.title,
      category: data.category 
    });

    return {
      success: true,
      id: result.data?.[0]?.id
    };
  } catch (error) {
    logger.error('Error inserting thought with embedding:', error);
    throw error;
  }
}

/**
 * Insert document with embedding
 */
async function insertDocumentWithEmbedding(data) {
  try {
    // Generate embedding if not provided
    let embedding = data.embedding;
    if (!embedding) {
      embedding = await generateEmbedding(data.content);
    }

    // Convert embedding array to PostgreSQL vector format
    const vectorString = Array.isArray(embedding) 
      ? `[${embedding.join(',')}]` 
      : embedding;

    const result = await query(`
      INSERT INTO documents (
        id, user_id, company_id, title, content, 
        tags, metadata, embedding, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7::vector, NOW(), NOW()
      ) RETURNING id
    `, [
      data.user_id,
      data.company_id,
      data.title,
      data.content,
      data.tags || [],
      JSON.stringify(data.metadata || {}),
      vectorString
    ]);

    if (result.error) {
      throw new Error(result.error);
    }

    logger.info('Stored document with embedding', { 
      documentId: result.data?.[0]?.id,
      title: data.title 
    });

    return {
      success: true,
      id: result.data?.[0]?.id
    };
  } catch (error) {
    logger.error('Error inserting document with embedding:', error);
    throw error;
  }
}

/**
 * Search thoughts by vector similarity
 */
async function searchThoughts(queryEmbedding, matchCount = 5, filter = {}) {
  try {
    let whereClause = 'WHERE 1=1';
    const params = [queryEmbedding, matchCount];
    let paramIndex = 3;

    if (filter.user_id) {
      whereClause += ` AND user_id = $${paramIndex++}`;
      params.push(filter.user_id);
    }

    if (filter.company_id) {
      whereClause += ` AND company_id = $${paramIndex++}`;
      params.push(filter.company_id);
    }

    if (filter.category) {
      whereClause += ` AND category = $${paramIndex++}`;
      params.push(filter.category);
    }

    const result = await query(`
      SELECT 
        id, title, content, category, tags, metadata,
        1 - (embedding <=> $1) as similarity
      FROM thoughts 
      ${whereClause}
      ORDER BY embedding <=> $1
      LIMIT $2
    `, params);

    if (result.error) {
      throw new Error(result.error);
    }

    return {
      success: true,
      data: result.data || []
    };
  } catch (error) {
    logger.error('Error searching thoughts:', error);
    throw error;
  }
}

/**
 * Search documents by vector similarity
 */
async function searchDocuments(queryEmbedding, matchCount = 5, filter = {}) {
  try {
    let whereClause = 'WHERE 1=1';
    const params = [queryEmbedding, matchCount];
    let paramIndex = 3;

    if (filter.user_id) {
      whereClause += ` AND user_id = $${paramIndex++}`;
      params.push(filter.user_id);
    }

    if (filter.company_id) {
      whereClause += ` AND company_id = $${paramIndex++}`;
      params.push(filter.company_id);
    }

    const result = await query(`
      SELECT 
        id, title, content, tags, metadata,
        1 - (embedding <=> $1) as similarity
      FROM documents 
      ${whereClause}
      ORDER BY embedding <=> $1
      LIMIT $2
    `, params);

    if (result.error) {
      throw new Error(result.error);
    }

    return {
      success: true,
      data: result.data || []
    };
  } catch (error) {
    logger.error('Error searching documents:', error);
    throw error;
  }
}

module.exports = {
  insertThoughtWithEmbedding,
  insertDocumentWithEmbedding,
  searchThoughts,
  searchDocuments,
  generateEmbedding
};
