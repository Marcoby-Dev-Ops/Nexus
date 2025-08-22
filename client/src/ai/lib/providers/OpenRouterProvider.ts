import type { LLMRequest, LLMResponse, OpenRouterRequest, OpenRouterResponse } from '../../types';
import { LLMError } from '../../types';
import { getEnvVar } from '@/lib/env-utils';

export class OpenRouterProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string, baseUrl?: string) {
    this.apiKey = apiKey || getEnvVar('VITE_OPENROUTER_API_KEY') || getEnvVar('OPENROUTER_API_KEY') || '';
    this.baseUrl = baseUrl || 'https://openrouter.ai/api/v1';
    
    if (!this.apiKey || this.apiKey === 'your_openrouter_api_key_here') {
      throw new Error('OpenRouter API key is required. Please set VITE_OPENROUTER_API_KEY or OPENROUTER_API_KEY environment variable.');
    }
  }

  /**
   * Call OpenRouter API with the given request
   */
  public async call<T = any>(request: LLMRequest & { model: string }): Promise<LLMResponse<T>> {
    const startTime = performance.now();

    try {
      // Prepare the request for OpenRouter
      const openRouterRequest: OpenRouterRequest = {
        model: request.model,
        messages: this.buildMessages(request),
        stream: false,
        max_tokens: this.getMaxTokens(request),
        temperature: this.getTemperature(request),
      };

      // Add response format for JSON requests
      if (request.json) {
        openRouterRequest.response_format = { type: 'json_object' };
      }

      // Add tools if provided
      if (request.tools && request.tools.length > 0) {
        openRouterRequest.tools = request.tools;
      }

      // Make the API call
      const response = await this.makeRequest(openRouterRequest);
      const endTime = performance.now();
      const latencyMs = endTime - startTime;

      // Parse the response
      const result = this.parseResponse<T>(response, request);

      // Calculate cost
      const costCents = this.calculateCost(response.usage, request.model);

      return {
        output: result,
        tokens: {
          prompt: response.usage?.prompt_tokens || 0,
          completion: response.usage?.completion_tokens || 0,
        },
        costCents,
        model: request.model,
        provider: 'openrouter',
        latencyMs,
        finishReason: response.choices[0]?.finish_reason,
      };
    } catch (error) {
      const endTime = performance.now();
      const latencyMs = endTime - startTime;

      // Handle specific OpenRouter errors
      if (error instanceof Error && 'status' in error) {
        const statusCode = (error as any).status;
        throw new LLMError(
          `OpenRouter API error: ${error.message}`,
          'openrouter',
          request.model,
          statusCode,
          this.isRetryableError(statusCode)
        );
      }

      // Handle other errors
      throw new LLMError(
        `OpenRouter request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'openrouter',
        request.model,
        undefined,
        true
      );
    }
  }

  /**
   * Make HTTP request to OpenRouter API
   */
  private async makeRequest(request: OpenRouterRequest): Promise<OpenRouterResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': getEnvVar('VITE_NEXT_PUBLIC_APP_URL') || 'https://nexus.marcoby.net',
        'X-Title': 'Nexus AI Gateway',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const error = new Error(`OpenRouter API error: ${response.status} ${errorText}`);
      (error as any).status = response.status;
      throw error;
    }

    return response.json();
  }

  /**
   * Build messages array for OpenRouter API
   */
  private buildMessages(request: LLMRequest): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

    // Add system message if provided
    if (request.system) {
      messages.push({
        role: 'system',
        content: request.system,
      });
    }

    // Add user message
    const userContent = typeof request.input === 'string' 
      ? request.input 
      : JSON.stringify(request.input);

    messages.push({
      role: 'user',
      content: userContent,
    });

    return messages;
  }

  /**
   * Parse OpenRouter response
   */
  private parseResponse<T>(response: OpenRouterResponse, request: LLMRequest): T {
    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new LLMError('No content in OpenRouter response', 'openrouter', request.model);
    }

    // Parse JSON if requested
    if (request.json) {
      try {
        return JSON.parse(content) as T;
      } catch (error) {
        throw new LLMError(
          `Failed to parse JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'openrouter',
          request.model
        );
      }
    }

    return content as T;
  }

  /**
   * Calculate cost in cents based on usage
   * OpenRouter pricing varies by model, so we use approximate estimates
   */
  private calculateCost(usage: OpenRouterResponse['usage'], model: string): number {
    if (!usage) return 0;

    // OpenRouter pricing estimates (as of 2024) - in dollars per 1K tokens
    const pricing: Record<string, { input: number; output: number }> = {
      // Anthropic models
      'anthropic/claude-3-5-sonnet': { input: 0.003, output: 0.015 },
      'anthropic/claude-3-5-haiku': { input: 0.00025, output: 0.00125 },
      'anthropic/claude-3-opus': { input: 0.015, output: 0.075 },
      'anthropic/claude-3-sonnet': { input: 0.003, output: 0.015 },
      
      // Meta models
      'meta-llama/llama-3.1-8b-instruct': { input: 0.0002, output: 0.0002 },
      'meta-llama/llama-3.1-70b-instruct': { input: 0.0007, output: 0.0008 },
      
      // Nous Research models
      'nousresearch/nous-hermes-2-mixtral-8x7b-dpo': { input: 0.0006, output: 0.0006 },
      'nousresearch/nous-hermes-2-yi-34b': { input: 0.0006, output: 0.0006 },
      
      // Other popular models
      'google/gemini-pro': { input: 0.0005, output: 0.0015 },
      'mistralai/mistral-7b-instruct': { input: 0.0002, output: 0.0002 },
      'microsoft/wizardlm-2-8x22b': { input: 0.0006, output: 0.0006 },
    };

    const modelPricing = pricing[model] || { input: 0.001, output: 0.002 }; // Default fallback
    
    const inputCost = (usage.prompt_tokens / 1000) * modelPricing.input;
    const outputCost = (usage.completion_tokens / 1000) * modelPricing.output;
    
    return (inputCost + outputCost) * 100; // Convert to cents
  }

  /**
   * Get max tokens for the request
   */
  private getMaxTokens(request: LLMRequest): number | undefined {
    // Default max tokens based on model family
    const defaultMaxTokens: Record<string, number> = {
      // Anthropic models
      'anthropic/claude-3-5-sonnet': 200000,
      'anthropic/claude-3-5-haiku': 200000,
      'anthropic/claude-3-opus': 200000,
      'anthropic/claude-3-sonnet': 200000,
      
      // Meta models
      'meta-llama/llama-3.1-8b-instruct': 8192,
      'meta-llama/llama-3.1-70b-instruct': 8192,
      
      // Nous Research models
      'nousresearch/nous-hermes-2-mixtral-8x7b-dpo': 32768,
      'nousresearch/nous-hermes-2-yi-34b': 4096,
      
      // Other models
      'google/gemini-pro': 32768,
      'mistralai/mistral-7b-instruct': 8192,
      'microsoft/wizardlm-2-8x22b': 65536,
    };

    return defaultMaxTokens[request.model] || 8192;
  }

  /**
   * Get temperature for the request
   */
  private getTemperature(request: LLMRequest): number {
    // Default temperature based on role
    const defaultTemperatures: Record<string, number> = {
      reasoning: 0.1,
      chat: 0.7,
      draft: 0.8,
      embed: 0,
      rerank: 0,
      tool: 0.1,
    };

    return defaultTemperatures[request.role] || 0.7;
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(statusCode?: number): boolean {
    if (!statusCode) return true;
    
    // Retry on 5xx errors and rate limits
    return statusCode >= 500 || statusCode === 429;
  }

  /**
   * Test the connection to OpenRouter
   */
  public async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': getEnvVar('VITE_NEXT_PUBLIC_APP_URL') || 'https://nexus.marcoby.net',
          'X-Title': 'Nexus AI Gateway',
        },
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get available models from OpenRouter
   */
  public async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': getEnvVar('VITE_NEXT_PUBLIC_APP_URL') || 'https://nexus.marcoby.net',
          'X-Title': 'Nexus AI Gateway',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`);
      }

      const data = await response.json();
      return data.data?.map((model: any) => model.id) || [];
    } catch (error) {
      throw new LLMError(
        `Failed to get OpenRouter models: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'openrouter',
        'unknown'
      );
    }
  }

  /**
   * Get model pricing information
   */
  public async getModelPricing(): Promise<Record<string, { input: number; output: number }>> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': getEnvVar('VITE_NEXT_PUBLIC_APP_URL') || 'https://nexus.marcoby.net',
          'X-Title': 'Nexus AI Gateway',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`);
      }

      const data = await response.json();
      const pricing: Record<string, { input: number; output: number }> = {};

      data.data?.forEach((model: any) => {
        if (model.pricing) {
          pricing[model.id] = {
            input: model.pricing.prompt || 0,
            output: model.pricing.completion || 0,
          };
        }
      });

      return pricing;
    } catch (error) {
      throw new LLMError(
        `Failed to get OpenRouter pricing: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'openrouter',
        'unknown'
      );
    }
  }
}
