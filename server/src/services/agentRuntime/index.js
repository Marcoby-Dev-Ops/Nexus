const { logger } = require('../../utils/logger');
const { assertRuntimeContract } = require('./contract');
const { OpenClawRuntimeAdapter } = require('./openclawRuntimeAdapter');
const { MockRuntimeAdapter } = require('./mockRuntimeAdapter');

const OPENCLAW_RUNTIME_ALIASES = new Set(['openclaw', 'open-claw', 'open_claw']);
const MOCK_RUNTIME_ALIASES = new Set(['mock', 'test', 'echo', 'simulated']);
let runtimeSingleton = null;

function normalizeRuntimeName(runtimeName) {
  if (!runtimeName) return 'openclaw';
  return String(runtimeName).trim().toLowerCase();
}

function createAgentRuntime(options = {}) {
  const requestedRuntime = normalizeRuntimeName(options.runtime || process.env.AGENT_RUNTIME || 'openclaw');
  const disallowMockRuntime = process.env.NODE_ENV === 'production' && process.env.ALLOW_MOCK_RUNTIME !== 'true';

  if (MOCK_RUNTIME_ALIASES.has(requestedRuntime)) {
    if (disallowMockRuntime) {
      logger.warn('Mock runtime requested in production; forcing OpenClaw runtime', { requestedRuntime });
      return assertRuntimeContract(new OpenClawRuntimeAdapter(options.openclaw || {}));
    }
    return assertRuntimeContract(new MockRuntimeAdapter(options.mock || {}));
  }

  if (OPENCLAW_RUNTIME_ALIASES.has(requestedRuntime)) {
    return assertRuntimeContract(new OpenClawRuntimeAdapter(options.openclaw || {}));
  }

  logger.warn('Unknown AGENT_RUNTIME value, defaulting to OpenClaw', { requestedRuntime });
  return assertRuntimeContract(new OpenClawRuntimeAdapter(options.openclaw || {}));
}

function getAgentRuntime(options = {}) {
  if (!runtimeSingleton || options.reset === true) {
    runtimeSingleton = createAgentRuntime(options);
  }
  return runtimeSingleton;
}

module.exports = {
  createAgentRuntime,
  getAgentRuntime
};
