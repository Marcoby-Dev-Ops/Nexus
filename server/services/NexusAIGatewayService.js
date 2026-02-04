const { logger } = require('../src/utils/logger');
const { performance } = require('perf_hooks');
const creditService = require('./CreditService');
require('../loadEnv');

// System user ID for onboarding and system-level operations
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001';

/**
 * JavaScript version of NexusAIGatewayService for server-side use
 * Integrates real AI providers: OpenAI, OpenRouter, and Local
 */
class NexusAIGatewayService {
  constructor(config = {}) {
    this.config = {
      enableOpenAI: true,
      enableOpenRouter: true,
      enableLocal: true,
      maxRetries: 3,
      retryDelayMs: 1000,
      enableUsageTracking: true,
      enableCircuitBreaker: true,
      ...config,
    };
    
    this.providers = new Map();
    this.usageRecords = [];
    this.circuitBreaker = new Map();
    
    this.initializeProviders();
  }

  /**
   * Initialize available providers based on configuration
   */
  initializeProviders() {
    // Check OpenClaw provider
    if (this.config.enableOpenClaw !== false) { // Enable by default if not explicitly disabled
      try {
        const openclawUrl = process.env.OPENCLAW_API_URL || 'http://localhost:18789/v1';
        const openclawApiKey = process.env.OPENCLAW_API_KEY || 'sk-openclaw-local';
        this.providers.set('openclaw', new OpenClawProvider(openclawUrl, openclawApiKey));
        logger.info('OpenClaw provider initialized');
      } catch (error) {
        logger.warn(`Failed to initialize OpenClaw provider: ${error.message}`);
      }
    }

    // Check OpenAI provider
    if (this.config.enableOpenAI) {
      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (openaiApiKey && openaiApiKey !== 'your_openai_key_here') {
        try {
          this.providers.set('openai', new OpenAIProvider(openaiApiKey));
          logger.info('OpenAI provider initialized');
        } catch (error) {
          logger.warn(`Failed to initialize OpenAI provider: ${error.message}`);
        }
      } else {
        logger.info('OpenAI provider disabled - API key not configured');
      }
    }

    // Check OpenRouter provider
    if (this.config.enableOpenRouter) {
      const openrouterApiKey = process.env.OPENROUTER_API_KEY;
      if (openrouterApiKey && openrouterApiKey !== 'your_openrouter_api_key_here') {
        try {
          this.providers.set('openrouter', new OpenRouterProvider(openrouterApiKey));
          logger.info('OpenRouter provider initialized');
        } catch (error) {
          logger.warn(`Failed to initialize OpenRouter provider: ${error.message}`);
        }
      } else {
        logger.info('OpenRouter provider disabled - API key not configured');
      }
    }

    // Check Local provider
    if (this.config.enableLocal) {
      try {
        const localUrl = process.env.LOCAL_OPENAI_URL || 'http://localhost:8000';
        const localApiKey = process.env.LOCAL_API_KEY || 'sk-local';
        this.providers.set('local', new LocalProvider(localUrl, localApiKey));
        logger.info('Local provider initialized');
      } catch (error) {
        logger.warn(`Failed to initialize Local provider: ${error.message}`);
      }
    }

    // Log summary of available providers
    const availableProviders = Array.from(this.providers.keys());
    if (availableProviders.length === 0) {
      logger.warn('No AI providers are available. Please configure at least one provider.');
    } else {
      logger.info(`Available providers: ${availableProviders.join(', ')}`);
    }
  }

  /**
   * Chat with AI using intelligent model routing
   */
  async chat(request) {
    try {
      logger.info('Chat request received:', {
        role: request.role || 'chat',
        sensitivity: request.sensitivity || 'internal',
        tenantId: request.tenantId,
        messageCount: request.messages?.length || 0
      });

      // Select the best provider based on request requirements
      const provider = this.selectProvider(request);
      if (!provider) {
        return {
          success: false,
          error: 'No suitable AI provider available'
        };
      }

      // Check credit availability and get plan features
      const effectiveUserId = request.userId && request.userId !== 'onboarding' ? request.userId : SYSTEM_USER_ID;
      const userStatus = await creditService.getUserStatus(effectiveUserId);
      
      // Credit Check (unless it's system user or unlimited)
      const hasCredits = userStatus?.can_run_inference || effectiveUserId === SYSTEM_USER_ID;
      
      if (!hasCredits) {
        logger.warn(`Credit check failed for user ${effectiveUserId}`);
        return {
          success: false,
          error: 'Insufficient credits. Please upgrade your plan or top up your wallet.'
        };
      }

      // Determine model based on plan tier
      const tier = userStatus?.subscription?.features?.tier || 'basic';
      const selectedModel = this.selectModel(request.role || 'chat', provider.name, tier);

      // Prepare the LLM request
      const llmRequest = {
        task: 'chat',
        role: request.role || 'chat',
        input: this.formatChatInput(request.messages),
        messages: request.messages,
        system: request.system,
        tools: request.tools,
        json: request.json,
        tenantId: request.tenantId,
        sensitivity: request.sensitivity || 'internal',
        budgetCents: request.budgetCents,
        latencyTargetMs: request.latencyTargetMs,
        model: selectedModel,
        userId: effectiveUserId,
        orgId: request.orgId || null
      };

      // Call the provider
      const response = await provider.call(llmRequest);

      // Record usage for monitoring
      await this.recordUsage(llmRequest, response, true);

      return {
        success: true,
        data: {
          message: response.output,
          model: response.model,
          provider: response.provider,
          costCents: response.costCents,
          tokens: response.tokens,
          latencyMs: response.latencyMs,
        },
      };
    } catch (error) {
      logger.error('Chat request failed:', error);
      
      // Record failed usage if we have a request context
      // Note: we can't record here if provider fails before returning initial structure
       // Fixed: llmRequest and response might be undefined if error occurs early
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async chatStream(request) {
    logger.info('Chat stream request received');
    const provider = this.selectProvider(request);
    if (!provider) throw new Error('No provider available');

    // Check credits
    const effectiveUserId = request.userId && request.userId !== 'onboarding' ? request.userId : SYSTEM_USER_ID;
    const hasCredits = await creditService.checkAvailability(effectiveUserId);
    if (!hasCredits) throw new Error('Insufficient credits');

    // Determine model
    const userStatus = await creditService.getUserStatus(effectiveUserId);
    const tier = userStatus?.subscription?.features?.tier || 'basic';
    const selectedModel = this.selectModel(request.role || 'chat', provider.name, tier);

    const llmRequest = {
      ...request,
      model: selectedModel,
      stream: true,
      userId: effectiveUserId
    };

    // Providers must implement callStream generator
    if (!provider.callStream) {
       // Fallback to non-stream if not implemented
       const response = await provider.call(llmRequest);
       yield { content: response.output };
       return;
    }

    // Proxy the stream
    const stream = provider.callStream(llmRequest);
    let fullContent = '';
    
    for await (const chunk of stream) {
        if (chunk.content) fullContent += chunk.content;
        yield chunk;
    }

    // Record usage after stream completes (estimated based on length)
    // 1 token ~= 4 chars
    const estimatedTokens = Math.ceil(fullContent.length / 4);
    const usage = {
        tokens: { prompt: 0, completion: estimatedTokens }, // Prompt tokens hard to count without tokenizer
        costCents: 0, // Need accurate token count for cost
        model: selectedModel,
        provider: provider.name
    };
    // Calculate cost properly if we can using approximations
    usage.costCents = this.calculateCost(
        { prompt_tokens: 100, completion_tokens: estimatedTokens }, // Dummy prompt token count
        selectedModel
    );

    // Record usage (fire and forget)
    this.recordUsage(llmRequest, usage, true).catch(err => logger.error('Stream usage record failed', err));
  }

  /**
   * Generate embeddings for text
   */
  async generateEmbeddings(request) {
    try {
      logger.info('Embedding request received:', {
        model: request.model,
        tenantId: request.tenantId,
        textLength: request.text?.length || 0
      });

      // Select provider for embeddings (OpenAI is preferred for embeddings)
      const provider = this.selectProviderForEmbeddings(request);
      if (!provider) {
        return {
          success: false,
          error: 'No suitable embedding provider available'
        };
      }

      // Check credit availability
      const effectiveUserId = request.userId && request.userId !== 'onboarding' ? request.userId : SYSTEM_USER_ID;
      const userStatus = await creditService.getUserStatus(effectiveUserId);
      const hasCredits = userStatus?.can_run_inference || effectiveUserId === SYSTEM_USER_ID;

      if (!hasCredits) {
         return { success: false, error: 'Insufficient credits.' };
      }

      const llmRequest = {
        task: 'embed',
        role: 'embed',
        input: request.text,
        tenantId: request.tenantId,
        sensitivity: 'internal',
        model: request.model || 'text-embedding-ada-002',
        userId: request.userId && request.userId !== 'onboarding' ? request.userId : SYSTEM_USER_ID,
        orgId: request.orgId || null
      };

      const response = await provider.call(llmRequest);

      // Record usage for monitoring
      await this.recordUsage(llmRequest, response, true);

      return {
        success: true,
        data: {
          embedding: response.output,
          model: response.model,
          provider: response.provider,
          tokens: response.tokens,
          latencyMs: response.latencyMs,
        },
      };
    } catch (error) {
      logger.error('Embedding generation failed:', error);
      
      // Record failed usage if we have a request context
      if (llmRequest && response) {
        await this.recordUsage(llmRequest, response, false, error.message);
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Select the best provider for the request
   */
  selectProvider(request) {
    // Priority order: OpenClaw > OpenAI > OpenRouter > Local
    const providers = ['openclaw', 'openai', 'openrouter', 'local'];
    
    for (const providerName of providers) {
      const provider = this.providers.get(providerName);
      if (provider && this.isProviderSuitable(providerName, request)) {
        // Add provider name to the provider object for reference
        provider.name = providerName;
        return provider;
      }
    }
    
    return null;
  }

  /**
   * Select provider specifically for embeddings
   */
  selectProviderForEmbeddings(request) {
    // OpenAI is preferred for embeddings
    const openaiProvider = this.providers.get('openai');
    if (openaiProvider) {
      return openaiProvider;
    }
    
    // Fallback to other providers
    return this.selectProvider(request);
  }

  /**
   * Check if provider is suitable for the request
   */
  isProviderSuitable(providerName, request) {
    // Check circuit breaker
    if (this.isCircuitBreakerOpen(providerName)) {
      return false;
    }
    
    // Check budget constraints
    if (request.budgetCents && request.budgetCents < 1) {
      return providerName === 'local'; // Local is free
    }
    
    return true;
  }

  /**
   * Select appropriate model for the role and provider
   */
  selectModel(role, provider, tier = 'basic') {
    // Model Selection Matrix based on Tier/Persona
    const isPremium = tier === 'premium' || tier === 'unlimited';
    
    // Default models (Basic/Standard Tier) - Cost efficient, high speed
    const basicModels = {
      openclaw: 'gpt-4o-mini',
      openai: 'gpt-4o-mini',
      openrouter: 'gpt-4o-mini', 
      local: 'llama2'
    };
    
    // Premium models (Power/Enterprise Tier) - High intelligence, complex reasoning
    const premiumModels = {
      openclaw: 'gpt-4o', // or gemini-pro-1.5
      openai: 'gpt-4o',
      openrouter: 'anthropic/claude-3-5-sonnet',
      local: 'mixtral-8x7b'
    };

    const modelMap = isPremium ? premiumModels : basicModels;
    
    // Specific role overrides if needed (e.g., embed is always the same)
    if (role === 'embed') {
        return provider === 'openai' ? 'text-embedding-3-small' : 'text-embedding-ada-002';
    }

    return modelMap[provider] || 'gpt-4o-mini';
  }

  /**
   * Format chat messages for LLM input
   */
  formatChatInput(messages) {
    return messages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');
  }

  /**
   * Check if circuit breaker is open for provider
   */
  isCircuitBreakerOpen(providerName) {
    const breaker = this.circuitBreaker.get(providerName);
    if (!breaker) return false;
    
    if (breaker.isOpen) {
      const timeSinceLastFailure = Date.now() - breaker.lastFailure;
      if (timeSinceLastFailure > 60000) { // 1 minute timeout
        breaker.isOpen = false;
        breaker.failures = 0;
        return false;
      }
      return true;
    }
    
    return false;
  }

  /**
   * Test provider connections
   */
  async testConnections() {
    try {
      const results = {};
      
      for (const [providerName, provider] of this.providers) {
        try {
          // Test with a simple request
          const testRequest = {
            task: 'chat',
            role: 'chat',
            input: 'Hello',
            model: this.selectModel('chat', providerName),
            tenantId: 'test'
          };
          
          await provider.call(testRequest);
          
          results[providerName] = {
            status: 'available',
            name: providerName,
            timestamp: new Date().toISOString()
          };
        } catch (error) {
          results[providerName] = {
            status: 'error',
            name: providerName,
            error: error.message,
            timestamp: new Date().toISOString()
          };
        }
      }

      return results;
    } catch (error) {
      logger.error('Connection test failed:', error);
      return { error: error.message };
    }
  }

  /**
   * Get provider health status
   */
  async getProviderHealth() {
    try {
      const health = {};
      
      for (const [providerName, provider] of this.providers) {
        const breaker = this.circuitBreaker.get(providerName);
        health[providerName] = {
          status: breaker?.isOpen ? 'unhealthy' : 'healthy',
          name: providerName,
          lastCheck: new Date().toISOString(),
          uptime: breaker?.isOpen ? '0%' : '100%',
          failures: breaker?.failures || 0
        };
      }

      return health;
    } catch (error) {
      logger.error('Health check failed:', error);
      return { error: error.message };
    }
  }

  /**
   * Record usage for monitoring and analytics
   */
  async recordUsage(request, response, success = true, errorMessage = null) {
    if (!this.config.enableUsageTracking) return;

    const usageRecord = {
      user_id: request.userId && request.userId !== 'onboarding' ? request.userId : SYSTEM_USER_ID,
      org_id: request.orgId || null,
      provider: response.provider,
      model: response.model,
      task_type: request.task || 'chat',
      prompt_tokens: response.tokens?.prompt || 0,
      completion_tokens: response.tokens?.completion || 0,
      total_tokens: (response.tokens?.prompt || 0) + (response.tokens?.completion || 0),
      cost_cents: response.costCents || 0,
      cost_usd: (response.costCents || 0) / 100,
      request_id: request.requestId || null,
      response_time_ms: response.latencyMs ? parseFloat(response.latencyMs.toFixed(3)) : 0,
      success: success,
      error_message: errorMessage,
      metadata: {
        role: request.role,
        sensitivity: request.sensitivity,
        temperature: request.temperature,
        max_tokens: request.maxTokens,
      },
      created_at: new Date().toISOString()
    };

    // Store in memory for immediate access
    this.usageRecords.push(usageRecord);

    // Keep only last 1000 records in memory
    if (this.usageRecords.length > 1000) {
      this.usageRecords = this.usageRecords.slice(-1000);
    }

    // Store in database for persistent monitoring
    try {
      // Import the monitoring service dynamically to avoid circular dependencies
      const { aiUsageMonitoringService } = await import('../src/services/AIUsageMonitoringService.js');
      await aiUsageMonitoringService.recordUsage(usageRecord);

        // Deduct credits if successful
        if (success && usageRecord.cost_cents > 0) {
           await creditService.deductCredits(
             usageRecord.user_id,
             usageRecord.cost_cents,
             `AI Usage: ${usageRecord.task_type} (${usageRecord.model})`,
             usageRecord.request_id || `req_${Date.now()}`
           );
        }
      } catch (error) {
        logger.error('Failed to record usage/credits in database:', error);
      model: usageRecord.model,
      cost_usd: usageRecord.cost_usd,
      tokens: usageRecord.total_tokens,
      success: usageRecord.success
    });
  }

  /**
   * Get usage statistics
   */
  getUsageStats(tenantId, timeRange) {
    return {
      totalRequests: this.usageRecords.length,
      totalCost: 0,
      totalTokens: 0,
      averageLatency: 0,
      tenantId,
      timeRange
    };
  }

  /**
   * Get available models
   */
  getAvailableModels(role) {
    const models = {
      chat: ['gpt-4', 'gpt-3.5-turbo', 'claude-3-opus', 'claude-3-sonnet', 'llama2'],
      embed: ['text-embedding-ada-002', 'text-embedding-3-small', 'text-embedding-3-large'],
      rerank: ['rerank-english-v2.0', 'rerank-multilingual-v2.0']
    };

    return role ? models[role] || [] : models;
  }
}

class OpenClawProvider {
  constructor(baseUrl, apiKey) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  async *callStream(request) {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            model: request.model,
            messages: this.buildMessages(request),
            max_tokens: this.getMaxTokens(request),
            temperature: this.getTemperature(request),
            stream: true,
            user: request.userId
          })
      });
  
      if (!response.ok) throw new Error(`OpenClaw Stream Error: ${response.statusText}`);
      if (!response.body) throw new Error('No response body');
  
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
  
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line
  
        for (const line of lines) {
           if (line.trim() === '') continue;
           if (line.includes('[DONE]')) return;
           
           if (line.startsWith('data: ')) {
               try {
                   const data = JSON.parse(line.slice(6));
                   const content = data.choices?.[0]?.delta?.content || '';
                   if (content) yield { content };
               } catch (e) {
                   // ignore parse error
               }
           }
        }
      }
  }

  async call(request) {
    // Send standard OpenAI format
    const startTime = performance.now();
    
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: request.model,
          messages: this.buildMessages(request),
          max_tokens: this.getMaxTokens(request),
          temperature: this.getTemperature(request),
          stream: false,
          user: request.userId // Vital for OpenClaw memory
        })
      });

      if (!response.ok) {
        throw new Error(`OpenClaw API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const endTime = performance.now();
      const latencyMs = endTime - startTime;

      return {
        output: data.choices[0]?.message?.content || '',
        tokens: {
          prompt: data.usage?.prompt_tokens || 0,
          completion: data.usage?.completion_tokens || 0
        },
        costCents: this.calculateCost(data.usage, request.model),
        model: request.model,
        provider: 'openclaw',
        latencyMs
      };
    } catch (error) {
      throw new Error(`OpenClaw request failed: ${error.message}`);
    }
  }

  buildMessages(request) {
    // Prefer structured messages if available (OpenClaw/OpenAI compatible)
    if (request.messages && Array.isArray(request.messages) && request.messages.length > 0) {
      // Clone to avoid mutating original request
      let messages = [...request.messages];
      
      // Ensure system prompt is definitely included if provided separately
      if (request.system) {
        // If the first message isn't system, prepend. 
        // If it IS system, we rely on the one in messages array unless we want to override.
        // Let's assume request.system is the authoritative Source of Truth for system prompt.
        if (messages.length === 0 || messages[0].role !== 'system') {
           messages.unshift({ role: 'system', content: request.system });
        }
      }
      return messages;
    }

    // Fallback to flattened input if no structured messages found
    const messages = [];
    if (request.system) {
      messages.push({ role: 'system', content: request.system });
    }
    messages.push({ role: 'user', content: request.input });
    return messages;
  }

  getMaxTokens(request) {
    return 4000;
  }

  getTemperature(request) {
    return 0.7;
  }

  calculateCost(usage, model) {
    const promptTokens = usage?.prompt_tokens || 0;
    const completionTokens = usage?.completion_tokens || 0;
    
    // GPT-4o Mini Pricing (standard): $0.15 / 1M input, $0.60 / 1M output
    // Cost in cents/1K -> $0.00015 / 1K -> 0.015 cents
    const promptCost = (promptTokens / 1000) * 0.00015;  // dollars
    const completionCost = (completionTokens / 1000) * 0.00060; // dollars
    
    // Return cost in cents
    return Math.max(1, Math.ceil((promptCost + completionCost) * 100));
  }
}

/**
 * OpenAI Provider Implementation
 */
class OpenAIProvider {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.openai.com/v1';
  }

  async call(request) {
    // Handle embedding requests separately
    if (request.task === 'embed') {
      return this.embed(request);
    }

    const startTime = performance.now();
    
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: request.model,
          messages: this.buildMessages(request),
          max_tokens: this.getMaxTokens(request),
          temperature: this.getTemperature(request),
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const endTime = performance.now();
      const latencyMs = endTime - startTime;

      return {
        output: data.choices[0]?.message?.content || '',
        tokens: {
          prompt: data.usage?.prompt_tokens || 0,
          completion: data.usage?.completion_tokens || 0
        },
        costCents: this.calculateCost(data.usage, request.model),
        model: request.model,
        provider: 'openai',
        latencyMs
      };
    } catch (error) {
      throw new Error(`OpenAI request failed: ${error.message}`);
    }
  }

  async embed(request) {
    const startTime = performance.now();
    
    try {
      const response = await fetch(`${this.baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: request.model || 'text-embedding-3-small',
          input: request.input
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI embedding API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const endTime = performance.now();
      const latencyMs = endTime - startTime;

      return {
        output: data.data[0]?.embedding || [],
        tokens: {
          prompt: data.usage?.prompt_tokens || 0,
          completion: 0
        },
        costCents: this.calculateEmbeddingCost(data.usage, request.model),
        model: request.model || 'text-embedding-3-small',
        provider: 'openai',
        latencyMs
      };
    } catch (error) {
      throw new Error(`OpenAI embedding request failed: ${error.message}`);
    }
  }

  buildMessages(request) {
    const messages = [];
    
    if (request.system) {
      messages.push({ role: 'system', content: request.system });
    }
    
    messages.push({ role: 'user', content: request.input });
    
    return messages;
  }

  getMaxTokens(request) {
    return 4000; // Default max tokens
  }

  getTemperature(request) {
    return 0.7; // Default temperature
  }

  calculateCost(usage, model) {
    // Simplified cost calculation
    const promptTokens = usage?.prompt_tokens || 0;
    const completionTokens = usage?.completion_tokens || 0;
    
    // GPT-4o Mini Pricing (standard): $0.15 / 1M input, $0.60 / 1M output
    // Cost in cents/1K -> $0.00015 / 1K -> 0.015 cents
    const promptCost = (promptTokens / 1000) * 0.00015;  // dollars
    const completionCost = (completionTokens / 1000) * 0.00060; // dollars
    
    // Return cost in cents
    return Math.max(1, Math.ceil((promptCost + completionCost) * 100));
  }

  calculateEmbeddingCost(usage, model) {
    // Simplified embedding cost calculation
    const promptTokens = usage?.prompt_tokens || 0;
    
    // Rough cost estimates for embeddings (in cents)
    // text-embedding-3-small: $0.00002 per 1K tokens
    const costPer1KTokens = 0.00002;
    const cost = (promptTokens / 1000) * costPer1KTokens;
    
    return Math.round(cost * 100);
  }
}

/**
 * OpenRouter Provider Implementation
 */
class OpenRouterProvider {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://openrouter.ai/api/v1';
  }

  async call(request) {
    // Handle embedding requests separately
    if (request.task === 'embed') {
      return this.embed(request);
    }

    const startTime = performance.now();
    
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://nexus.marcoby.net',
          'X-Title': 'Nexus AI Gateway'
        },
        body: JSON.stringify({
          model: request.model,
          messages: this.buildMessages(request),
          max_tokens: this.getMaxTokens(request),
          temperature: this.getTemperature(request),
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const endTime = performance.now();
      const latencyMs = endTime - startTime;

      return {
        output: data.choices[0]?.message?.content || '',
        tokens: {
          prompt: data.usage?.prompt_tokens || 0,
          completion: data.usage?.completion_tokens || 0
        },
        costCents: this.calculateCost(data.usage, request.model),
        model: request.model,
        provider: 'openrouter',
        latencyMs
      };
    } catch (error) {
      throw new Error(`OpenRouter request failed: ${error.message}`);
    }
  }

  buildMessages(request) {
    const messages = [];
    
    if (request.system) {
      messages.push({ role: 'system', content: request.system });
    }
    
    messages.push({ role: 'user', content: request.input });
    
    return messages;
  }

  getMaxTokens(request) {
    return 4000;
  }

  getTemperature(request) {
    return 0.7;
  }

  calculateCost(usage, model) {
    // Simplified cost calculation for OpenRouter
    const promptTokens = usage?.prompt_tokens || 0;
    const completionTokens = usage?.completion_tokens || 0;
    
    // GPT-4o Mini Pricing (standard): $0.15 / 1M input, $0.60 / 1M output
    // Cost in cents/1K -> $0.00015 / 1K -> 0.015 cents
    const promptCost = (promptTokens / 1000) * 0.00015;  // dollars
    const completionCost = (completionTokens / 1000) * 0.00060; // dollars
    
    // Return cost in cents
    return Math.max(1, Math.ceil((promptCost + completionCost) * 100));
  }

  async embed(request) {
    const startTime = performance.now();
    
    try {
      const response = await fetch(`${this.baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://nexus.marcoby.net',
          'X-Title': 'Nexus AI Gateway'
        },
        body: JSON.stringify({
          model: request.model || 'text-embedding-3-small',
          input: request.input
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter embedding API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const endTime = performance.now();
      const latencyMs = endTime - startTime;

      return {
        output: data.data[0]?.embedding || [],
        tokens: {
          prompt: data.usage?.prompt_tokens || 0,
          completion: 0
        },
        costCents: this.calculateEmbeddingCost(data.usage, request.model),
        model: request.model || 'text-embedding-3-small',
        provider: 'openrouter',
        latencyMs
      };
    } catch (error) {
      throw new Error(`OpenRouter embedding request failed: ${error.message}`);
    }
  }

  calculateEmbeddingCost(usage, model) {
    // Simplified embedding cost calculation for OpenRouter
    const promptTokens = usage?.prompt_tokens || 0;
    
    // Rough cost estimates for embeddings (in cents)
    const costPer1KTokens = 0.00002;
    const cost = (promptTokens / 1000) * costPer1KTokens;
    
    return Math.round(cost * 100);
  }
}

/**
 * Local Provider Implementation
 */
class LocalProvider {
  constructor(baseUrl, apiKey) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  async call(request) {
    // Handle embedding requests separately
    if (request.task === 'embed') {
      return this.embed(request);
    }

    const startTime = performance.now();
    
    try {
      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: request.model,
          messages: this.buildMessages(request),
          max_tokens: this.getMaxTokens(request),
          temperature: this.getTemperature(request),
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Local API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const endTime = performance.now();
      const latencyMs = endTime - startTime;

      return {
        output: data.choices[0]?.message?.content || '',
        tokens: {
          prompt: data.usage?.prompt_tokens || 0,
          completion: data.usage?.completion_tokens || 0
        },
        costCents: 0, // Local models are free
        model: request.model,
        provider: 'local',
        latencyMs
      };
    } catch (error) {
      throw new Error(`Local request failed: ${error.message}`);
    }
  }

  async embed(request) {
    const startTime = performance.now();
    
    try {
      const response = await fetch(`${this.baseUrl}/v1/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: request.model || 'text-embedding-3-small',
          input: request.input
        })
      });

      if (!response.ok) {
        throw new Error(`Local embedding API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const endTime = performance.now();
      const latencyMs = endTime - startTime;

      return {
        output: data.data[0]?.embedding || [],
        tokens: {
          prompt: data.usage?.prompt_tokens || 0,
          completion: 0
        },
        costCents: 0, // Local models are free
        model: request.model || 'text-embedding-3-small',
        provider: 'local',
        latencyMs
      };
    } catch (error) {
      throw new Error(`Local embedding request failed: ${error.message}`);
    }
  }

  buildMessages(request) {
    const messages = [];
    
    if (request.system) {
      messages.push({ role: 'system', content: request.system });
    }
    
    messages.push({ role: 'user', content: request.input });
    
    return messages;
  }

  getMaxTokens(request) {
    return 4000;
  }

  getTemperature(request) {
    return 0.7;
  }
}

module.exports = { NexusAIGatewayService };
