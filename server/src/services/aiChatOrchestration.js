const INTENT_TYPES = {
  BRAINSTORM: { id: 'brainstorm', name: 'Brainstorm', emoji: '🧠', description: 'Generate ideas, explore possibilities' },
  SOLVE: { id: 'solve', name: 'Solve', emoji: '🛠', description: 'Solve a problem, debug, fix issues' },
  WRITE: { id: 'write', name: 'Write', emoji: '✍️', description: 'Draft content, emails, documents' },
  DECIDE: { id: 'decide', name: 'Decide', emoji: '📊', description: 'Make decisions, analyze options' },
  LEARN: { id: 'learn', name: 'Learn', emoji: '📚', description: 'Learn, research, understand concepts' }
};

const PHASES = {
  DISCOVERY: 'discovery',
  SYNTHESIS: 'synthesis',
  DECISION: 'decision',
  EXECUTION: 'execution'
};

const PHASE_PROGRESS = {
  [PHASES.DISCOVERY]: 25,
  [PHASES.SYNTHESIS]: 50,
  [PHASES.DECISION]: 75,
  [PHASES.EXECUTION]: 100
};

function getLastUserMessage(messages = []) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role === 'user' && typeof message.content === 'string') {
      return message.content;
    }
  }
  return '';
}

function detectIntent(messages = []) {
  const lastMessage = getLastUserMessage(messages).toLowerCase();

  if (/(brainstorm|ideas?|creative|possibilities)/.test(lastMessage)) return INTENT_TYPES.BRAINSTORM;
  if (/(solve|problem|fix|debug|issue)/.test(lastMessage)) return INTENT_TYPES.SOLVE;
  if (/(write|draft|email|document|copy)/.test(lastMessage)) return INTENT_TYPES.WRITE;
  if (/(decide|choose|option|tradeoff|analysis)/.test(lastMessage)) return INTENT_TYPES.DECIDE;
  if (/(learn|research|understand|explain|teach)/.test(lastMessage)) return INTENT_TYPES.LEARN;

  return INTENT_TYPES.BRAINSTORM;
}

function determinePhase(messages = []) {
  const userAndAssistantMessages = messages.filter((message) => message?.role === 'user' || message?.role === 'assistant');
  const messageCount = userAndAssistantMessages.length;

  if (messageCount <= 2) return PHASES.DISCOVERY;
  if (messageCount <= 4) return PHASES.SYNTHESIS;
  if (messageCount <= 6) return PHASES.DECISION;
  return PHASES.EXECUTION;
}

function buildModelWayMetadata(intent, phase, conversationId) {
  return {
    intent: {
      id: intent.id,
      name: intent.name,
      emoji: intent.emoji,
      description: intent.description
    },
    phase: {
      id: phase,
      name: phase.charAt(0).toUpperCase() + phase.slice(1),
      progress: PHASE_PROGRESS[phase] || 0
    },
    conversationId,
    timestamp: new Date().toISOString()
  };
}

function shouldRefuseDirectExecutionInDiscovery(phase, lastUserMessage) {
  if (phase !== PHASES.DISCOVERY) return false;
  if (!lastUserMessage || typeof lastUserMessage !== 'string') return false;

  const normalized = lastUserMessage.toLowerCase();
  const directExecutionPattern = /\b(just|simply|only)?\s*(write|generate|build|create|give)\s+(the\s+)?(code|implementation|solution)\b/;
  const antiDiscoveryPattern = /\b(don['’]?t ask|no questions|skip discovery|just do it)\b/;

  return directExecutionPattern.test(normalized) || antiDiscoveryPattern.test(normalized);
}

function buildDiscoveryRefusalMessage() {
  return [
    'We are still in Discovery, so I should not jump straight to implementation yet.',
    'I can write the solution next, but first I need one clarifying input to avoid rework.',
    'What exact outcome should this deliver, and what constraints (stack, timeline, non-negotiables) must be respected?'
  ].join(' ');
}

function buildOpenClawMessages(messages = [], contextSystemMessage = null) {
  const userMessages = messages.filter((message) => message && message.role !== 'system');

  if (!contextSystemMessage) return userMessages;
  return [{ role: 'system', content: contextSystemMessage }, ...userMessages];
}

module.exports = {
  INTENT_TYPES,
  PHASES,
  buildDiscoveryRefusalMessage,
  buildModelWayMetadata,
  buildOpenClawMessages,
  detectIntent,
  determinePhase,
  getLastUserMessage,
  shouldRefuseDirectExecutionInDiscovery
};
