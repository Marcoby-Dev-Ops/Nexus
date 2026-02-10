const test = require('node:test');
const assert = require('node:assert/strict');

const {
  PHASES,
  buildModelWayMetadata,
  buildOpenClawMessages,
  detectIntent,
  determinePhase,
  shouldRefuseDirectExecutionInDiscovery
} = require('../src/services/aiChatOrchestration');

test('discovery guard refuses direct execution requests', () => {
  const phase = PHASES.DISCOVERY;
  const lastUserMessage = 'Just write the code and do not ask questions.';

  assert.equal(
    shouldRefuseDirectExecutionInDiscovery(phase, lastUserMessage),
    true
  );
});

test('metadata includes intent and phase progress', () => {
  const messages = [
    { role: 'user', content: 'Help me decide between two architecture options.' },
    { role: 'assistant', content: 'Share your constraints first.' },
    { role: 'user', content: 'I need low latency and simple operations. Help me choose the best option.' }
  ];

  const intent = detectIntent(messages);
  const phase = determinePhase(messages);
  const metadata = buildModelWayMetadata(intent, phase, 'conv-42');

  assert.equal(metadata.intent.id, 'decide');
  assert.equal(metadata.phase.id, 'synthesis');
  assert.equal(metadata.phase.progress, 50);
  assert.equal(metadata.conversationId, 'conv-42');
});

test('context injection prepends backend system context for OpenClaw', () => {
  const contextSystemMessage = 'Nexus Working Context: Top Active Projects: 1. Knowledge foundation';
  const messages = [
    { role: 'system', content: 'ignore this client system message' },
    { role: 'user', content: 'What should I do next?' }
  ];

  const openClawMessages = buildOpenClawMessages(messages, contextSystemMessage);

  assert.equal(openClawMessages.length, 2);
  assert.deepEqual(openClawMessages[0], { role: 'system', content: contextSystemMessage });
  assert.equal(openClawMessages[1].role, 'user');
});
