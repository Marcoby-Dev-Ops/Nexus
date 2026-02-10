const crypto = require('crypto');
const { query } = require('../database/connection');
const { logger } = require('../utils/logger');
const { buildAssistantCoreSnapshot } = require('../config/assistantCore');
const { normalizeAgentId } = require('../config/agentCatalog');

const HORIZONS = ['short', 'medium', 'long'];
const DEFAULT_MAX_BLOCKS = 8;
const MAX_ALLOWED_BLOCKS = 20;

function normalizeIncludedHorizons(options = {}) {
  const includeShort = options.includeShort !== false;
  const includeMedium = options.includeMedium !== false;
  const includeLong = options.includeLong !== false;

  return HORIZONS.filter((horizon) => {
    if (horizon === 'short') return includeShort;
    if (horizon === 'medium') return includeMedium;
    return includeLong;
  });
}

function normalizeMaxBlocks(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_MAX_BLOCKS;
  return Math.max(1, Math.min(MAX_ALLOWED_BLOCKS, Math.floor(parsed)));
}

function hashToUUID(value = '') {
  const hash = String(value || '').replace(/[^a-f0-9]/gi, '').slice(0, 32);
  const padded = hash.padEnd(32, '0');

  return [
    padded.slice(0, 8),
    padded.slice(8, 12),
    padded.slice(12, 16),
    padded.slice(16, 20),
    padded.slice(20, 32)
  ].join('-');
}

function uniqueStrings(values = []) {
  return Array.from(new Set(values.filter((v) => typeof v === 'string' && v.trim().length > 0)));
}

function safelyParseJson(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;
  if (typeof value !== 'string') return null;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function truncateText(value = '', limit = 260) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (text.length <= limit) return text;
  return `${text.slice(0, limit - 3)}...`;
}

function formatList(items = []) {
  return items.map((item) => `- ${item}`).join('\n');
}

function estimateTokensFromText(text = '') {
  const chars = String(text || '').length;
  return Math.max(0, Math.ceil(chars / 4));
}

function buildDigest(payload) {
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0, 16);
}

function createBlock({
  id,
  title,
  horizon,
  domain,
  subjectType,
  subjectId,
  content,
  source,
  updatedAt,
  confidence,
  priority
}) {
  return {
    id,
    title,
    horizon,
    domain,
    subjectType,
    subjectId,
    content,
    source,
    updatedAt: updatedAt || null,
    confidence: typeof confidence === 'number' ? Number(confidence.toFixed(3)) : confidence,
    priority
  };
}

function sortBlocks(a, b) {
  if (a.priority !== b.priority) return a.priority - b.priority;
  if (a.updatedAt !== b.updatedAt) return String(b.updatedAt).localeCompare(String(a.updatedAt));
  return String(a.id).localeCompare(String(b.id));
}

function buildSystemContext(blocks = []) {
  if (!blocks.length) {
    return 'No persisted knowledge context is currently available.';
  }

  const sections = blocks.map((block) => {
    return [
      `[${block.horizon.toUpperCase()}] ${block.title}`,
      `Domain: ${block.domain}`,
      `Source: ${block.source}`,
      block.content
    ].join('\n');
  });

  return sections.join('\n\n');
}

function buildTimeAwareChip() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Prioritize my most important work for this morning';
  if (hour < 18) return 'What should I focus on for the rest of today?';
  return 'Summarize progress and propose next actions';
}

function extractProjectTitles(contextBlocks = []) {
  const activeProjectsBlock = contextBlocks.find((block) => block?.id === 'active-projects');
  if (!activeProjectsBlock?.content || typeof activeProjectsBlock.content !== 'string') return [];

  return activeProjectsBlock.content
    .split('\n')
    .map((line) => {
      const match = line.match(/^\d+\.\s*(.+?)\s*\[/);
      return match?.[1]?.trim() || '';
    })
    .filter(Boolean)
    .slice(0, 2);
}

function extractRecentUserTopic(contextBlocks = []) {
  const recentConversationBlock = contextBlocks.find((block) => block?.domain === 'conversation');
  if (!recentConversationBlock?.content || typeof recentConversationBlock.content !== 'string') return '';

  const firstUserLine = recentConversationBlock.content
    .split('\n')
    .find((line) => line.toUpperCase().startsWith('USER:'));

  if (!firstUserLine) return '';
  return truncateText(firstUserLine.replace(/^USER:\s*/i, '').trim(), 100);
}

function buildContextChips(contextBlocks = []) {
  const chips = [];
  const projectTitles = extractProjectTitles(contextBlocks);
  const recentTopic = extractRecentUserTopic(contextBlocks);

  chips.push(buildTimeAwareChip());

  if (recentTopic) {
    chips.push(`Continue this: ${recentTopic}`);
  }

  for (const title of projectTitles) {
    chips.push(`What should we do next on "${title}"?`);
  }

  const defaults = [
    'Summarize recent performance',
    'Identify growth opportunities',
    'Draft a quarterly report',
    'Surface risks I should address now'
  ];

  chips.push(...defaults);

  return uniqueStrings(chips).slice(0, 4);
}

function createKnowledgeContextService(deps = {}) {
  const dbQuery = deps.query || query;
  const snapshotBuilder = deps.buildAssistantCoreSnapshot || buildAssistantCoreSnapshot;
  const agentIdNormalizer = deps.normalizeAgentId || normalizeAgentId;

  async function optionalQuery(sql, params, jwtPayload, context = {}) {
    const result = await dbQuery(sql, params, jwtPayload);
    if (result?.error) {
      logger.warn('Knowledge context optional query failed', {
        ...context,
        error: result.error
      });
      return [];
    }

    return result?.data || [];
  }

  async function fetchUserBusinessProfile(userId, jwtPayload) {
    const rows = await optionalQuery(
      `SELECT
        up.user_id,
        up.display_name,
        up.first_name,
        up.last_name,
        up.role,
        up.job_title,
        up.location,
        up.preferences,
        up.updated_at AS profile_updated_at,
        up.company_id,
        c.name AS company_name,
        c.updated_at AS company_updated_at,
        to_jsonb(c) AS company_record
      FROM user_profiles up
      LEFT JOIN companies c ON c.id = up.company_id
      WHERE up.user_id = $1
      LIMIT 1`,
      [userId],
      jwtPayload,
      { source: 'user_profiles' }
    );

    return rows[0] || null;
  }

  async function fetchTopActiveProjects(userId, jwtPayload) {
    const userIds = uniqueStrings([userId, hashToUUID(userId)]);
    if (!userIds.length) return [];

    return optionalQuery(
      `SELECT
        id,
        title,
        description,
        status,
        priority,
        updated_at
      FROM brain_tickets
      WHERE user_id::text = ANY($1::text[])
        AND COALESCE(status, 'active') NOT IN ('completed', 'closed')
      ORDER BY
        CASE
          WHEN status = 'active' THEN 0
          WHEN status = 'in_progress' THEN 1
          WHEN status = 'paused' THEN 2
          WHEN status = 'planned' THEN 3
          ELSE 4
        END,
        updated_at DESC
      LIMIT 3`,
      [userIds],
      jwtPayload,
      { source: 'brain_tickets' }
    );
  }

  async function fetchRecentConversation(conversationId, userId, jwtPayload) {
    if (conversationId) {
      return optionalQuery(
        `SELECT
          m.conversation_id,
          m.role,
          m.content,
          m.created_at
        FROM ai_messages m
        JOIN ai_conversations c ON c.id = m.conversation_id
        WHERE m.conversation_id = $1
          AND c.user_id = $2
        ORDER BY m.created_at DESC
        LIMIT 4`,
        [conversationId, userId],
        jwtPayload,
        { source: 'ai_messages', conversationId }
      );
    }

    return optionalQuery(
      `SELECT
        m.conversation_id,
        m.role,
        m.content,
        m.created_at
      FROM ai_messages m
      JOIN ai_conversations c ON c.id = m.conversation_id
      WHERE c.user_id = $1
      ORDER BY m.created_at DESC
      LIMIT 4`,
      [userId],
      jwtPayload,
      { source: 'ai_messages', mode: 'latest' }
    );
  }

  async function fetchCrossConversationMessages(conversationId, userId, jwtPayload) {
    return optionalQuery(
      `SELECT
        m.conversation_id,
        m.role,
        m.content,
        m.created_at,
        c.title AS conversation_title
      FROM ai_messages m
      JOIN ai_conversations c ON c.id = m.conversation_id
      WHERE c.user_id = $1
        AND ($2::text IS NULL OR m.conversation_id::text <> $2::text)
      ORDER BY m.created_at DESC
      LIMIT 8`,
      [userId, conversationId || null],
      jwtPayload,
      { source: 'ai_messages', mode: 'cross-conversation', conversationId: conversationId || null }
    );
  }

  async function fetchKnowledgeFacts({ userId, agentId, sharedSubjectIds, includedHorizons, maxRows, jwtPayload }) {
    if (!includedHorizons.length) return [];

    const rows = await optionalQuery(
      `SELECT
        id,
        subject_type,
        subject_id,
        horizon,
        domain,
        fact_key,
        fact_value,
        source,
        confidence,
        updated_at
      FROM knowledge_active_facts
      WHERE horizon = ANY($1::text[])
        AND (
          (subject_type = 'user' AND subject_id = $2)
          OR (subject_type = 'agent' AND subject_id = $3)
          OR (subject_type = 'shared' AND subject_id = ANY($4::text[]))
        )
      ORDER BY
        CASE horizon
          WHEN 'short' THEN 0
          WHEN 'medium' THEN 1
          ELSE 2
        END,
        updated_at DESC,
        fact_key ASC
      LIMIT $5`,
      [includedHorizons, userId, agentId, sharedSubjectIds, maxRows],
      jwtPayload,
      { source: 'knowledge_active_facts' }
    );

    return rows;
  }

  function buildAgentCoreBlock(agentSnapshot) {
    const factLines = agentSnapshot.facts.map((fact) => `${fact.label}: ${fact.value}`);
    const factUpdatedAt = agentSnapshot.facts
      .map((fact) => fact?.updatedAt)
      .find((value) => typeof value === 'string' && value.length > 0);
    const content = [
      `Agent: ${agentSnapshot.agentName} (${agentSnapshot.agentRole})`,
      `Version: ${agentSnapshot.version}`,
      `Digest: ${agentSnapshot.digest}`,
      'Core Facts:',
      formatList(factLines)
    ].join('\n');

    return createBlock({
      id: 'agent-core',
      title: 'Assistant Core',
      horizon: 'long',
      domain: 'assistant-core',
      subjectType: 'agent',
      subjectId: agentSnapshot.agentId,
      content,
      source: 'runtime:assistant-core',
      updatedAt: factUpdatedAt || null,
      confidence: 1,
      priority: 10
    });
  }

  function buildUserIdentityBlock(profile) {
    if (!profile) return null;

    const companyRecord = safelyParseJson(profile.company_record) || {};
    const companyName = profile.company_name || companyRecord.name;
    const companyIndustry = companyRecord.industry;
    const companyStage = companyRecord.stage || companyRecord.company_stage;

    const fullName = profile.display_name || [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim();
    const lines = [];
    if (fullName) lines.push(`Name: ${fullName}`);
    if (profile.role) lines.push(`Role: ${profile.role}`);
    if (profile.job_title) lines.push(`Job Title: ${profile.job_title}`);
    if (profile.location) lines.push(`Location: ${profile.location}`);
    if (companyName) lines.push(`Company: ${companyName}`);
    if (companyIndustry) lines.push(`Industry: ${companyIndustry}`);
    if (companyStage) lines.push(`Stage: ${companyStage}`);

    if (!lines.length) return null;

    return createBlock({
      id: 'user-identity',
      title: 'User and Business Profile',
      horizon: 'long',
      domain: 'identity',
      subjectType: 'user',
      subjectId: profile.user_id,
      content: formatList(lines),
      source: 'db:user_profiles+companies',
      updatedAt: profile.company_updated_at || profile.profile_updated_at,
      confidence: 0.95,
      priority: 20
    });
  }

  function buildUserPreferenceBlock(profile) {
    if (!profile?.preferences) return null;

    const preferences = safelyParseJson(profile.preferences);
    if (!preferences || typeof preferences !== 'object') return null;

    const keys = ['communication_style', 'goals', 'focus_areas', 'decision_style', 'timezone'];
    const lines = [];

    for (const key of keys) {
      const value = preferences[key];
      if (!value) continue;
      if (Array.isArray(value)) {
        if (!value.length) continue;
        lines.push(`${key}: ${value.join(', ')}`);
        continue;
      }
      lines.push(`${key}: ${String(value)}`);
    }

    if (!lines.length) return null;

    return createBlock({
      id: 'user-preferences',
      title: 'User Preferences',
      horizon: 'medium',
      domain: 'preferences',
      subjectType: 'user',
      subjectId: profile.user_id,
      content: formatList(lines),
      source: 'db:user_profiles.preferences',
      updatedAt: profile.profile_updated_at,
      confidence: 0.8,
      priority: 30
    });
  }

  function buildActiveProjectsBlock(projects = [], userId) {
    if (!projects.length) return null;

    const lines = projects.map((project, index) => {
      const status = project.status || 'active';
      const priority = project.priority || 'medium';
      const description = project.description ? ` | ${truncateText(project.description, 120)}` : '';
      return `${index + 1}. ${project.title} [${status}/${priority}]${description}`;
    });

    return createBlock({
      id: 'active-projects',
      title: 'Top Active Projects',
      horizon: 'medium',
      domain: 'execution',
      subjectType: 'user',
      subjectId: userId,
      content: lines.join('\n'),
      source: 'db:brain_tickets',
      updatedAt: projects[0]?.updated_at,
      confidence: 0.9,
      priority: 40
    });
  }

  function buildRecentConversationBlock(messages = [], userId) {
    if (!messages.length) return null;

    const sorted = [...messages].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
    const lines = sorted.map((message) => {
      const role = String(message.role || 'user').toUpperCase();
      return `${role}: ${truncateText(message.content, 180)}`;
    });

    return createBlock({
      id: `conversation-${sorted[0]?.conversation_id || 'latest'}`,
      title: 'Recent Conversation Context',
      horizon: 'short',
      domain: 'conversation',
      subjectType: 'user',
      subjectId: userId,
      content: lines.join('\n'),
      source: 'db:ai_messages',
      updatedAt: sorted[sorted.length - 1]?.created_at,
      confidence: 0.85,
      priority: 50
    });
  }

  function buildCrossConversationMemoryBlock(messages = [], userId, activeConversationId) {
    if (!messages.length) return null;

    const grouped = new Map();

    for (const message of messages) {
      const conversationId = String(message.conversation_id || '');
      if (!conversationId) continue;

      if (!grouped.has(conversationId)) {
        grouped.set(conversationId, {
          title: message.conversation_title || null,
          messages: []
        });
      }

      const bucket = grouped.get(conversationId);
      if (bucket.messages.length < 3) {
        bucket.messages.push(message);
      }
      if (grouped.size >= 2 && Array.from(grouped.values()).every((entry) => entry.messages.length >= 2)) {
        break;
      }
    }

    if (!grouped.size) return null;

    const lines = [];
    for (const [conversationId, entry] of grouped.entries()) {
      const shortId = conversationId.slice(0, 8);
      const title = entry.title ? truncateText(String(entry.title), 64) : `Conversation ${shortId}`;
      lines.push(`${title} (${shortId})`);

      const orderedMessages = [...entry.messages].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
      for (const message of orderedMessages.slice(-2)) {
        const role = String(message.role || 'user').toUpperCase();
        lines.push(`- ${role}: ${truncateText(message.content, 140)}`);
      }
    }

    return createBlock({
      id: activeConversationId ? `conversation-cross-${activeConversationId}` : 'conversation-cross-latest',
      title: 'Cross-Conversation Memory',
      horizon: 'medium',
      domain: 'conversation-memory',
      subjectType: 'user',
      subjectId: userId,
      content: lines.join('\n'),
      source: 'db:ai_messages',
      updatedAt: messages[0]?.created_at,
      confidence: 0.82,
      priority: 45
    });
  }

  function buildKnowledgeFactBlocks(rows = []) {
    return rows.map((row) => {
      const normalizedValue = (() => {
        if (!row.fact_value) return '';
        if (typeof row.fact_value === 'string') return row.fact_value;
        try {
          return JSON.stringify(row.fact_value);
        } catch {
          return String(row.fact_value);
        }
      })();

      return createBlock({
        id: `fact-${row.id}`,
        title: `Knowledge: ${row.domain}/${row.fact_key}`,
        horizon: row.horizon,
        domain: row.domain || 'general',
        subjectType: row.subject_type,
        subjectId: row.subject_id,
        content: truncateText(normalizedValue, 280),
        source: `db:${row.source || 'knowledge_facts'}`,
        updatedAt: row.updated_at,
        confidence: typeof row.confidence === 'number' ? row.confidence : null,
        priority: row.horizon === 'short' ? 60 : row.horizon === 'medium' ? 70 : 80
      });
    });
  }

  async function assembleKnowledgeContext(options = {}) {
    const startedAt = Date.now();
    const userId = options.userId;
    const jwtPayload = options.jwtPayload || null;
    const maxBlocks = normalizeMaxBlocks(options.maxBlocks);
    const includedHorizons = normalizeIncludedHorizons(options);
    const resolvedAgentId = agentIdNormalizer(options.agentId);
    const conversationId = options.conversationId || null;

    if (!userId) {
      throw new Error('assembleKnowledgeContext requires userId');
    }

    const agentSnapshot = snapshotBuilder(resolvedAgentId);

    const profile = await fetchUserBusinessProfile(userId, jwtPayload);
    const sharedSubjectIds = uniqueStrings([
      'global',
      'default',
      profile?.company_id ? String(profile.company_id) : null
    ]);

    const [projects, recentMessages, crossConversationMessages, knowledgeFactRows] = await Promise.all([
      fetchTopActiveProjects(userId, jwtPayload),
      fetchRecentConversation(conversationId, userId, jwtPayload),
      fetchCrossConversationMessages(conversationId, userId, jwtPayload),
      fetchKnowledgeFacts({
        userId,
        agentId: resolvedAgentId,
        sharedSubjectIds,
        includedHorizons,
        maxRows: maxBlocks * 4,
        jwtPayload
      })
    ]);

    const candidateBlocks = [
      buildAgentCoreBlock(agentSnapshot),
      buildUserIdentityBlock(profile),
      buildUserPreferenceBlock(profile),
      buildActiveProjectsBlock(projects, userId),
      buildCrossConversationMemoryBlock(crossConversationMessages, userId, conversationId),
      buildRecentConversationBlock(recentMessages, userId),
      ...buildKnowledgeFactBlocks(knowledgeFactRows)
    ].filter(Boolean);

    const scopedBlocks = candidateBlocks
      .filter((block) => includedHorizons.includes(block.horizon))
      .sort(sortBlocks)
      .slice(0, maxBlocks);

    const horizonUsage = {
      short: scopedBlocks.filter((block) => block.horizon === 'short').length,
      medium: scopedBlocks.filter((block) => block.horizon === 'medium').length,
      long: scopedBlocks.filter((block) => block.horizon === 'long').length
    };

    const sources = uniqueStrings(scopedBlocks.map((block) => block.source)).map((source) => ({
      id: source,
      type: source.startsWith('runtime:') ? 'runtime' : 'database'
    }));

    const systemContext = buildSystemContext(scopedBlocks);
    const tokenEstimate = estimateTokensFromText(systemContext);
    const contextDigest = buildDigest({
      userId,
      agentId: resolvedAgentId,
      conversationId,
      blockIds: scopedBlocks.map((block) => block.id),
      updatedAt: scopedBlocks.map((block) => block.updatedAt)
    });

    return {
      contextBlocks: scopedBlocks.map((block) => {
        const { priority, ...safeBlock } = block;
        return safeBlock;
      }),
      systemContext,
      horizonUsage,
      sources,
      contextDigest,
      tokenEstimate,
      cache: {
        key: `knowledge-context:${userId}:${resolvedAgentId}:${contextDigest}`,
        ttlSeconds: 60,
        generatedAt: new Date().toISOString()
      },
      resolved: {
        agentId: resolvedAgentId,
        conversationId,
        includedHorizons,
        maxBlocks
      },
      metrics: {
        generationMs: Date.now() - startedAt,
        totalCandidates: candidateBlocks.length
      }
    };
  }

  return {
    assembleKnowledgeContext
  };
}

const defaultService = createKnowledgeContextService();

module.exports = {
  HORIZONS,
  createKnowledgeContextService,
  assembleKnowledgeContext: defaultService.assembleKnowledgeContext,
  buildContextChips
};
