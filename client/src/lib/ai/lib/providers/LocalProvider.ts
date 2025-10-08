import type { LLMRequest, LLMResponse, LocalRequest, LocalResponse } from '../../types';
import { LLMError } from '../../types';
import { getEnvVar } from '@/lib/env-utils';

export class LocalProvider {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl?: string, apiKey?: string) {
    this.baseUrl = baseUrl || getEnvVar('LOCAL_OPENAI_URL') || 'http://localhost:8000';
    this.apiKey = apiKey || getEnvVar('LOCAL_API_KEY') || 'sk-local';
  }

  /**
   * Call local inference server with the given request
   */
  public async call<T = any>(request: LLMRequest & { model: string }): Promise<LLMResponse<T>> {
    const startTime = performance.now();

    try {
      // Prepare the request for local server
      const localRequest: LocalRequest = {
        model: request.model,
        messages: this.buildMessages(request),
        stream: false,
        max_tokens: this.getMaxTokens(request),
        temperature: this.getTemperature(request),
      };

      // Add response format for JSON requests
      if (request.json) {
        localRequest.response_format = { type: 'json_object' };
      }

      // Add tools if provided
      if (request.tools && request.tools.length > 0) {
        localRequest.tools = request.tools;
      }

      // Make the API call
      const response = await this.makeRequest(localRequest);
      const endTime = performance.now();
      const latencyMs = endTime - startTime;

      // Parse the response
      const result = this.parseResponse<T>(response, request);

      return {
        output: result,
        tokens: {
          prompt: response.usage?.prompt_tokens || 0,
          completion: response.usage?.completion_tokens || 0,
        },
        costCents: 0, // Local models have no cost
        model: request.model,
        provider: 'local',
        latencyMs,
        finishReason: response.choices[0]?.finish_reason,
      };
    } catch (error) {
      const endTime = performance.now();
      const latencyMs = endTime - startTime;

      // Handle specific local server errors
      if (error instanceof Error && 'status' in error) {
        const statusCode = (error as any).status;
        throw new LLMError(
          `Local inference error: ${error.message}`,
          'local',
          request.model,
          statusCode,
          this.isRetryableError(statusCode)
        );
      }

      // Handle other errors
      throw new LLMError(
        `Local inference failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'local',
        request.model,
        undefined,
        true
      );
    }
  }

  /**
   * Make HTTP request to local inference server
   */
  private async makeRequest(request: LocalRequest): Promise<LocalResponse> {
    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const error = new Error(`Local inference error: ${response.status} ${errorText}`);
      (error as any).status = response.status;
      throw error;
    }

    return response.json();
  }

  /**
   * Build messages array for local server
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
   * Parse local server response
   */
  private parseResponse<T>(response: LocalResponse, request: LLMRequest): T {
    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new LLMError('No content in local inference response', 'local', request.model);
    }

    // Parse JSON if requested
    if (request.json) {
      try {
        return JSON.parse(content) as T;
      } catch (error) {
        throw new LLMError(
          `Failed to parse JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'local',
          request.model
        );
      }
    }

    return content as T;
  }

  /**
   * Get max tokens for the request
   */
  private getMaxTokens(request: LLMRequest): number | undefined {
    // Default max tokens based on model
    const defaultMaxTokens: Record<string, number> = {
      // BGE models
      'bge-m3': 8192,
      'bge-reranker-v2': 512,
      
      // Llama models
      'llama-3.1-8b-instruct': 8192,
      'llama-3.1-70b-instruct': 8192,
      
      // Other local models
      'mistral-7b-instruct': 8192,
      'qwen-7b-chat': 8192,
      'phi-3-mini': 4096,
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
   * Test the connection to local inference server
   */
  public async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get available models from local server
   */
  public async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`);
      }

      const data = await response.json();
      return data.data?.map((model: any) => model.id) || [];
    } catch (error) {
      throw new LLMError(
        `Failed to get local models: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'local',
        'unknown'
      );
    }
  }

  /**
   * Get server health status
   */
  public async getHealthStatus(): Promise<{
    status: 'healthy' | 'unhealthy';
    models: string[];
    gpuMemory?: Record<string, number>;
    queueLength?: number;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        return {
          status: 'unhealthy',
          models: [],
        };
      }

      const data = await response.json();
      return {
        status: 'healthy',
        models: data.models || [],
        gpuMemory: data.gpu_memory,
        queueLength: data.queue_length,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        models: [],
      };
    }
  }

  /**
   * Generate embeddings using local embedding model
   */
  public async generateEmbeddings(text: string, model: string = 'bge-m3'): Promise<number[]> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          input: text,
        }),
      });

      if (!response.ok) {
        throw new Error(`Embedding generation failed: ${response.status}`);
      }

      const data = await response.json();
      return data.data[0]?.embedding || [];
    } catch (error) {
      throw new LLMError(
        `Failed to generate embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'local',
        model
      );
    }
  }

  /**
   * Rerank documents using local reranker model
   */
  public async rerankDocuments(
    query: string,
    documents: string[],
    model: string = 'bge-reranker-v2'
  ): Promise<Array<{ index: number; score: number }>> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/rerank`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          query,
          documents,
        }),
      });

      if (!response.ok) {
        throw new Error(`Reranking failed: ${response.status}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      throw new LLMError(
        `Failed to rerank documents: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'local',
        model
      );
    }
  }
}
