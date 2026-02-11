const DEFAULT_OPENCLAW_API_URL = 'http://127.0.0.1:18790/v1';
const DEFAULT_OPENCLAW_API_KEY = 'sk-openclaw-local';

function normalizeOpenClawBaseUrl(baseUrl) {
  const trimmed = String(baseUrl || '').trim().replace(/\/+$/, '');
  if (!trimmed) return DEFAULT_OPENCLAW_API_URL;
  if (/\/v1$/i.test(trimmed)) return trimmed;
  return `${trimmed}/v1`;
}

class OpenClawRuntimeAdapter {
  constructor(config = {}) {
    this.id = 'openclaw';
    this.baseUrl = normalizeOpenClawBaseUrl(config.baseUrl || process.env.OPENCLAW_API_URL || DEFAULT_OPENCLAW_API_URL);
    this.apiKey = config.apiKey || process.env.OPENCLAW_API_KEY || DEFAULT_OPENCLAW_API_KEY;
  }

  getRuntimeInfo() {
    return {
      id: this.id,
      baseUrl: this.baseUrl,
      chatCompletionsUrl: `${this.baseUrl}/chat/completions`,
      healthUrl: `${this.baseUrl.replace(/\/v1$/, '')}/health`
    };
  }

  getCapabilities() {
    return {
      chat: true,
      streaming: true,
      tools: true,
      healthCheck: true,
      controlPlane: false,
      supportsAgentHeader: true,
      supportsConversationIsolation: true
    };
  }

  buildAuthHeaders(extraHeaders = {}) {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
      ...extraHeaders
    };
  }

  async chatCompletions(payload, options = {}) {
    const runtimeInfo = this.getRuntimeInfo();
    const extraHeaders = {};

    if (options.agentId) {
      extraHeaders['x-openclaw-agent-id'] = options.agentId;
    }

    try {
      return await fetch(runtimeInfo.chatCompletionsUrl, {
        method: 'POST',
        headers: this.buildAuthHeaders(extraHeaders),
        body: JSON.stringify(payload)
      });
    } catch (error) {
      throw new Error(`OpenClaw runtime request failed: ${error.message}`);
    }
  }

  async healthCheck(options = {}) {
    const runtimeInfo = this.getRuntimeInfo();
    const timeoutMs = Number(options.timeoutMs) > 0 ? Number(options.timeoutMs) : 5000;

    try {
      return await fetch(runtimeInfo.healthUrl, {
        method: 'GET',
        headers: this.buildAuthHeaders(),
        signal: AbortSignal.timeout(timeoutMs)
      });
    } catch (error) {
      throw new Error(`OpenClaw runtime health check failed: ${error.message}`);
    }
  }
}

module.exports = {
  OpenClawRuntimeAdapter
};
