import { ModelRegistry } from './ModelRegistry';
import { OpenAIProvider } from './providers/OpenAIProvider';
import { OpenRouterProvider } from './providers/OpenRouterProvider';
import { LocalProvider } from './providers/LocalProvider';
import type { LLMRequest, LLMResponse, Provider, UsageRecord } from '../types';
import { LLMError, BudgetExceededError } from '../types';
import { logger } from '@/shared/utils/logger';
import { 
  recordRequest, 
  recordTokens, 
  recordCost, 
  recordLatency, 
  recordCircuitBreakerState 
} from '../observability/metrics';
import { getEnvVar } from '@/lib/env-utils';

export interface GatewayConfig {
  enableOpenAI?: boolean;
  enableOpenRouter?: boolean;
  enableLocal?: boolean;
  maxRetries?: number;
  retryDelayMs?: number;
  enableUsageTracking?: boolean;
  enableCircuitBreaker?: boolean;
}

export class AIGateway {
  private modelRegistry: ModelRegistry;
  private providers: Map<Provider, any> = new Map();
  private config: GatewayConfig;
  private usageRecords: UsageRecord[] = [];
  private circuitBreaker: Map<string, { failures: number; lastFailure: number; isOpen: boolean }> = new Map();

  constructor(config: GatewayConfig = {}) {
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

    this.modelRegistry = new ModelRegistry();
    this.initializeProviders();
  }

  /**
   * Initialize available providers based on configuration
   */
  private initializeProviders(): void {
    // Check OpenAI provider
    if (this.config.enableOpenAI) {
      const openaiApiKey = getEnvVar('VITE_OPENAI_API_KEY') || getEnvVar('OPENAI_API_KEY');
      if (openaiApiKey && openaiApiKey !== 'your_openai_key_here') {
        try {
          this.providers.set('openai', new OpenAIProvider());
          logger.info('OpenAI provider initialized');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          logger.warn(`Failed to initialize OpenAI provider: ${errorMessage}`);
        }
      } else {
        logger.info('OpenAI provider disabled - API key not configured');
      }
    }

    // Check OpenRouter provider
    if (this.config.enableOpenRouter) {
      const openrouterApiKey = getEnvVar('VITE_OPENROUTER_API_KEY') || getEnvVar('OPENROUTER_API_KEY');
      if (openrouterApiKey && openrouterApiKey !== 'your_openrouter_api_key_here') {
        try {
          this.providers.set('openrouter', new OpenRouterProvider());
          logger.info('OpenRouter provider initialized');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          logger.warn(`Failed to initialize OpenRouter provider: ${errorMessage}`);
        }
      } else {
        logger.info('OpenRouter provider disabled - API key not configured');
      }
    }

    // Check Local provider
    if (this.config.enableLocal) {
      try {
        this.providers.set('local', new LocalProvider());
        logger.info('Local provider initialized');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.warn(`Failed to initialize Local provider: ${errorMessage}`);
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
   * Main method to call AI models with intelligent routing
   */
  public async call<T = any>(request: LLMRequest): Promise<LLMResponse<T>> {
    const startTime = performance.now();

    try {
      // Validate request
      this.validateRequest(request);

      // Check circuit breaker
      if (this.config.enableCircuitBreaker && this.isCircuitBreakerOpen(request)) {
        throw new LLMError(
          'Circuit breaker is open for this provider',
          'unknown',
          'unknown',
          undefined,
          false
        );
      }

      // Select the best model and provider
      const modelSelection = this.modelRegistry.selectModel(request);
      logger.info(`Selected model: ${modelSelection.provider}/${modelSelection.model} - ${modelSelection.reason}`);

      // Get the provider
      const provider = this.providers.get(modelSelection.provider);
      if (!provider) {
        throw new LLMError(
          `Provider ${modelSelection.provider} is not available`,
          modelSelection.provider,
          modelSelection.model
        );
      }

      // Check budget before making the call
      if (request.budgetCents) {
        const estimatedCost = this.modelRegistry.estimateCost(request, modelSelection.model);
        if (estimatedCost > request.budgetCents) {
          throw new BudgetExceededError(
            `Estimated cost (${estimatedCost} cents) exceeds budget (${request.budgetCents} cents)`,
            request.budgetCents,
            estimatedCost
          );
        }
      }

      // Make the API call with retries
      const response = await this.callWithRetries<T>(provider, {
        ...request,
        model: modelSelection.model,
      });

      // Record usage
      if (this.config.enableUsageTracking) {
        this.recordUsage(request, response, modelSelection);
      }

      // Reset circuit breaker on success
      if (this.config.enableCircuitBreaker) {
        this.resetCircuitBreaker(modelSelection.provider);
      }

      const totalLatencyMs = performance.now() - startTime;
      
      // Record metrics for successful request
      recordRequest(modelSelection.provider, modelSelection.model, request.role, request.tenantId, 'success');
      recordTokens('input', modelSelection.provider, modelSelection.model, request.tenantId, response.tokens.prompt);
      recordTokens('output', modelSelection.provider, modelSelection.model, request.tenantId, response.tokens.completion);
      recordCost(modelSelection.provider, modelSelection.model, request.tenantId, response.costCents / 100); // Convert cents to USD
      recordLatency(modelSelection.provider, modelSelection.model, request.role, request.tenantId, totalLatencyMs / 1000); // Convert ms to seconds
      
      logger.info(`AI call completed in ${totalLatencyMs.toFixed(2)}ms`, {
        provider: modelSelection.provider,
        model: modelSelection.model,
        cost: response.costCents,
        tokens: response.tokens,
      });

      return response;
    } catch (error) {
      const totalLatencyMs = performance.now() - startTime;

      // Record failure in circuit breaker
      if (this.config.enableCircuitBreaker && error instanceof LLMError) {
        this.recordFailure(error.provider);
      }

      // Record failed usage
      if (this.config.enableUsageTracking) {
        this.recordFailedUsage(request, error, totalLatencyMs);
      }

      // Record metrics for failed request
      const provider = error instanceof LLMError ? error.provider : 'unknown';
      const model = error instanceof LLMError ? error.model : 'unknown';
      const status = error instanceof BudgetExceededError ? 'budget_exceeded' : 
                    error instanceof LLMError && error.message.includes('timeout') ? 'timeout' : 'error';
      
      recordRequest(provider, model, request.role, request.tenantId, status);
      recordLatency(provider, model, request.role, request.tenantId, totalLatencyMs / 1000);

      logger.error('AI call failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        provider,
        model,
        latency: totalLatencyMs,
      });

      throw error;
    }
  }

  /**
   * Call provider with retry logic
   */
  private async callWithRetries<T>(
    provider: any,
    request: LLMRequest & { model: string }
  ): Promise<LLMResponse<T>> {
    let lastError: Error;

    for (let attempt = 1; attempt <= (this.config.maxRetries || 3); attempt++) {
      try {
        return await provider.call<T>(request);
      } catch (error) {
        lastError = error as Error;

        // Don't retry if it's not a retryable error
        if (error instanceof LLMError && !error.retryable) {
          throw error;
        }

        // Don't retry on budget exceeded
        if (error instanceof BudgetExceededError) {
          throw error;
        }

        // Wait before retrying
        if (attempt < (this.config.maxRetries || 3)) {
          const delay = (this.config.retryDelayMs || 1000) * attempt;
          logger.warn(`Retrying AI call in ${delay}ms (attempt ${attempt + 1})`);
          await this.sleep(delay);
        }
      }
    }

    throw lastError!;
  }

  /**
   * Validate request parameters
   */
  private validateRequest(request: LLMRequest): void {
    if (!request.task) {
      throw new Error('Task is required');
    }

    if (!request.role) {
      throw new Error('Role is required');
    }

    if (!request.input) {
      throw new Error('Input is required');
    }

    if (!request.tenantId) {
      throw new Error('Tenant ID is required');
    }

    if (!request.sensitivity) {
      throw new Error('Sensitivity is required');
    }
  }

  /**
   * Check if circuit breaker is open for a provider
   */
  private isCircuitBreakerOpen(request: LLMRequest): boolean {
    // For now, we'll use a simple circuit breaker per provider
    // In a real implementation, you might want more sophisticated logic
    return false;
  }

  /**
   * Record a failure for circuit breaker
   */
  private recordFailure(provider: Provider): void {
    const key = provider;
    const current = this.circuitBreaker.get(key) || { failures: 0, lastFailure: 0, isOpen: false };
    
    current.failures++;
    current.lastFailure = Date.now();
    
    // Open circuit breaker after 5 consecutive failures
    if (current.failures >= 5) {
      current.isOpen = true;
    }
    
    this.circuitBreaker.set(key, current);
    
    // Record circuit breaker state in metrics
    const state = current.isOpen ? 'open' : current.failures > 0 ? 'half_open' : 'closed';
    recordCircuitBreakerState(provider, 'unknown', state);
  }

  /**
   * Reset circuit breaker for a provider
   */
  private resetCircuitBreaker(provider: Provider): void {
    const key = provider;
    this.circuitBreaker.set(key, { failures: 0, lastFailure: 0, isOpen: false });
    
    // Record circuit breaker state in metrics
    recordCircuitBreakerState(provider, 'unknown', 'closed');
  }

  /**
   * Record successful usage
   */
  private recordUsage(
    request: LLMRequest,
    response: LLMResponse<any>,
    modelSelection: { provider: Provider; model: string }
  ): void {
    const usageRecord: UsageRecord = {
      tenantId: request.tenantId,
      provider: modelSelection.provider,
      model: modelSelection.model,
      task: request.task,
      role: request.role,
      tokens: response.tokens,
      costCents: response.costCents,
      latencyMs: response.latencyMs,
      success: true,
      created_at: new Date().toISOString(),
    };

    this.usageRecords.push(usageRecord);
  }

  /**
   * Record failed usage
   */
  private recordFailedUsage(
    request: LLMRequest,
    error: Error,
    latencyMs: number
  ): void {
    const usageRecord: UsageRecord = {
      tenantId: request.tenantId,
      provider: error instanceof LLMError ? error.provider : 'unknown',
      model: error instanceof LLMError ? error.model : 'unknown',
      task: request.task,
      role: request.role,
      tokens: { prompt: 0, completion: 0 },
      costCents: 0,
      latencyMs,
      success: false,
      error: error.message,
      created_at: new Date().toISOString(),
    };

    this.usageRecords.push(usageRecord);
  }

  /**
   * Get usage statistics
   */
  public getUsageStats(tenantId?: string, timeRange?: { start: Date; end: Date }): {
    totalRequests: number;
    totalCost: number;
    totalTokens: number;
    averageLatency: number;
    successRate: number;
    byProvider: Record<Provider, {
      requests: number;
      cost: number;
      tokens: number;
      averageLatency: number;
    }>;
  } {
    let records = this.usageRecords;

    // Filter by tenant
    if (tenantId) {
      records = records.filter(r => r.tenantId === tenantId);
    }

    // Filter by time range
    if (timeRange) {
      records = records.filter(r => {
        const createdAt = new Date(r.created_at!);
        return createdAt >= timeRange.start && createdAt <= timeRange.end;
      });
    }

    const totalRequests = records.length;
    const successfulRequests = records.filter(r => r.success).length;
    const totalCost = records.reduce((sum, r) => sum + r.costCents, 0);
    const totalTokens = records.reduce((sum, r) => sum + r.tokens.prompt + r.tokens.completion, 0);
    const totalLatency = records.reduce((sum, r) => sum + r.latencyMs, 0);

    const byProvider: Record<Provider, any> = {};
    const providers = ['openai', 'openrouter', 'local'] as Provider[];

    providers.forEach(provider => {
      const providerRecords = records.filter(r => r.provider === provider);
      const providerRequests = providerRecords.length;
      const providerCost = providerRecords.reduce((sum, r) => sum + r.costCents, 0);
      const providerTokens = providerRecords.reduce((sum, r) => sum + r.tokens.prompt + r.tokens.completion, 0);
      const providerLatency = providerRecords.reduce((sum, r) => sum + r.latencyMs, 0);

      byProvider[provider] = {
        requests: providerRequests,
        cost: providerCost,
        tokens: providerTokens,
        averageLatency: providerRequests > 0 ? providerLatency / providerRequests : 0,
      };
    });

    return {
      totalRequests,
      totalCost,
      totalTokens,
      averageLatency: totalRequests > 0 ? totalLatency / totalRequests : 0,
      successRate: totalRequests > 0 ? successfulRequests / totalRequests : 0,
      byProvider,
    };
  }

  /**
   * Get available models for a specific role
   */
  public getAvailableModels(role?: string): Array<{
    id: string;
    name: string;
    provider: Provider;
    capabilities: string[];
    costPerToken: number;
  }> {
    if (role) {
      return this.modelRegistry.getModelsForRole(role as any).map(model => ({
        id: model.id,
        name: model.name,
        provider: model.provider,
        capabilities: model.capabilities,
        costPerToken: model.costPerToken,
      }));
    }

    return Array.from(this.modelRegistry.getModelsForProvider('openai')).map(model => ({
      id: model.id,
      name: model.name,
      provider: model.provider,
      capabilities: model.capabilities,
      costPerToken: model.costPerToken,
    }));
  }

  /**
   * Test all provider connections
   */
  public async testConnections(): Promise<Record<Provider, boolean>> {
    const results: Record<Provider, boolean> = {} as Record<Provider, boolean>;

    for (const [provider, providerInstance] of this.providers) {
      try {
        if (providerInstance.testConnection) {
          results[provider] = await providerInstance.testConnection();
        } else {
          results[provider] = true; // Assume working if no test method
        }
      } catch (error) {
        results[provider] = false;
        logger.warn(`Failed to test ${provider} connection:`, error);
      }
    }

    return results;
  }

  /**
   * Get provider health status
   */
  public async getProviderHealth(): Promise<Record<Provider, any>> {
    const health: Record<Provider, any> = {} as Record<Provider, any>;

    for (const [provider, providerInstance] of this.providers) {
      try {
        if (provider === 'local' && providerInstance.getHealthStatus) {
          try {
            health[provider] = await providerInstance.getHealthStatus();
          } catch (healthError) {
            health[provider] = { 
              status: 'error', 
              error: healthError instanceof Error ? healthError.message : 'Health check failed' 
            };
          }
        } else {
          health[provider] = { status: 'unknown' };
        }
      } catch (error) {
        health[provider] = { 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    }

    return health;
  }

  /**
   * Utility function to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
