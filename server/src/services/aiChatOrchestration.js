const INTENT_TYPES = {
  BRAINSTORM: { id: 'brainstorm', name: 'Brainstorm', emoji: '🧠', description: 'Generate ideas, explore possibilities' },
  SOLVE: { id: 'solve', name: 'Solve', emoji: '🛠', description: 'Solve a problem, debug, fix issues' },
  WRITE: { id: 'write', name: 'Write', emoji: '✍️', description: 'Draft content, emails, documents' },
  DECIDE: { id: 'decide', name: 'Decide', emoji: '📊', description: 'Make decisions, analyze options' },
  LEARN: { id: 'learn', name: 'Learn', emoji: '📚', description: 'Learn, research, understand concepts' },
  SWITCH: { id: 'switch', name: 'Switch', emoji: '🔄', description: 'Switch to a different conversation' }
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

const EMAIL_ADDRESS_REGEX = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const EMAIL_CONNECT_CONTEXT_REGEX = /(connect|integration|oauth|imap|inbox|mx\s*lookup|email\s+provider|google\s+workspace|microsoft\s*365|email\s+address)/i;
const ASSISTANT_EMAIL_PROMPT_REGEX = /(what (is|['’]?s)? (the )?email|email address.*connect|connect.*email|which email|oauth|provider|google workspace|microsoft 365)/i;
const SHORT_AFFIRMATIVE_REPLIES = new Set([
  'yes',
  'y',
  'yeah',
  'yep',
  'ok',
  'okay',
  'sure',
  'go ahead',
  'proceed',
  'continue',
  'do it',
  "let's do it",
  'lets do it',
  'sounds good',
  'alright',
  'all right',
  'confirm'
]);

function getLastUserMessage(messages = []) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role === 'user' && typeof message.content === 'string') {
      return message.content;
    }
  }
  return '';
}

function getLastUserMessageIndex(messages = []) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role === 'user' && typeof message.content === 'string') {
      return index;
    }
  }
  return -1;
}

function hasEmailOnlyContent(message = '') {
  const raw = String(message || '').trim().toLowerCase();
  if (!raw) return false;
  const emailMatch = raw.match(EMAIL_ADDRESS_REGEX);
  if (!emailMatch) return false;

  const stripped = raw.replace(emailMatch[0], '').replace(/[\s.,;:!?()[\]{}"'`-]/g, '');
  return stripped.length === 0;
}

function normalizeShortReply(message = '') {
  return String(message || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function isShortAffirmativeReply(message = '') {
  const normalized = normalizeShortReply(message);
  if (!normalized) return false;
  if (normalized.length > 32) return false;
  return SHORT_AFFIRMATIVE_REPLIES.has(normalized);
}

function isEmailConnectionFollowUp(messages = [], lastUserMessage = '') {
  if (!hasEmailOnlyContent(lastUserMessage)) return false;

  const lastUserIndex = getLastUserMessageIndex(messages);
  if (lastUserIndex <= 0) return false;

  const startIndex = Math.max(0, lastUserIndex - 8);
  const recentMessages = messages.slice(startIndex, lastUserIndex);

  for (const message of recentMessages) {
    const content = String(message?.content || '').toLowerCase();
    if (!content) continue;

    if (message?.role === 'user' && EMAIL_CONNECT_CONTEXT_REGEX.test(content)) {
      return true;
    }

    if (message?.role === 'assistant' && ASSISTANT_EMAIL_PROMPT_REGEX.test(content)) {
      return true;
    }
  }

  return false;
}

function isEmailConnectConfirmationFollowUp(messages = [], lastUserMessage = '') {
  if (!isShortAffirmativeReply(lastUserMessage)) return false;

  const lastUserIndex = getLastUserMessageIndex(messages);
  if (lastUserIndex <= 0) return false;

  const startIndex = Math.max(0, lastUserIndex - 8);
  const recentMessages = messages.slice(startIndex, lastUserIndex);

  for (const message of recentMessages) {
    const content = String(message?.content || '').toLowerCase();
    if (!content) continue;

    if (EMAIL_CONNECT_CONTEXT_REGEX.test(content) || ASSISTANT_EMAIL_PROMPT_REGEX.test(content)) {
      return true;
    }
  }

  return false;
}

function detectIntent(messages = []) {
  const lastMessageRaw = getLastUserMessage(messages);
  const lastMessage = lastMessageRaw.toLowerCase();

  if (/(continue this:|switch to:)/i.test(lastMessage)) return INTENT_TYPES.SWITCH;

  if (/(connect|integration|oauth|imap|inbox|mx\s*lookup|email\s+provider|google\s+workspace|microsoft\s*365)/.test(lastMessage)
    || isEmailConnectionFollowUp(messages, lastMessageRaw)
    || isEmailConnectConfirmationFollowUp(messages, lastMessageRaw)
  ) {
    return INTENT_TYPES.SOLVE;
  }
  if (/(brainstorm|ideas?|creative|possibilities)/.test(lastMessage)) return INTENT_TYPES.BRAINSTORM;
  if (/(solve|problem|fix|debug|issue)/.test(lastMessage)) return INTENT_TYPES.SOLVE;
  if (/(write|draft|compose|rewrite|copy|document)/.test(lastMessage)) return INTENT_TYPES.WRITE;
  if (/(decide|choose|option|tradeoff|analysis)/.test(lastMessage)) return INTENT_TYPES.DECIDE;
  if (/(learn|research|understand|explain|teach)/.test(lastMessage)) return INTENT_TYPES.LEARN;

  return INTENT_TYPES.BRAINSTORM;
}

/**
 * Resolves a topic string to a conversation ID.
 * Matches by title (exact or partial)
 */
async function resolveTopicToConversationId(userId, topic, queryFn) {
  // Use global flag /g to strip multiple prefixes if they somehow accumulated
  let normalizedTopic = topic.replace(/continue this:|switch to:/gi, '').trim();
  if (!normalizedTopic) return null;

  // Search by exact title first, then ILIKE
  const result = await queryFn(
    `SELECT id FROM ai_conversations 
     WHERE user_id = $1 AND (title = $2 OR title ILIKE $3) 
     ORDER BY updated_at DESC LIMIT 1`,
    [userId, normalizedTopic, `%${normalizedTopic}%`]
  );

  return result.data?.[0]?.id || null;
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
  isEmailConnectConfirmationFollowUp,
  isEmailConnectionFollowUp,
  shouldRefuseDirectExecutionInDiscovery,
  resolveTopicToConversationId
};
