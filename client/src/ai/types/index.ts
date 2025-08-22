import { z } from 'zod';

// Core AI Types
export type ModelRole = 'reasoning' | 'chat' | 'draft' | 'embed' | 'rerank' | 'tool';
export type Sensitivity = 'public' | 'internal' | 'restricted';
export type Provider = 'openai' | 'openrouter' | 'local';

// LLM Request Schema
export const LLMRequestSchema = z.object({
  task: z.string(), // 'rag.answer', 'summarize', 'classify', etc.
  role: z.enum(['reasoning', 'chat', 'draft', 'embed', 'rerank', 'tool']),
  input: z.union([z.string(), z.record(z.any())]),
  system: z.string().optional(),
  tools: z.array(z.any()).optional(),
  json: z.boolean().optional(), // enforce structured output
  tenantId: z.string(),
  sensitivity: z.enum(['public', 'internal', 'restricted']),
  budgetCents: z.number().optional(), // per-call ceiling
  latencyTargetMs: z.number().optional(), // soft target
  model: z.string().optional(), // override default selection
  provider: z.enum(['openai', 'openrouter', 'local']).optional(), // override default selection
});

// LLM Response Schema
export const LLMResponseSchema = z.object({
  output: z.any(),
  tokens: z.object({
    prompt: z.number(),
    completion: z.number(),
  }),
  costCents: z.number(),
  model: z.string(),
  provider: z.enum(['openai', 'openrouter', 'local']),
  latencyMs: z.number(),
  finishReason: z.string().optional(),
  error: z.string().optional(),
});

// Model Configuration Schema
export const ModelConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: z.enum(['openai', 'openrouter', 'local']),
  model: z.string(),
  version: z.string(),
  capabilities: z.array(z.string()),
  costPerToken: z.number(),
  maxTokens: z.number(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Provider Configuration Schema
export const ProviderConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['openai', 'openrouter', 'local']),
  baseUrl: z.string().optional(),
  apiKey: z.string().optional(),
  isActive: z.boolean(),
  rateLimit: z.object({
    requestsPerMinute: z.number(),
    tokensPerMinute: z.number(),
  }).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Policy Configuration Schema
export const PolicyConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  tenantId: z.string().optional(), // null for global policies
  rules: z.array(z.object({
    condition: z.object({
      role: z.enum(['reasoning', 'chat', 'draft', 'embed', 'rerank', 'tool']).optional(),
      sensitivity: z.enum(['public', 'internal', 'restricted']).optional(),
      task: z.string().optional(),
      budgetCents: z.number().optional(),
    }),
    action: z.object({
      provider: z.enum(['openai', 'openrouter', 'local']),
      model: z.string(),
      priority: z.number(), // higher number = higher priority
    }),
  })),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Usage Tracking Schema
export const UsageRecordSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string(),
  userId: z.string().optional(),
  provider: z.enum(['openai', 'openrouter', 'local']),
  model: z.string(),
  task: z.string(),
  role: z.enum(['reasoning', 'chat', 'draft', 'embed', 'rerank', 'tool']),
  tokens: z.object({
    prompt: z.number(),
    completion: z.number(),
  }),
  costCents: z.number(),
  latencyMs: z.number(),
  success: z.boolean(),
  error: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.string().optional(),
});

// Type exports
export type LLMRequest = z.infer<typeof LLMRequestSchema>;
export type LLMResponse<T = any> = z.infer<typeof LLMResponseSchema> & { output: T };
export type ModelConfig = z.infer<typeof ModelConfigSchema>;
export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;
export type PolicyConfig = z.infer<typeof PolicyConfigSchema>;
export type UsageRecord = z.infer<typeof UsageRecordSchema>;

// Provider-specific request types
export interface OpenAIRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  stream?: boolean;
  response_format?: { type: 'json_object' };
  tools?: any[];
  max_tokens?: number;
  temperature?: number;
}

export interface OpenRouterRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  stream?: boolean;
  response_format?: { type: 'json_object' };
  tools?: any[];
  max_tokens?: number;
  temperature?: number;
}

export interface LocalRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  stream?: boolean;
  response_format?: { type: 'json_object' };
  tools?: any[];
  max_tokens?: number;
  temperature?: number;
}

// Provider response types
export interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
      tool_calls?: any[];
    };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
      tool_calls?: any[];
    };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface LocalResponse {
  choices: Array<{
    message: {
      content: string;
      tool_calls?: any[];
    };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Error types
export class LLMError extends Error {
  constructor(
    message: string,
    public provider: Provider,
    public model: string,
    public statusCode?: number,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

export class PolicyError extends Error {
  constructor(message: string, public policyId: string) {
    super(message);
    this.name = 'PolicyError';
  }
}

export class BudgetExceededError extends Error {
  constructor(
    message: string,
    public budgetCents: number,
    public actualCostCents: number
  ) {
    super(message);
    this.name = 'BudgetExceededError';
  }
}
