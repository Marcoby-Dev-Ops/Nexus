const test = require('node:test');
const assert = require('node:assert/strict');

const { assertRuntimeContract, REQUIRED_RUNTIME_METHODS } = require('../src/services/agentRuntime/contract');
const { OpenClawRuntimeAdapter } = require('../src/services/agentRuntime/openclawRuntimeAdapter');
const { MockRuntimeAdapter } = require('../src/services/agentRuntime/mockRuntimeAdapter');

test('runtime contract requires expected methods', () => {
  const badRuntime = {
    getRuntimeInfo: () => ({})
  };

  assert.throws(
    () => assertRuntimeContract(badRuntime),
    /missing method getCapabilities\(\)/
  );

  assert.ok(Array.isArray(REQUIRED_RUNTIME_METHODS));
  assert.ok(REQUIRED_RUNTIME_METHODS.includes('chatCompletions'));
});

test('OpenClaw adapter satisfies runtime contract and capabilities shape', () => {
  const runtime = new OpenClawRuntimeAdapter({
    baseUrl: 'http://localhost:18789/v1',
    apiKey: 'sk-test'
  });

  assert.doesNotThrow(() => assertRuntimeContract(runtime));
  const capabilities = runtime.getCapabilities();

  assert.equal(capabilities.chat, true);
  assert.equal(capabilities.streaming, true);
  assert.equal(capabilities.tools, true);
});

test('OpenClaw adapter normalizes base URL to include /v1', () => {
  const runtime = new OpenClawRuntimeAdapter({
    baseUrl: 'http://localhost:18789',
    apiKey: 'sk-test'
  });

  const info = runtime.getRuntimeInfo();
  assert.equal(info.baseUrl, 'http://localhost:18789/v1');
  assert.equal(info.chatCompletionsUrl, 'http://localhost:18789/v1/chat/completions');
  assert.equal(info.healthUrl, 'http://localhost:18789/health');
});

test('Mock adapter provides deterministic non-stream completion', async () => {
  const runtime = new MockRuntimeAdapter({ defaultModel: 'mock-v1' });
  const response = await runtime.chatCompletions({
    stream: false,
    model: 'mock-v1',
    messages: [{ role: 'user', content: 'verify mock runtime' }],
    tools: ['web_search']
  });

  assert.equal(response.ok, true);
  assert.equal(response.headers.get('content-type'), 'application/json');

  const payload = await response.json();
  assert.equal(payload.model, 'mock-v1');
  assert.match(payload.choices[0].message.content, /MOCK_RESPONSE: verify mock runtime/);
  assert.match(payload.choices[0].message.content, /tools:web_search/);
});

test('Mock adapter provides stream-shaped completion payload', async () => {
  const runtime = new MockRuntimeAdapter();
  const response = await runtime.chatCompletions({
    stream: true,
    messages: [{ role: 'user', content: 'stream please' }]
  });

  assert.equal(response.ok, true);
  assert.equal(response.headers.get('content-type'), 'text/event-stream');

  const text = await response.text();
  assert.match(text, /data: \{/);
  assert.match(text, /MOCK_RESPONSE: stream please/);
  assert.match(text, /data: \[DONE\]/);
});
