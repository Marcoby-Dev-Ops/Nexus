import OpenAI from 'openai';
import type { LLMRequest, LLMResponse, OpenAIRequest, OpenAIResponse } from '../../types';
import { LLMError } from '../../types';
import { getEnvVar } from '@/lib/env-utils';

export class OpenAIProvider {
  private client: OpenAI;
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || getEnvVar('VITE_OPENAI_API_KEY') || getEnvVar('OPENAI_API_KEY') || '';
    if (!this.apiKey || this.apiKey === 'your_openai_key_here') {
      throw new Error('OpenAI API key is required. Please set VITE_OPENAI_API_KEY or OPENAI_API_KEY environment variable.');
    }

    this.client = new OpenAI({
      apiKey: this.apiKey,
    });
  }

  /**
   * Call OpenAI API with the given request
   */
  public async call<T = any>(request: LLMRequest & { model: string }): Promise<LLMResponse<T>> {
    const startTime = performance.now();

    try {
      // Prepare the request for OpenAI
      const openAIRequest: OpenAIRequest = {
        model: request.model,
        messages: this.buildMessages(request),
        stream: false,
        max_tokens: this.getMaxTokens(request),
        temperature: this.getTemperature(request),
      };

      // Add response format for JSON requests
      if (request.json) {
        openAIRequest.response_format = { type: 'json_object' };
      }

      // Add tools if provided
      if (request.tools && request.tools.length > 0) {
        openAIRequest.tools = request.tools;
      }

      // Make the API call
      const response = await this.client.chat.completions.create(openAIRequest);
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
        provider: 'openai',
        latencyMs,
        finishReason: response.choices[0]?.finish_reason,
      };
    } catch (error) {
      const endTime = performance.now();
      const latencyMs = endTime - startTime;

      // Handle specific OpenAI errors
      if (error instanceof OpenAI.APIError) {
        throw new LLMError(
          `OpenAI API error: ${error.message}`,
          'openai',
          request.model,
          error.status,
          this.isRetryableError(error.status)
        );
      }

      // Handle other errors
      throw new LLMError(
        `OpenAI request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'openai',
        request.model,
        undefined,
        true
      );
    }
  }

  /**
   * Build messages array for OpenAI API
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
   * Parse OpenAI response
   */
  private parseResponse<T>(response: OpenAIResponse, request: LLMRequest): T {
    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new LLMError('No content in OpenAI response', 'openai', request.model);
    }

    // Parse JSON if requested
    if (request.json) {
      try {
        return JSON.parse(content) as T;
      } catch (error) {
        throw new LLMError(
          `Failed to parse JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'openai',
          request.model
        );
      }
    }

    return content as T;
  }

  /**
   * Calculate cost in cents based on usage
   */
  private calculateCost(usage: OpenAIResponse['usage'], model: string): number {
    if (!usage) return 0;

    // OpenAI pricing (as of 2024) - in dollars per 1K tokens
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4o': { input: 0.0025, output: 0.01 },
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
      'text-embedding-3-small': { input: 0.00002, output: 0 },
      'text-embedding-3-large': { input: 0.00013, output: 0 },
    };

    const modelPricing = pricing[model] || pricing['gpt-4o-mini'];
    
    const inputCost = (usage.prompt_tokens / 1000) * modelPricing.input;
    const outputCost = (usage.completion_tokens / 1000) * modelPricing.output;
    
    return (inputCost + outputCost) * 100; // Convert to cents
  }

  /**
   * Get max tokens for the request
   */
  private getMaxTokens(request: LLMRequest): number | undefined {
    // Default max tokens based on model
    const defaultMaxTokens: Record<string, number> = {
      'gpt-4o': 4096,
      'gpt-4o-mini': 16384,
      'gpt-4-turbo': 4096,
      'gpt-4': 4096,
      'gpt-3.5-turbo': 4096,
    };

    return defaultMaxTokens[request.model] || 4096;
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
   * Test the connection to OpenAI
   */
  public async testConnection(): Promise<boolean> {
    try {
      await this.client.models.list();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get available models from OpenAI
   */
  public async getAvailableModels(): Promise<string[]> {
    try {
      const models = await this.client.models.list();
      return models.data.map(model => model.id);
    } catch (error) {
      throw new LLMError(
        `Failed to get OpenAI models: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'openai',
        'unknown'
      );
    }
  }
}
