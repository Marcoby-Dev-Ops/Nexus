const DEFAULT_OPENCLAW_API_URL = 'http://127.0.0.1:18790/v1';
const DEFAULT_OPENCLAW_API_KEY = 'sk-openclaw-local';
const DEFAULT_CONTROL_TIMEOUT_MS = 10000;

const CONTROL_RESOURCE_PATHS = {
  agents: ['/v1/agents', '/agents', '/api/agents', '/api/v1/agents'],
  sessions: ['/v1/sessions', '/sessions', '/api/sessions', '/api/v1/sessions'],
  channels: ['/v1/channels', '/channels', '/api/channels', '/api/v1/channels'],
  plugins: ['/v1/plugins', '/plugins', '/api/plugins', '/api/v1/plugins']
};

function normalizeOpenClawBaseUrl(baseUrl) {
  const trimmed = String(baseUrl || '').trim().replace(/\/+$/, '');
  if (!trimmed) return DEFAULT_OPENCLAW_API_URL;
  if (/\/v1$/i.test(trimmed)) return trimmed;
  return `${trimmed}/v1`;
}

function normalizeControlBaseUrl(baseUrl) {
  const trimmed = String(baseUrl || '').trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  return trimmed;
}

function normalizeControlBaseUrls(baseUrls = []) {
  if (!Array.isArray(baseUrls)) return [];
  const unique = new Set();
  for (const rawUrl of baseUrls) {
    const normalized = normalizeControlBaseUrl(rawUrl);
    if (!normalized) continue;
    unique.add(normalized);
  }
  return [...unique];
}

function buildUrl(base, pathName, query) {
  const safeBase = String(base || '').replace(/\/+$/, '');
  const safePath = String(pathName || '').startsWith('/') ? String(pathName) : `/${String(pathName || '')}`;
  const url = new URL(`${safeBase}${safePath}`);
  if (query && typeof query === 'object') {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (item !== undefined && item !== null) {
            url.searchParams.append(key, String(item));
          }
        });
      } else {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

class OpenClawRuntimeAdapter {
  constructor(config = {}) {
    this.id = 'openclaw';
    this.baseUrl = normalizeOpenClawBaseUrl(config.baseUrl || process.env.OPENCLAW_API_URL || DEFAULT_OPENCLAW_API_URL);
    this.apiKey = config.apiKey || process.env.OPENCLAW_API_KEY || DEFAULT_OPENCLAW_API_KEY;
    const defaultControlBases = [
      this.baseUrl.replace(/\/v1$/i, ''),
      this.baseUrl
    ];
    this.controlBaseUrls = normalizeControlBaseUrls(
      config.controlBaseUrls || process.env.OPENCLAW_CONTROL_BASE_URLS?.split(',') || defaultControlBases
    );
  }

  getRuntimeInfo() {
    return {
      id: this.id,
      baseUrl: this.baseUrl,
      chatCompletionsUrl: `${this.baseUrl}/chat/completions`,
      healthUrl: `${this.baseUrl.replace(/\/v1$/, '')}/health`,
      controlBaseUrls: this.controlBaseUrls
    };
  }

  getCapabilities() {
    return {
      chat: true,
      streaming: true,
      tools: true,
      healthCheck: true,
      controlPlane: true,
      supportsAgentHeader: true,
      supportsConversationIsolation: true,
      controlResources: ['agents', 'sessions', 'channels', 'plugins'],
      controlProxy: true
    };
  }

  buildAuthHeaders(extraHeaders = {}) {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
      ...extraHeaders
    };
  }

  async controlPlaneRequest(options = {}) {
    const {
      method = 'GET',
      path = '/',
      query,
      body,
      timeoutMs = DEFAULT_CONTROL_TIMEOUT_MS,
      extraHeaders = {}
    } = options;
    const upperMethod = String(method || 'GET').toUpperCase();
    const safePath = String(path || '/').trim();

    if (!safePath.startsWith('/')) {
      throw new Error('OpenClaw control-plane path must start with "/"');
    }

    if (!this.controlBaseUrls.length) {
      throw new Error('OpenClaw control-plane base URL is not configured');
    }

    let lastError = null;
    for (const baseUrl of this.controlBaseUrls) {
      const requestUrl = buildUrl(baseUrl, safePath, query);
      try {
        const init = {
          method: upperMethod,
          headers: this.buildAuthHeaders(extraHeaders),
          signal: AbortSignal.timeout(Number(timeoutMs) > 0 ? Number(timeoutMs) : DEFAULT_CONTROL_TIMEOUT_MS)
        };
        if (body !== undefined && upperMethod !== 'GET' && upperMethod !== 'HEAD') {
          init.body = JSON.stringify(body);
        }

        const response = await fetch(requestUrl, init);
        if (response.status === 404) {
          lastError = new Error(`Not found at ${requestUrl}`);
          continue;
        }
        return response;
      } catch (error) {
        lastError = error;
      }
    }

    throw new Error(`OpenClaw control-plane request failed: ${lastError?.message || 'Unknown error'}`);
  }

  async listControlResource(resourceName, options = {}) {
    const resource = String(resourceName || '').toLowerCase().trim();
    const candidatePaths = CONTROL_RESOURCE_PATHS[resource];
    if (!candidatePaths || candidatePaths.length === 0) {
      throw new Error(`Unknown OpenClaw control resource: ${resourceName}`);
    }

    let lastError = null;
    for (const candidatePath of candidatePaths) {
      try {
        const response = await this.controlPlaneRequest({
          method: 'GET',
          path: candidatePath,
          query: options.query,
          timeoutMs: options.timeoutMs
        });
        if (response.ok) return response;
        lastError = new Error(`HTTP ${response.status} from ${candidatePath}`);
      } catch (error) {
        lastError = error;
      }
    }

    throw new Error(
      `OpenClaw control-plane resource "${resource}" is unavailable: ${lastError?.message || 'Unknown error'}`
    );
  }

  async getControlPlaneStatus(options = {}) {
    const resources = ['agents', 'sessions', 'channels', 'plugins'];
    const checks = {};

    for (const resource of resources) {
      try {
        const response = await this.listControlResource(resource, options);
        checks[resource] = {
          available: response.ok,
          status: response.status
        };
      } catch (error) {
        checks[resource] = {
          available: false,
          error: error.message
        };
      }
    }

    return {
      available: Object.values(checks).some((entry) => entry.available),
      checks
    };
  }

  async listAgents(options = {}) {
    return this.listControlResource('agents', options);
  }

  async listSessions(options = {}) {
    return this.listControlResource('sessions', options);
  }

  async listChannels(options = {}) {
    return this.listControlResource('channels', options);
  }

  async listPlugins(options = {}) {
    return this.listControlResource('plugins', options);
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
