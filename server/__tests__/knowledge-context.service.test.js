const test = require('node:test');
const assert = require('node:assert/strict');

const { createKnowledgeContextService, buildContextChips } = require('../src/services/knowledgeContextService');

function buildMockQuery() {
  return async (sql) => {
    if (sql.includes('FROM user_profiles up')) {
      return {
        data: [
          {
            user_id: 'user-123',
            display_name: 'Von J',
            first_name: 'Von',
            last_name: 'J',
            role: 'Founder',
            job_title: 'CEO',
            location: 'Nashville',
            preferences: {
              communication_style: 'concise',
              goals: ['ship mvp', 'reduce context switching']
            },
            profile_updated_at: '2026-02-10T10:00:00.000Z',
            company_id: 'company-123',
            company_name: 'Nexus Labs',
            company_industry: 'AI Software',
            company_size: '11-50',
            company_stage: 'growth',
            company_updated_at: '2026-02-09T10:00:00.000Z'
          }
        ],
        error: null
      };
    }

    if (sql.includes('FROM brain_tickets')) {
      return {
        data: [
          {
            id: 'ticket-1',
            title: 'Knowledge foundation',
            description: 'Build first-class knowledge graph primitives',
            status: 'active',
            priority: 'high',
            updated_at: '2026-02-10T09:00:00.000Z'
          },
          {
            id: 'ticket-2',
            title: 'Context API',
            description: 'Expose deterministic context blocks',
            status: 'in_progress',
            priority: 'high',
            updated_at: '2026-02-10T08:00:00.000Z'
          }
        ],
        error: null
      };
    }

    if (sql.includes('FROM ai_messages m')) {
      return {
        data: [
          {
            conversation_id: 'conv-1',
            role: 'assistant',
            content: 'Start with foundational knowledge cards.',
            created_at: '2026-02-10T07:00:00.000Z'
          },
          {
            conversation_id: 'conv-1',
            role: 'user',
            content: 'Let us define short, medium, and long memory horizons.',
            created_at: '2026-02-10T06:59:00.000Z'
          }
        ],
        error: null
      };
    }

    if (sql.includes('FROM knowledge_active_facts')) {
      return {
        data: [
          {
            id: 'fact-short',
            subject_type: 'user',
            subject_id: 'user-123',
            horizon: 'short',
            domain: 'conversation',
            fact_key: 'current_focus',
            fact_value: { focus: 'knowledge foundation' },
            source: 'system',
            confidence: 0.9,
            updated_at: '2026-02-10T10:30:00.000Z'
          },
          {
            id: 'fact-long',
            subject_type: 'shared',
            subject_id: 'global',
            horizon: 'long',
            domain: 'platform',
            fact_key: 'vision',
            fact_value: 'Nexus is an AI operating system.',
            source: 'manual',
            confidence: 0.95,
            updated_at: '2026-02-08T10:30:00.000Z'
          }
        ],
        error: null
      };
    }

    return { data: [], error: null };
  };
}

function buildMockSnapshot(agentId) {
  return {
    version: '2026.02.10',
    agentId,
    agentName: 'Alex',
    agentRole: 'Executive Assistant',
    digest: 'abcd1234efgh5678',
    facts: [
      { label: 'Role', value: 'Executive Assistant' },
      { label: 'Context Preference', value: 'Use business context first' }
    ]
  };
}

test('assembleKnowledgeContext is deterministic and stable', async () => {
  const service = createKnowledgeContextService({
    query: buildMockQuery(),
    buildAssistantCoreSnapshot: buildMockSnapshot,
    normalizeAgentId: (value) => (value === 'main' ? 'executive-assistant' : value || 'executive-assistant')
  });

  const options = {
    userId: 'user-123',
    agentId: 'main',
    conversationId: 'conv-1',
    includeShort: true,
    includeMedium: true,
    includeLong: true,
    maxBlocks: 6
  };

  const first = await service.assembleKnowledgeContext(options);
  const second = await service.assembleKnowledgeContext(options);

  assert.equal(first.resolved.agentId, 'executive-assistant');
  assert.equal(first.contextDigest, second.contextDigest);
  assert.equal(first.contextBlocks.length, 6);
  assert.equal(first.contextBlocks[0].id, 'agent-core');
  assert.equal(first.contextBlocks[1].id, 'user-identity');
  assert.equal(first.horizonUsage.short >= 1, true);
  assert.equal(first.horizonUsage.medium >= 1, true);
  assert.equal(first.horizonUsage.long >= 1, true);
  assert.equal(first.tokenEstimate > 0, true);
  assert.equal(typeof first.systemContext, 'string');
  assert.equal(first.systemContext.includes('Top Active Projects'), true);
});

test('assembleKnowledgeContext respects horizon filters', async () => {
  const service = createKnowledgeContextService({
    query: buildMockQuery(),
    buildAssistantCoreSnapshot: buildMockSnapshot,
    normalizeAgentId: (value) => value || 'executive-assistant'
  });

  const data = await service.assembleKnowledgeContext({
    userId: 'user-123',
    includeShort: true,
    includeMedium: false,
    includeLong: false,
    maxBlocks: 10
  });

  assert.equal(data.contextBlocks.length > 0, true);
  assert.deepEqual(
    new Set(data.contextBlocks.map((block) => block.horizon)),
    new Set(['short'])
  );
  assert.equal(data.horizonUsage.medium, 0);
  assert.equal(data.horizonUsage.long, 0);
  assert.equal(data.horizonUsage.short, data.contextBlocks.length);
});

test('buildContextChips derives project and conversation-aware chips', () => {
  const chips = buildContextChips([
    {
      id: 'active-projects',
      domain: 'execution',
      content: [
        '1. Knowledge foundation [active/high] | Build graph primitives',
        '2. Context API [in_progress/high] | Expose deterministic blocks'
      ].join('\n')
    },
    {
      id: 'conversation-conv-1',
      domain: 'conversation',
      content: [
        'USER: Help me design the first knowledge cards',
        'ASSISTANT: Start with user and agent memory blocks'
      ].join('\n')
    }
  ]);

  assert.equal(chips.length, 4);
  assert.equal(chips.some((chip) => chip.includes('Knowledge foundation')), true);
  assert.equal(chips.some((chip) => chip.includes('Continue this:')), true);
});
