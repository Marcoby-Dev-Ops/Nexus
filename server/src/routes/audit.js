const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { query } = require('../database/connection');
const { logger } = require('../utils/logger');

const router = express.Router();

/**
 * GET /api/audit/conversations - List user's conversations with pagination
 */
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = 'WHERE user_id = $1';
    const params = [userId];
    let paramIndex = 2;

    if (search) {
      whereClause += ` AND (title ILIKE $${paramIndex} OR messages::text ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Get conversations
    const sql = `
      SELECT
        id,
        title,
        model,
        message_count,
        total_tokens,
        total_cost,
        is_archived,
        created_at,
        updated_at
      FROM ai_conversations
      ${whereClause}
      ORDER BY updated_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(parseInt(limit), offset);

    const result = await query(sql, params);

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM ai_conversations ${whereClause}`;
    const countResult = await query(countSql, [userId, ...(search ? [`%${search}%`] : [])]);

    res.json({
      success: true,
      data: {
        conversations: result.data || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.data?.[0]?.total || 0),
          pages: Math.ceil((countResult.data?.[0]?.total || 0) / parseInt(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching conversations:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch conversations' });
  }
});

/**
 * GET /api/audit/conversations/:id - Get single conversation with messages
 */
router.get('/conversations/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const sql = `
      SELECT
        c.*,
        (SELECT json_agg(m ORDER BY m.created_at)
         FROM ai_messages m
         WHERE m.conversation_id = c.id) as messages_detail
      FROM ai_conversations c
      WHERE c.id = $1 AND c.user_id = $2
    `;

    const result = await query(sql, [id, userId]);

    if (!result.data || result.data.length === 0) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    res.json({
      success: true,
      data: result.data[0]
    });
  } catch (error) {
    logger.error('Error fetching conversation:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch conversation' });
  }
});

/**
 * GET /api/audit/usage - Get usage statistics
 */
router.get('/usage', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = '30d' } = req.query;

    // Calculate date range
    let intervalDays = 30;
    if (period === '7d') intervalDays = 7;
    else if (period === '90d') intervalDays = 90;

    // Get credit balance
    const balanceSql = `
      SELECT balance_cents, last_refill_at, updated_at
      FROM user_credits
      WHERE user_id = $1
    `;
    const balanceResult = await query(balanceSql, [userId]);

    // Get subscription info
    const subSql = `
      SELECT s.*, p.name as plan_name, p.monthly_credit_allowance, p.features
      FROM user_subscriptions s
      JOIN subscription_plans p ON s.plan_id = p.id
      WHERE s.user_id = $1
    `;
    const subResult = await query(subSql, [userId]);

    // Get usage by day
    const usageSql = `
      SELECT
        DATE(created_at) as date,
        SUM(cost_cents) as total_cost_cents,
        SUM(total_tokens) as total_tokens,
        COUNT(*) as request_count
      FROM ai_provider_usage
      WHERE user_id = $1
        AND created_at >= NOW() - INTERVAL '${intervalDays} days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;
    const usageResult = await query(usageSql, [userId]);

    // Get usage by model
    const modelSql = `
      SELECT
        model,
        provider,
        SUM(cost_cents) as total_cost_cents,
        SUM(total_tokens) as total_tokens,
        COUNT(*) as request_count,
        AVG(response_time_ms) as avg_response_time_ms
      FROM ai_provider_usage
      WHERE user_id = $1
        AND created_at >= NOW() - INTERVAL '${intervalDays} days'
      GROUP BY model, provider
      ORDER BY total_cost_cents DESC
    `;
    const modelResult = await query(modelSql, [userId]);

    // Get totals for period
    const totalsSql = `
      SELECT
        SUM(cost_cents) as total_cost_cents,
        SUM(total_tokens) as total_tokens,
        COUNT(*) as total_requests,
        COUNT(DISTINCT DATE(created_at)) as active_days
      FROM ai_provider_usage
      WHERE user_id = $1
        AND created_at >= NOW() - INTERVAL '${intervalDays} days'
    `;
    const totalsResult = await query(totalsSql, [userId]);

    res.json({
      success: true,
      data: {
        balance: {
          cents: balanceResult.data?.[0]?.balance_cents || 0,
          lastRefill: balanceResult.data?.[0]?.last_refill_at
        },
        subscription: subResult.data?.[0] || null,
        period: {
          days: intervalDays,
          totals: totalsResult.data?.[0] || {}
        },
        dailyUsage: usageResult.data || [],
        modelBreakdown: modelResult.data || []
      }
    });
  } catch (error) {
    logger.error('Error fetching usage:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch usage data' });
  }
});

/**
 * GET /api/audit/transactions - Get credit transaction history
 */
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const sql = `
      SELECT
        id,
        amount_cents,
        transaction_type,
        description,
        reference_id,
        created_at
      FROM credit_transactions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await query(sql, [userId, parseInt(limit), offset]);

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM credit_transactions WHERE user_id = $1`;
    const countResult = await query(countSql, [userId]);

    res.json({
      success: true,
      data: {
        transactions: result.data || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.data?.[0]?.total || 0)
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching transactions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch transactions' });
  }
});

/**
 * GET /api/audit/insights - Get AI-generated insights from conversations
 */
router.get('/insights', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20 } = req.query;

    // Get recent conversations with extracted insights from metadata
    const sql = `
      SELECT
        c.id,
        c.title,
        c.created_at,
        c.metadata->'insights' as insights,
        c.metadata->'topics' as topics,
        c.metadata->'recommendations' as recommendations
      FROM ai_conversations c
      WHERE c.user_id = $1
        AND (c.metadata->'insights' IS NOT NULL
             OR c.metadata->'recommendations' IS NOT NULL)
      ORDER BY c.created_at DESC
      LIMIT $2
    `;

    const result = await query(sql, [userId, parseInt(limit)]);

    // Get brain tickets created from AI conversations
    const ticketsSql = `
      SELECT
        id,
        title,
        description,
        status,
        priority,
        ai_insights,
        created_at
      FROM brain_tickets
      WHERE user_id = $1
        AND ai_insights IS NOT NULL
      ORDER BY created_at DESC
      LIMIT $2
    `;
    const ticketsResult = await query(ticketsSql, [userId, parseInt(limit)]);

    // Get thoughts (business context/insights stored)
    const thoughtsSql = `
      SELECT
        id,
        title,
        content,
        category,
        tags,
        created_at
      FROM thoughts
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
    const thoughtsResult = await query(thoughtsSql, [userId, parseInt(limit)]);

    res.json({
      success: true,
      data: {
        conversationInsights: result.data || [],
        aiGeneratedTickets: ticketsResult.data || [],
        businessThoughts: thoughtsResult.data || []
      }
    });
  } catch (error) {
    logger.error('Error fetching insights:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch insights' });
  }
});

/**
 * POST /api/audit/conversations/:id/export - Export conversation as JSON
 */
router.post('/conversations/:id/export', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const sql = `
      SELECT
        c.*,
        (SELECT json_agg(
          json_build_object(
            'role', m.role,
            'content', m.content,
            'timestamp', m.created_at
          ) ORDER BY m.created_at
        ) FROM ai_messages m WHERE m.conversation_id = c.id) as messages
      FROM ai_conversations c
      WHERE c.id = $1 AND c.user_id = $2
    `;

    const result = await query(sql, [id, userId]);

    if (!result.data || result.data.length === 0) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    const conversation = result.data[0];

    // Format for export
    const exportData = {
      exportedAt: new Date().toISOString(),
      conversation: {
        id: conversation.id,
        title: conversation.title,
        model: conversation.model,
        createdAt: conversation.created_at,
        messageCount: conversation.message_count,
        totalTokens: conversation.total_tokens,
        totalCost: conversation.total_cost,
        messages: conversation.messages || []
      }
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="conversation-${id}.json"`);
    res.json(exportData);
  } catch (error) {
    logger.error('Error exporting conversation:', error);
    res.status(500).json({ success: false, error: 'Failed to export conversation' });
  }
});

module.exports = router;
