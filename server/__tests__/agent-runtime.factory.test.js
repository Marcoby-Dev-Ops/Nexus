const test = require('node:test');
const assert = require('node:assert/strict');

const { createAgentRuntime, getAgentRuntime } = require('../src/services/agentRuntime');

test('createAgentRuntime defaults to OpenClaw', () => {
  const runtime = createAgentRuntime({
    openclaw: {
      baseUrl: 'http://localhost:18789/v1',
      apiKey: 'sk-test'
    }
  });

  const info = runtime.getRuntimeInfo();
  assert.equal(info.id, 'openclaw');
  assert.equal(info.chatCompletionsUrl, 'http://localhost:18789/v1/chat/completions');
});

test('createAgentRuntime accepts OpenClaw aliases', () => {
  const runtime = createAgentRuntime({
    runtime: 'open-claw',
    openclaw: {
      baseUrl: 'http://example.local/v1',
      apiKey: 'sk-test'
    }
  });

  assert.equal(runtime.getRuntimeInfo().id, 'openclaw');
});

test('createAgentRuntime falls back to OpenClaw for unknown values', () => {
  const runtime = createAgentRuntime({
    runtime: 'future-engine',
    openclaw: {
      baseUrl: 'http://fallback.local/v1',
      apiKey: 'sk-test'
    }
  });

  const info = runtime.getRuntimeInfo();
  assert.equal(info.id, 'openclaw');
  assert.equal(info.baseUrl, 'http://fallback.local/v1');
});

test('createAgentRuntime selects mock runtime explicitly', () => {
  const runtime = createAgentRuntime({
    runtime: 'mock',
    mock: {
      baseUrl: 'mock://verify'
    }
  });

  const info = runtime.getRuntimeInfo();
  assert.equal(info.id, 'mock');
  assert.equal(info.baseUrl, 'mock://verify');
});

test('getAgentRuntime supports reset for deterministic initialization', () => {
  const runtimeA = getAgentRuntime({
    reset: true,
    openclaw: {
      baseUrl: 'http://one.local/v1',
      apiKey: 'sk-test'
    }
  });

  const runtimeB = getAgentRuntime();
  assert.equal(runtimeA, runtimeB);

  const runtimeC = getAgentRuntime({
    reset: true,
    openclaw: {
      baseUrl: 'http://two.local/v1',
      apiKey: 'sk-test'
    }
  });

  assert.notEqual(runtimeA, runtimeC);
  assert.equal(runtimeC.getRuntimeInfo().baseUrl, 'http://two.local/v1');
});

test('mock runtime is blocked in production unless explicitly allowed', () => {
  const prevNodeEnv = process.env.NODE_ENV;
  const prevAllowMock = process.env.ALLOW_MOCK_RUNTIME;

  process.env.NODE_ENV = 'production';
  process.env.ALLOW_MOCK_RUNTIME = 'false';

  const runtime = createAgentRuntime({
    runtime: 'mock',
    openclaw: {
      baseUrl: 'http://prod-openclaw.local/v1',
      apiKey: 'sk-test'
    }
  });

  assert.equal(runtime.getRuntimeInfo().id, 'openclaw');

  process.env.NODE_ENV = prevNodeEnv;
  if (prevAllowMock === undefined) {
    delete process.env.ALLOW_MOCK_RUNTIME;
  } else {
    process.env.ALLOW_MOCK_RUNTIME = prevAllowMock;
  }
});
