import type { LLMRequest, ModelConfig, Provider, ModelRole, Sensitivity } from '../types';

export interface ModelSelection {
  provider: Provider;
  model: string;
  reason: string;
}

export class ModelRegistry {
  private models: Map<string, ModelConfig> = new Map();
  private defaultModels: Map<ModelRole, ModelSelection> = new Map();

  constructor() {
    this.initializeDefaultModels();
  }

  private initializeDefaultModels(): void {
    // Default model configurations
    const defaultModelConfigs: ModelConfig[] = [
      // OpenAI Models
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        provider: 'openai',
        model: 'gpt-4o',
        version: 'latest',
        capabilities: ['reasoning', 'chat', 'tool'],
        costPerToken: 0.000005, // $0.005 per 1K tokens
        maxTokens: 128000,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        provider: 'openai',
        model: 'gpt-4o-mini',
        version: 'latest',
        capabilities: ['reasoning', 'chat', 'tool'],
        costPerToken: 0.00015, // $0.15 per 1K tokens
        maxTokens: 16384,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        version: 'latest',
        capabilities: ['chat', 'draft'],
        costPerToken: 0.0005, // $0.5 per 1K tokens
        maxTokens: 16384,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'text-embedding-3-small',
        name: 'Text Embedding 3 Small',
        provider: 'openai',
        model: 'text-embedding-3-small',
        version: 'latest',
        capabilities: ['embed'],
        costPerToken: 0.00002, // $0.02 per 1K tokens
        maxTokens: 8192,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },

      // OpenRouter Models
      {
        id: 'anthropic/claude-3-5-sonnet',
        name: 'Claude 3.5 Sonnet',
        provider: 'openrouter',
        model: 'anthropic/claude-3-5-sonnet',
        version: 'latest',
        capabilities: ['reasoning', 'chat', 'tool'],
        costPerToken: 0.000003, // $3 per 1M tokens
        maxTokens: 200000,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'meta-llama/llama-3.1-8b-instruct',
        name: 'Llama 3.1 8B Instruct',
        provider: 'openrouter',
        model: 'meta-llama/llama-3.1-8b-instruct',
        version: 'latest',
        capabilities: ['chat', 'draft'],
        costPerToken: 0.0000002, // $0.2 per 1M tokens
        maxTokens: 8192,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'nousresearch/nous-hermes-2-mixtral-8x7b-dpo',
        name: 'Nous Hermes 2 Mixtral',
        provider: 'openrouter',
        model: 'nousresearch/nous-hermes-2-mixtral-8x7b-dpo',
        version: 'latest',
        capabilities: ['chat', 'draft'],
        costPerToken: 0.0000006, // $0.6 per 1M tokens
        maxTokens: 32768,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },

      // Local Models
      {
        id: 'bge-m3',
        name: 'BGE-M3 Embeddings',
        provider: 'local',
        model: 'bge-m3',
        version: 'latest',
        capabilities: ['embed'],
        costPerToken: 0, // No cost for local models
        maxTokens: 8192,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'bge-reranker-v2',
        name: 'BGE Reranker v2',
        provider: 'local',
        model: 'bge-reranker-v2',
        version: 'latest',
        capabilities: ['rerank'],
        costPerToken: 0, // No cost for local models
        maxTokens: 512,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'llama-3.1-8b-instruct',
        name: 'Llama 3.1 8B Instruct (Local)',
        provider: 'local',
        model: 'llama-3.1-8b-instruct',
        version: 'latest',
        capabilities: ['chat', 'draft'],
        costPerToken: 0, // No cost for local models
        maxTokens: 8192,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    // Register all models
    defaultModelConfigs.forEach(model => {
      this.models.set(model.id, model);
    });

    // Set default model selections by role
    this.defaultModels.set('reasoning', {
      provider: 'openai',
      model: 'gpt-4o',
      reason: 'High-quality reasoning tasks'
    });

    this.defaultModels.set('chat', {
      provider: 'openai',
      model: 'gpt-4o-mini',
      reason: 'Balanced quality and cost for chat'
    });

    this.defaultModels.set('draft', {
      provider: 'openrouter',
      model: 'meta-llama/llama-3.1-8b-instruct',
      reason: 'Cost-effective drafting'
    });

    this.defaultModels.set('embed', {
      provider: 'local',
      model: 'bge-m3',
      reason: 'Local embeddings for cost and privacy'
    });

    this.defaultModels.set('rerank', {
      provider: 'local',
      model: 'bge-reranker-v2',
      reason: 'Local reranking for cost and privacy'
    });

    this.defaultModels.set('tool', {
      provider: 'openai',
      model: 'gpt-4o',
      reason: 'Reliable function calling'
    });
  }

  /**
   * Select the best model for a given request based on policies and constraints
   */
  public selectModel(request: LLMRequest): ModelSelection {
    // If provider/model is explicitly specified, use it
    if (request.provider && request.model) {
      const model = this.models.get(request.model);
      if (model && model.provider === request.provider) {
        return {
          provider: request.provider,
          model: request.model,
          reason: 'Explicitly specified'
        };
      }
    }

    // Privacy-first routing for restricted content
    if (request.sensitivity === 'restricted') {
      if (request.role === 'embed' || request.role === 'rerank') {
        return {
          provider: 'local',
          model: request.role === 'embed' ? 'bge-m3' : 'bge-reranker-v2',
          reason: 'Privacy-sensitive embeddings/reranking'
        };
      }
      
      // For restricted content, prefer OpenAI with enterprise terms
      return {
        provider: 'openai',
        model: 'gpt-4o-mini',
        reason: 'Restricted content - OpenAI enterprise terms'
      };
    }

    // Cost/latency optimization for draft tasks
    if (request.role === 'draft') {
      if (request.budgetCents && request.budgetCents < 10) {
        // Very low budget - use cheapest option
        return {
          provider: 'openrouter',
          model: 'meta-llama/llama-3.1-8b-instruct',
          reason: 'Ultra-low cost drafting'
        };
      }
      
      // Standard draft - use cost-effective option
      return {
        provider: 'openrouter',
        model: 'nousresearch/nous-hermes-2-mixtral-8x7b-dpo',
        reason: 'Cost-effective drafting with good quality'
      };
    }

    // Local models for embeddings and reranking
    if (request.role === 'embed') {
      return {
        provider: 'local',
        model: 'bge-m3',
        reason: 'Local embeddings for cost and privacy'
      };
    }

    if (request.role === 'rerank') {
      return {
        provider: 'local',
        model: 'bge-reranker-v2',
        reason: 'Local reranking for cost and privacy'
      };
    }

    // Budget-aware routing
    if (request.budgetCents) {
      const estimatedTokens = this.estimateTokenCount(request);
      const maxCostPerToken = request.budgetCents / (estimatedTokens * 100); // Convert cents to dollars

      // Find models within budget
      const affordableModels = Array.from(this.models.values())
        .filter(model => 
          model.is_active && 
          model.capabilities.includes(request.role) &&
          model.costPerToken <= maxCostPerToken
        )
        .sort((a, b) => a.costPerToken - b.costPerToken);

      if (affordableModels.length > 0) {
        const bestModel = affordableModels[0];
        return {
          provider: bestModel.provider,
          model: bestModel.model,
          reason: `Budget-optimized: ${bestModel.name}`
        };
      }
    }

    // Latency-aware routing
    if (request.latencyTargetMs && request.latencyTargetMs < 1000) {
      // Fast response needed - prefer local or fast models
      if (request.role === 'chat' || request.role === 'draft') {
        return {
          provider: 'openrouter',
          model: 'meta-llama/llama-3.1-8b-instruct',
          reason: 'Fast response for low-latency requirement'
        };
      }
    }

    // Default selection based on role
    const defaultSelection = this.defaultModels.get(request.role);
    if (defaultSelection) {
      return defaultSelection;
    }

    // Fallback to OpenAI GPT-4o
    return {
      provider: 'openai',
      model: 'gpt-4o',
      reason: 'Default fallback'
    };
  }

  /**
   * Get model configuration by ID
   */
  public getModel(modelId: string): ModelConfig | undefined {
    return this.models.get(modelId);
  }

  /**
   * Get all active models for a specific role
   */
  public getModelsForRole(role: ModelRole): ModelConfig[] {
    return Array.from(this.models.values())
      .filter(model => model.is_active && model.capabilities.includes(role))
      .sort((a, b) => a.costPerToken - b.costPerToken);
  }

  /**
   * Get all models for a specific provider
   */
  public getModelsForProvider(provider: Provider): ModelConfig[] {
    return Array.from(this.models.values())
      .filter(model => model.is_active && model.provider === provider)
      .sort((a, b) => a.costPerToken - b.costPerToken);
  }

  /**
   * Estimate token count for a request
   */
  private estimateTokenCount(request: LLMRequest): number {
    let tokenCount = 0;
    
    // Rough estimation: 1 token ≈ 4 characters for English text
    if (typeof request.input === 'string') {
      tokenCount += Math.ceil(request.input.length / 4);
    } else {
      tokenCount += Math.ceil(JSON.stringify(request.input).length / 4);
    }

    if (request.system) {
      tokenCount += Math.ceil(request.system.length / 4);
    }

    // Add buffer for response
    tokenCount += 1000;

    return Math.max(tokenCount, 100); // Minimum 100 tokens
  }

  /**
   * Calculate estimated cost for a request
   */
  public estimateCost(request: LLMRequest, modelId: string): number {
    const model = this.models.get(modelId);
    if (!model) return 0;

    const tokenCount = this.estimateTokenCount(request);
    return tokenCount * model.costPerToken * 100; // Convert to cents
  }

  /**
   * Register a new model
   */
  public registerModel(model: ModelConfig): void {
    this.models.set(model.id, model);
  }

  /**
   * Update an existing model
   */
  public updateModel(modelId: string, updates: Partial<ModelConfig>): boolean {
    const model = this.models.get(modelId);
    if (!model) return false;

    this.models.set(modelId, { ...model, ...updates, updated_at: new Date().toISOString() });
    return true;
  }

  /**
   * Deactivate a model
   */
  public deactivateModel(modelId: string): boolean {
    return this.updateModel(modelId, { is_active: false });
  }
}
