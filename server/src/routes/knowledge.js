const { Router } = require('express');
const { authenticateToken } = require('../middleware/auth');
const { logger } = require('../utils/logger');
const { buildAssistantCoreSnapshot } = require('../config/assistantCore');
const { assembleKnowledgeContext, buildContextChips } = require('../services/knowledgeContextService');

const router = Router();
router.use(authenticateToken);

/**
 * GET /api/knowledge/assistant-core
 * Returns versioned assistant runtime knowledge for transparency in the UI.
 */
router.get('/assistant-core', async (req, res) => {
  try {
    const requestedAgentId = typeof req.query.agentId === 'string' ? req.query.agentId : undefined;
    const snapshot = buildAssistantCoreSnapshot(requestedAgentId);
    return res.json({
      success: true,
      data: snapshot
    });
  } catch (error) {
    logger.error('Failed to load assistant core knowledge', {
      userId: req.user?.id,
      requestedAgentId: req.query.agentId,
      error: error instanceof Error ? error.message : String(error)
    });
    return res.status(500).json({
      success: false,
      error: 'Failed to load assistant core knowledge'
    });
  }
});

function parseBooleanParam(value, defaultValue = true) {
  if (value === undefined) return defaultValue;
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return defaultValue;

  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'yes', 'y'].includes(normalized)) return true;
  if (['false', '0', 'no', 'n'].includes(normalized)) return false;
  return defaultValue;
}

/**
 * GET /api/knowledge/context
 * Deterministically assembles read-only context blocks by horizon and subject.
 */
router.get('/context', async (req, res) => {
  try {
    const requestedAgentId = typeof req.query.agentId === 'string' ? req.query.agentId : undefined;
    const conversationId = typeof req.query.conversationId === 'string' ? req.query.conversationId : undefined;
    const includeShort = parseBooleanParam(req.query.includeShort, true);
    const includeMedium = parseBooleanParam(req.query.includeMedium, true);
    const includeLong = parseBooleanParam(req.query.includeLong, true);

    const rawMaxBlocks = typeof req.query.maxBlocks === 'string'
      ? Number.parseInt(req.query.maxBlocks, 10)
      : undefined;
    const maxBlocks = Number.isFinite(rawMaxBlocks) ? rawMaxBlocks : undefined;

    const data = await assembleKnowledgeContext({
      userId: req.user?.id,
      jwtPayload: req.user?.jwtPayload,
      agentId: requestedAgentId,
      conversationId,
      includeShort,
      includeMedium,
      includeLong,
      maxBlocks
    });

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    logger.error('Failed to assemble knowledge context', {
      userId: req.user?.id,
      requestedAgentId: req.query.agentId,
      conversationId: req.query.conversationId,
      error: error instanceof Error ? error.message : String(error)
    });
    return res.status(500).json({
      success: false,
      error: 'Failed to assemble knowledge context'
    });
  }
});

/**
 * GET /api/knowledge/context-chips
 * Returns backend-generated quick action chips based on live knowledge context.
 */
router.get('/context-chips', async (req, res) => {
  try {
    const requestedAgentId = typeof req.query.agentId === 'string' ? req.query.agentId : undefined;
    const conversationId = typeof req.query.conversationId === 'string' ? req.query.conversationId : undefined;
    const rawLimit = typeof req.query.limit === 'string' ? Number.parseInt(req.query.limit, 10) : 4;
    const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(rawLimit, 8)) : 4;

    const context = await assembleKnowledgeContext({
      userId: req.user?.id,
      jwtPayload: req.user?.jwtPayload,
      agentId: requestedAgentId,
      conversationId,
      includeShort: true,
      includeMedium: true,
      includeLong: true,
      maxBlocks: 10
    });

    const chips = buildContextChips(context.contextBlocks).slice(0, limit);

    return res.json({
      success: true,
      data: {
        chips,
        contextDigest: context.contextDigest,
        resolved: context.resolved
      }
    });
  } catch (error) {
    logger.error('Failed to build context chips', {
      userId: req.user?.id,
      requestedAgentId: req.query.agentId,
      conversationId: req.query.conversationId,
      error: error instanceof Error ? error.message : String(error)
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to build context chips'
    });
  }
});

module.exports = router;
