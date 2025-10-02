/**
 * OpenAI Service
 * 
 * Service for integrating with OpenAI API for AI-powered features
 * in the Nexus platform.
 */

import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import { logger } from '@/shared/utils/logger';

interface OpenAIRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface AIUsageLimits {
  dailyLimit: number;
  monthlyLimit: number;
  costPerRequest: number;
}

interface UserAIUsage {
  userId: string;
  dailyRequests: number;
  monthlyRequests: number;
  totalCost: number;
  lastResetDate: string;
}

export class OpenAIService extends BaseService {
  private static instance: OpenAIService;
  private apiKey: string;
  private usageTracker: Map<string, AIUsageLimits> = new Map();
  private provider: 'openai' | 'openrouter' = 'openai';

  constructor() {
    super('OpenAIService');
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!this.apiKey) {
      logger.warn('OpenAI API key not found in environment variables');
    }
  }

  public static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }

  /**
   * Switch AI provider (OpenAI or OpenRouter)
   */
  setProvider(provider: 'openai' | 'openrouter'): void {
    this.provider = provider;
    logger.info('AI provider switched', { provider });
  }

  /**
   * Get current provider
   */
  getProvider(): 'openai' | 'openrouter' {
    return this.provider;
  }

  /**
   * Get API endpoint based on provider
   */
  private getApiEndpoint(): string {
    switch (this.provider) {
      case 'openai':
        return 'https://api.openai.com/v1/chat/completions';
      case 'openrouter':
        return 'https://openrouter.ai/api/v1/chat/completions';
      default:
        return 'https://api.openai.com/v1/chat/completions';
    }
  }

  /**
   * Get headers based on provider
   */
  private getApiHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    switch (this.provider) {
      case 'openai':
        headers['Authorization'] = `Bearer ${this.apiKey}`;
        break;
      case 'openrouter':
        headers['Authorization'] = `Bearer ${this.apiKey}`;
        headers['HTTP-Referer'] = window.location.origin; // Required by OpenRouter
        headers['X-Title'] = 'Nexus Business Platform'; // Optional: your app name
        break;
    }

    return headers;
  }

  /**
   * Get available models based on current provider
   */
  getAvailableModels(): string[] {
    switch (this.provider) {
      case 'openai':
        return [
          'gpt-4',
          'gpt-4-turbo',
          'gpt-3.5-turbo',
          'gpt-3.5-turbo-16k'
        ];
      case 'openrouter':
        return [
          'openai/gpt-4',
          'openai/gpt-4-turbo',
          'openai/gpt-3.5-turbo',
          'anthropic/claude-3-opus',
          'anthropic/claude-3-sonnet',
          'anthropic/claude-3-haiku',
          'meta-llama/llama-2-70b-chat',
          'google/gemini-pro'
        ];
      default:
        return ['gpt-4', 'gpt-3.5-turbo'];
    }
  }

  /**
   * Get recommended model for specific use case
   */
  getRecommendedModel(useCase: 'identity' | 'analysis' | 'generation' | 'validation'): string {
    switch (this.provider) {
      case 'openai':
        switch (useCase) {
          case 'identity':
          case 'analysis':
            return 'gpt-4'; // Best quality for business content
          case 'generation':
            return 'gpt-4-turbo'; // Faster for content generation
          case 'validation':
            return 'gpt-3.5-turbo'; // Cost-effective for validation
          default:
            return 'gpt-4';
        }
      case 'openrouter':
        switch (useCase) {
          case 'identity':
          case 'analysis':
            return 'anthropic/claude-3-opus'; // Excellent for business analysis
          case 'generation':
            return 'openai/gpt-4-turbo'; // Fast generation
          case 'validation':
            return 'anthropic/claude-3-haiku'; // Cost-effective validation
          default:
            return 'openai/gpt-4';
        }
      default:
        return 'gpt-4';
    }
  }

  /**
   * Check if user has exceeded usage limits
   */
  private async checkUsageLimits(userId: string): Promise<ServiceResponse<boolean>> {
    try {
      // Get user's current usage
      const usage = await this.getUserUsage(userId);
      if (!usage.success) {
        return this.createErrorResponse('Failed to check usage limits');
      }

      const userUsage = usage.data!;
      const today = new Date().toISOString().split('T')[0];

      // Reset daily usage if it's a new day
      if (userUsage.lastResetDate !== today) {
        userUsage.dailyRequests = 0;
        userUsage.lastResetDate = today;
        await this.saveUserUsage(userId, userUsage);
      }

      // Check limits (you can adjust these based on your pricing model)
      const dailyLimit = 50; // 50 AI requests per day
      const monthlyLimit = 1000; // 1000 AI requests per month

      if (userUsage.dailyRequests >= dailyLimit) {
        return this.createErrorResponse('Daily AI usage limit exceeded');
      }

      if (userUsage.monthlyRequests >= monthlyLimit) {
        return this.createErrorResponse('Monthly AI usage limit exceeded');
      }

      return this.createSuccessResponse(true);
    } catch (error) {
      return this.handleError(error, 'check usage limits');
    }
  }

  /**
   * Get user's AI usage statistics
   */
  async getUserUsage(userId: string): Promise<ServiceResponse<UserAIUsage>> {
    try {
      // In a real implementation, this would fetch from your database
      // For now, we'll use localStorage as a fallback
      const stored = localStorage.getItem(`ai_usage_${userId}`);
      
      if (stored) {
        const usage = JSON.parse(stored);
        return this.createSuccessResponse(usage);
      }

      // Default usage for new users
      const defaultUsage: UserAIUsage = {
        userId,
        dailyRequests: 0,
        monthlyRequests: 0,
        totalCost: 0,
        lastResetDate: new Date().toISOString().split('T')[0]
      };

      return this.createSuccessResponse(defaultUsage);
    } catch (error) {
      return this.handleError(error, 'get user usage');
    }
  }

  /**
   * Save user's AI usage statistics
   */
  private async saveUserUsage(userId: string, usage: UserAIUsage): Promise<void> {
    try {
      // In a real implementation, this would save to your database
      localStorage.setItem(`ai_usage_${userId}`, JSON.stringify(usage));
    } catch (error) {
      logger.error('Failed to save user usage', { userId, error });
    }
  }

  /**
   * Update usage after successful AI request
   */
  private async updateUsage(userId: string, tokens: number): Promise<void> {
    try {
      const usageResponse = await this.getUserUsage(userId);
      if (!usageResponse.success) return;

      const usage = usageResponse.data!;
      const costPerToken = 0.00003; // Approximate cost per token for GPT-4
      const requestCost = tokens * costPerToken;

      usage.dailyRequests += 1;
      usage.monthlyRequests += 1;
      usage.totalCost += requestCost;

      await this.saveUserUsage(userId, usage);
    } catch (error) {
      logger.error('Failed to update usage', { userId, error });
    }
  }

  /**
   * Generate content using OpenAI API
   */
  async generateContent(
    prompt: string,
    systemPrompt?: string,
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      userId?: string; // Add userId for usage tracking
    } = {}
  ): Promise<ServiceResponse<string>> {
    try {
      if (!this.apiKey) {
        return this.createErrorResponse('OpenAI API key not configured');
      }

      // Check usage limits if userId is provided
      if (options.userId) {
        const limitCheck = await this.checkUsageLimits(options.userId);
        if (!limitCheck.success) {
          return this.createErrorResponse(limitCheck.error || 'Usage limit exceeded');
        }
      }

      const request: OpenAIRequest = {
        model: options.model || 'gpt-4',
        messages: [
          ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
          { role: 'user', content: prompt }
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1000
      };

      const response = await fetch(this.getApiEndpoint(), {
        method: 'POST',
        headers: this.getApiHeaders(),
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data: OpenAIResponse = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        return this.createErrorResponse('No content generated');
      }

      // Update usage tracking if userId is provided
      if (options.userId) {
        await this.updateUsage(options.userId, data.usage.total_tokens);
      }

      logger.info('OpenAI content generated', { 
        model: data.model, 
        tokens: data.usage.total_tokens,
        userId: options.userId
      });

      return this.createSuccessResponse(content);
    } catch (error) {
      return this.handleError(error, 'generate OpenAI content');
    }
  }

  /**
   * Generate business identity content
   */
  async generateIdentityContent(
    section: string,
    context: any,
    prompt: string,
    userId?: string
  ): Promise<ServiceResponse<any>> {
    try {
      const systemPrompt = this.getIdentitySystemPrompt(section);
      const contextualPrompt = this.buildContextualPrompt(section, context, prompt);

      const response = await this.generateContent(contextualPrompt, systemPrompt, {
        model: this.getRecommendedModel('identity'),
        temperature: 0.7,
        maxTokens: 1500,
        userId // Pass userId for usage tracking
      });

      if (response.success) {
        // Try to parse as JSON if it looks like structured data
        try {
          const parsed = JSON.parse(response.data!);
          return this.createSuccessResponse(parsed);
        } catch {
          // Return as plain text if not JSON
          return this.createSuccessResponse(response.data!);
        }
      }

      return response;
    } catch (error) {
      return this.handleError(error, `generate identity content for ${section}`);
    }
  }

  /**
   * Validate and improve identity content
   */
  async validateIdentityContent(
    section: string,
    content: any,
    context: any
  ): Promise<ServiceResponse<{
    isValid: boolean;
    suggestions: string[];
    improvedContent?: any;
  }>> {
    try {
      const systemPrompt = `You are a business consultant helping to validate and improve business identity content. 
      Provide constructive feedback and suggestions for improvement.`;

      const prompt = `
      Please review this ${section} content and provide validation feedback:
      
      Content: ${JSON.stringify(content, null, 2)}
      
      Context: ${JSON.stringify(context, null, 2)}
      
      Please respond with a JSON object containing:
      - isValid: boolean
      - suggestions: array of improvement suggestions
      - improvedContent: the improved version (if needed)
      `;

      const response = await this.generateContent(prompt, systemPrompt, {
        model: this.getRecommendedModel('validation'),
        temperature: 0.3,
        maxTokens: 2000
      });

      if (response.success) {
        try {
          const parsed = JSON.parse(response.data!);
          return this.createSuccessResponse(parsed);
        } catch {
          return this.createErrorResponse('Invalid response format from OpenAI');
        }
      }

      return response;
    } catch (error) {
      return this.handleError(error, `validate identity content for ${section}`);
    }
  }

  /**
   * Generate AI recommendations for identity
   */
  async generateIdentityRecommendations(
    identity: any
  ): Promise<ServiceResponse<string[]>> {
    try {
      const systemPrompt = `You are a business consultant providing strategic recommendations for business identity development. 
      Focus on actionable, specific suggestions that help improve business clarity and positioning.`;

      const prompt = `
      Based on this business identity data, provide 3-5 specific recommendations for improvement:
      
      ${JSON.stringify(identity, null, 2)}
      
      Please respond with a JSON array of recommendation strings.
      `;

      const response = await this.generateContent(prompt, systemPrompt, {
        model: 'gpt-4',
        temperature: 0.5,
        maxTokens: 1000
      });

      if (response.success) {
        try {
          const parsed = JSON.parse(response.data!);
          return this.createSuccessResponse(parsed);
        } catch {
          // If not JSON, split by lines and return as array
          const lines = response.data!.split('\n').filter(line => line.trim());
          return this.createSuccessResponse(lines);
        }
      }

      return response;
    } catch (error) {
      return this.handleError(error, 'generate identity recommendations');
    }
  }

  /**
   * Get system prompt for identity section
   */
  private getIdentitySystemPrompt(section: string): string {
    const prompts: Record<string, string> = {
      mission: `You are a business consultant helping to craft compelling mission statements. 
      Focus on clarity, purpose, and impact. Make it inspiring but achievable.`,
      
      vision: `You are a business consultant helping to create vision statements. 
      Focus on the future state, aspirations, and long-term goals. Make it ambitious but realistic.`,
      
      values: `You are a business consultant helping to define core values. 
      Focus on principles that guide decisions, behaviors, and culture. Make them authentic and actionable.`,
      
      purpose: `You are a business consultant helping to define company purpose. 
      Focus on the fundamental reason for existence and the problem being solved.`,
      
      foundation: `You are a business consultant helping to complete company foundation information. 
      Focus on accuracy, completeness, and professional presentation.`,
      
      products: `You are a business consultant helping to define products and services. 
      Focus on clear value propositions, benefits, and differentiation.`,
      
      market: `You are a business consultant helping to define target markets. 
      Focus on specific customer segments, needs, and market opportunities.`,
      
      competitive: `You are a business consultant helping to analyze competitive landscape. 
      Focus on positioning, differentiation, and competitive advantages.`
    };

    return prompts[section] || `You are a business consultant helping with ${section} development. 
    Provide clear, actionable, and professional guidance.`;
  }

  /**
   * Build contextual prompt for identity generation
   */
  private buildContextualPrompt(section: string, context: any, prompt: string): string {
    const contextInfo = context ? `
    Context:
    - Company: ${context.companyName || 'Not specified'}
    - Industry: ${context.industry || 'Not specified'}
    - Business Model: ${context.businessModel || 'Not specified'}
    - Stage: ${context.companyStage || 'Not specified'}
    ` : '';

    return `
    ${contextInfo}
    
    User Request: ${prompt}
    
    Please provide a comprehensive response that is:
    - Professional and well-structured
    - Specific to the business context
    - Actionable and practical
    - Aligned with best practices for ${section}
    `;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const openAIService = OpenAIService.getInstance();
