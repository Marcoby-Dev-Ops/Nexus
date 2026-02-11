const express = require('express');
const { query } = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');
const { logger } = require('../utils/logger');

const router = express.Router();

// Initialize the AI Gateway service
let aiGateway;
try {
  const { NexusAIGatewayService } = require('../services/NexusAIGatewayService');
  aiGateway = new NexusAIGatewayService({
    enableOpenAI: true,
    enableOpenRouter: true,
    enableLocal: true,
    maxRetries: 3,
    retryDelayMs: 1000,
    enableUsageTracking: true,
    enableCircuitBreaker: true,
  });
  logger.info('AI Gateway service initialized for CKB routes');
} catch (error) {
  logger.error('Failed to initialize AI Gateway service for CKB:', error.message);
  aiGateway = {
    generateEmbeddings: async () => ({ success: false, error: 'AI Gateway service not available' }),
    chat: async () => ({ success: false, error: 'AI Gateway service not available' })
  };
}

// Middleware to ensure user is authenticated
router.use(authenticateToken);

// Internal search function for Q&A
async function searchDocumentsInternal(companyId, query) {
  try {
    // Generate embedding for the search query
    const embeddingResponse = await aiGateway.generateEmbeddings({
      text: query.query,
      model: 'text-embedding-3-small',
      tenantId: companyId || 'default-tenant',
      userId: 'system'
    });

    if (!embeddingResponse.success) {
      throw new Error(embeddingResponse.error || 'Failed to generate embedding');
    }

    const { embedding } = embeddingResponse.data;

    // Build the search query with filters
    let sql = `
      SELECT id, company_id, title, content, content_type, source, source_id, source_url, metadata,
             (embedding <=> $1) as similarity
      FROM ckb_documents 
      WHERE company_id = $2
    `;
    
    const params = [embedding, companyId];
    let paramIndex = 3;

    // Add filters
    if (query.filters?.content_type && query.filters.content_type.length > 0) {
      sql += ` AND content_type = ANY($${paramIndex})`;
      params.push(query.filters.content_type);
      paramIndex++;
    }

    if (query.filters?.department && query.filters.department.length > 0) {
      sql += ` AND metadata->>'department' = ANY($${paramIndex})`;
      params.push(query.filters.department);
      paramIndex++;
    }

    sql += ` ORDER BY embedding <=> $1 LIMIT $${paramIndex}`;
    params.push(query.limit || 10);

    const result = await query(sql, params);

    if (result.error) {
      throw new Error(result.error);
    }

    return result.data.map(row => ({
      document: {
        id: row.id,
        company_id: row.company_id,
        title: row.title,
        content: row.content,
        content_type: row.content_type,
        source: row.source,
        source_id: row.source_id,
        source_url: row.source_url,
        metadata: row.metadata,
        created_at: row.created_at,
        updated_at: row.updated_at
      },
      score: 1 - row.similarity, // Convert distance to similarity score
      highlights: [], // Text highlighting not implemented in MVP
      context: row.content.substring(0, 200) + '...'
    }));
  } catch (error) {
    logger.error('Error in internal search:', error);
    throw new Error('Failed to search documents');
  }
}

// Get all documents for a company
router.get('/documents', async (req, res) => {
  try {
    const { company_id } = req.user;
    const { limit = 50, offset = 0 } = req.query;

    const result = await query(
      `SELECT id, company_id, title, content, content_type, source, source_id, source_url, metadata, created_at, updated_at
       FROM ckb_documents 
       WHERE company_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [company_id, parseInt(limit), parseInt(offset)]
    );

    if (result.error) {
      throw new Error(result.error);
    }

    res.json({
      success: true,
      data: result.data,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: result.data.length
      }
    });
  } catch (error) {
    logger.error('Error fetching CKB documents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch documents'
    });
  }
});

// Search documents
router.post('/search', async (req, res) => {
  try {
    const { company_id } = req.user;
    const { query, filters = {}, limit = 10 } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    // Generate embedding for the search query
    const embeddingResponse = await aiGateway.generateEmbeddings({
      text: query,
      model: 'text-embedding-3-small',
      tenantId: req.user.company_id || 'default-tenant',
      userId: req.user.id
    });

    if (!embeddingResponse.success) {
      throw new Error(embeddingResponse.error || 'Failed to generate embedding');
    }

    const { embedding } = embeddingResponse.data;

    // Build the search query with filters
    let sql = `
      SELECT id, company_id, title, content, content_type, source, source_id, source_url, metadata,
             (embedding <=> $1) as similarity
      FROM ckb_documents 
      WHERE company_id = $2
    `;
    
    const params = [embedding, company_id];
    let paramIndex = 3;

    // Add filters
    if (filters.content_type && filters.content_type.length > 0) {
      sql += ` AND content_type = ANY($${paramIndex})`;
      params.push(filters.content_type);
      paramIndex++;
    }

    if (filters.department && filters.department.length > 0) {
      sql += ` AND metadata->>'department' = ANY($${paramIndex})`;
      params.push(filters.department);
      paramIndex++;
    }

    sql += ` ORDER BY embedding <=> $1 LIMIT $${paramIndex}`;
    params.push(parseInt(limit));

    const result = await query(sql, params);

    if (result.error) {
      throw new Error(result.error);
    }

    const searchResults = result.data.map(row => ({
      document: {
        id: row.id,
        company_id: row.company_id,
        title: row.title,
        content: row.content,
        content_type: row.content_type,
        source: row.source,
        source_id: row.source_id,
        source_url: row.source_url,
        metadata: row.metadata,
        created_at: row.created_at,
        updated_at: row.updated_at
      },
      score: 1 - row.similarity, // Convert distance to similarity score
      highlights: [], // Text highlighting not implemented in MVP
      context: row.content.substring(0, 200) + '...'
    }));

    // Log the search for analytics
    await query(
      `INSERT INTO ckb_search_logs (company_id, user_id, query, results_count, search_type, response_time_ms)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [company_id, req.user.id, query, searchResults.length, 'semantic', 0] // Response time not tracked in MVP
    );

    res.json({
      success: true,
      data: searchResults,
      query,
      filters
    });
  } catch (error) {
    logger.error('Error searching CKB documents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search documents'
    });
  }
});

// Ask a question about documents
router.post('/qa', async (req, res) => {
  try {
    const { company_id } = req.user;
    const { question } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Question is required'
      });
    }

    // First, search for relevant documents
    const searchResults = await searchDocumentsInternal(company_id, {
      query: question,
      limit: 5
    });

    if (searchResults.length === 0) {
      return res.json({
        success: true,
        data: {
          answer: "I couldn't find any relevant documents to answer your question.",
          sources: [],
          confidence: 0,
          reasoning: "No relevant documents found in your knowledge base."
        }
      });
    }

    // Prepare context from top documents
    const context = searchResults
      .map(result => `${result.document.title}:\n${result.document.content}`)
      .join('\n\n');

    // Call AI service for Q&A
    const aiResponse = await aiGateway.chat({
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant that answers questions based on the provided company documents. Only use information from the documents provided. If you cannot answer the question based on the documents, say so.`
        },
        {
          role: 'user',
          content: `Based on these company documents:\n\n${context}\n\nQuestion: ${question}`
        }
      ],
      model: 'zai/glm-4.7',
      temperature: 0.3,
      tenantId: req.user.company_id || 'default-tenant',
      userId: req.user.id
    });

    if (!aiResponse.success) {
      throw new Error(aiResponse.error || 'Failed to get AI response');
    }

    const answer = aiResponse.data.choices[0].message.content;

    const qaResponse = {
      answer,
      sources: searchResults.map(result => result.document),
      confidence: searchResults[0].score,
      reasoning: `Based on ${searchResults.length} relevant documents with confidence scores ranging from ${Math.round(searchResults[searchResults.length - 1].score * 100)}% to ${Math.round(searchResults[0].score * 100)}%.`
    };

    // Log the Q&A for analytics
    await query(
      `INSERT INTO ckb_search_logs (company_id, user_id, query, results_count, search_type, response_time_ms)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [company_id, req.user.id, question, searchResults.length, 'qa', 0] // Response time not tracked in MVP
    );

    res.json({
      success: true,
      data: qaResponse
    });
  } catch (error) {
    logger.error('Error asking question:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get answer'
    });
  }
});

// Add a document
router.post('/documents', async (req, res) => {
  try {
    const { company_id } = req.user;
    const { title, content, content_type, source, source_id, source_url, metadata = {} } = req.body;

    if (!title || !content || !content_type || !source || !source_id || !source_url) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Generate embedding for the content
    const embeddingResponse = await aiGateway.generateEmbeddings({
      text: content,
      model: 'text-embedding-3-small',
      tenantId: req.user.company_id || 'default-tenant',
      userId: req.user.id
    });

    if (!embeddingResponse.success) {
      throw new Error(embeddingResponse.error || 'Failed to generate embedding');
    }

    const { embedding } = embeddingResponse.data;

    const result = await query(
      `INSERT INTO ckb_documents 
       (company_id, title, content, content_type, source, source_id, source_url, embedding, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        company_id,
        title,
        content,
        content_type,
        source,
        source_id,
        source_url,
        embedding,
        metadata
      ]
    );

    if (result.error) {
      throw new Error(result.error);
    }

    res.json({
      success: true,
      data: result.data[0]
    });
  } catch (error) {
    logger.error('Error adding CKB document:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add document'
    });
  }
});

// Delete a document
router.delete('/documents/:id', async (req, res) => {
  try {
    const { company_id } = req.user;
    const { id } = req.params;

    const result = await query(
      'DELETE FROM ckb_documents WHERE id = $1 AND company_id = $2 RETURNING id',
      [id, company_id]
    );

    if (result.error) {
      throw new Error(result.error);
    }

    if (result.data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting CKB document:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete document'
    });
  }
});

// Get document statistics
router.get('/stats', async (req, res) => {
  try {
    const { company_id } = req.user;

    const result = await query(
      `SELECT * FROM ckb_document_stats WHERE company_id = $1`,
      [company_id]
    );

    if (result.error) {
      throw new Error(result.error);
    }

    const stats = result.data[0] || {
      total_documents: 0,
      file_types: 0,
      connected_sources: 0,
      last_document_added: null,
      avg_content_length: 0
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error fetching CKB stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

module.exports = router;
