class MockRuntimeAdapter {
  constructor(config = {}) {
    this.id = 'mock';
    this.baseUrl = config.baseUrl || 'mock://agent-runtime';
    this.defaultModel = config.defaultModel || 'mock-runtime-1';
  }

  getRuntimeInfo() {
    return {
      id: this.id,
      baseUrl: this.baseUrl,
      chatCompletionsUrl: `${this.baseUrl}/chat/completions`,
      healthUrl: `${this.baseUrl}/health`
    };
  }

  getCapabilities() {
    return {
      chat: true,
      streaming: true,
      tools: true,
      healthCheck: true,
      controlPlane: true,
      supportsAgentHeader: false,
      supportsConversationIsolation: true,
      controlResources: ['agents', 'sessions', 'channels', 'plugins'],
      controlProxy: true
    };
  }

  buildControlPayload(resource, query = {}) {
    return {
      resource,
      items: [],
      query,
      runtime: this.id
    };
  }

  async getControlPlaneStatus() {
    return {
      available: true,
      checks: {
        agents: { available: true, status: 200 },
        sessions: { available: true, status: 200 },
        channels: { available: true, status: 200 },
        plugins: { available: true, status: 200 }
      }
    };
  }

  async listAgents(options = {}) {
    return new Response(JSON.stringify(this.buildControlPayload('agents', options.query)), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  }

  async listSessions(options = {}) {
    return new Response(JSON.stringify(this.buildControlPayload('sessions', options.query)), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  }

  async listChannels(options = {}) {
    return new Response(JSON.stringify(this.buildControlPayload('channels', options.query)), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  }

  async listPlugins(options = {}) {
    return new Response(JSON.stringify(this.buildControlPayload('plugins', options.query)), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  }

  async controlPlaneRequest(options = {}) {
    const payload = {
      method: String(options.method || 'GET').toUpperCase(),
      path: options.path || '/',
      query: options.query || {},
      body: options.body || null,
      runtime: this.id
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        'content-type': 'application/json'
      }
    });
  }

  buildCompletionContent(payload = {}) {
    const messages = Array.isArray(payload.messages) ? payload.messages : [];
    const lastUser = [...messages].reverse().find((message) => message?.role === 'user');
    const userText = typeof lastUser?.content === 'string' ? lastUser.content.trim() : 'Hello from Nexus';
    const toolSuffix = Array.isArray(payload.tools) && payload.tools.length > 0
      ? ` [tools:${payload.tools.join(',')}]`
      : '';

    return `MOCK_RESPONSE: ${userText}${toolSuffix}`;
  }

  buildJsonCompletion(payload = {}) {
    const content = this.buildCompletionContent(payload);
    return {
      id: `mock-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: payload.model || this.defaultModel,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content
          },
          finish_reason: 'stop'
        }
      ],
      usage: {
        prompt_tokens: Math.ceil(JSON.stringify(payload.messages || []).length / 4),
        completion_tokens: Math.ceil(content.length / 4),
        total_tokens: Math.ceil((JSON.stringify(payload.messages || []).length + content.length) / 4)
      }
    };
  }

  buildStreamCompletion(payload = {}) {
    const content = this.buildCompletionContent(payload);
    const chunk = {
      id: `mock-stream-${Date.now()}`,
      object: 'chat.completion.chunk',
      created: Math.floor(Date.now() / 1000),
      model: payload.model || this.defaultModel,
      choices: [
        {
          index: 0,
          delta: {
            content
          },
          finish_reason: null
        }
      ]
    };

    return [
      `data: ${JSON.stringify(chunk)}\n\n`,
      'data: [DONE]\n\n'
    ].join('');
  }

  async chatCompletions(payload = {}) {
    if (payload.stream) {
      return new Response(this.buildStreamCompletion(payload), {
        status: 200,
        headers: {
          'content-type': 'text/event-stream'
        }
      });
    }

    return new Response(JSON.stringify(this.buildJsonCompletion(payload)), {
      status: 200,
      headers: {
        'content-type': 'application/json'
      }
    });
  }

  async healthCheck() {
    return new Response(JSON.stringify({ status: 'ok', runtime: this.id }), {
      status: 200,
      headers: {
        'content-type': 'application/json'
      }
    });
  }
}

module.exports = {
  MockRuntimeAdapter
};
