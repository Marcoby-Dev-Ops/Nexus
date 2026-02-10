const crypto = require('crypto');
const { getAgentConfig, listAgents, normalizeAgentId } = require('./agentCatalog');

const ASSISTANT_CORE_VERSION = process.env.ASSISTANT_CORE_VERSION || '2026.02.10';
const ASSISTANT_CORE_UPDATED_AT = process.env.ASSISTANT_CORE_UPDATED_AT || '2026-02-10T00:00:00.000Z';

function buildAssistantFacts(agentId) {
  const agent = getAgentConfig(agentId);
  return [
    {
      id: 'core-role',
      label: 'Role',
      value: `${agent.name}, ${agent.role}`,
      source: 'Agent runtime catalog',
      confidence: 'high',
      updatedAt: ASSISTANT_CORE_UPDATED_AT
    },
    {
      id: 'core-expertise',
      label: 'Expertise',
      value: agent.expertise,
      source: 'Agent runtime catalog',
      confidence: 'high',
      updatedAt: ASSISTANT_CORE_UPDATED_AT
    },
    {
      id: 'core-style',
      label: 'Response Style',
      value: agent.style,
      source: 'Agent runtime catalog',
      confidence: 'high',
      updatedAt: ASSISTANT_CORE_UPDATED_AT
    },
    {
      id: 'core-constraint',
      label: 'Safety Constraint',
      value: 'No silent state mutation; preserve auditability',
      source: 'Server/runtime guardrails',
      confidence: 'high',
      updatedAt: ASSISTANT_CORE_UPDATED_AT
    },
    {
      id: 'core-context',
      label: 'Context Preference',
      value: 'Use business and user context before recommendations',
      source: 'Prompt orchestration',
      confidence: 'high',
      updatedAt: ASSISTANT_CORE_UPDATED_AT
    }
  ];
}

function buildAssistantCoreSnapshot(agentId) {
  const normalizedAgentId = normalizeAgentId(agentId);
  const agent = getAgentConfig(normalizedAgentId);
  const facts = buildAssistantFacts(normalizedAgentId);
  const digest = crypto
    .createHash('sha256')
    .update(JSON.stringify({ version: ASSISTANT_CORE_VERSION, agentId: normalizedAgentId, facts }))
    .digest('hex')
    .slice(0, 16);

  return {
    version: ASSISTANT_CORE_VERSION,
    agentId: normalizedAgentId,
    agentName: agent.name,
    agentRole: agent.role,
    digest,
    facts,
    availableAgents: listAgents()
  };
}

module.exports = {
  buildAssistantCoreSnapshot
};
