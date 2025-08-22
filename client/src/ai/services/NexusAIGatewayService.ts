import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import type { GatewayConfig } from '../lib/AIGateway';
import type { ModelRole, Sensitivity, Provider } from '../types';
import { logger } from '@/shared/utils/logger';
import { getEnv } from '@/core/environment';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  system?: string;
  role?: ModelRole;
  sensitivity?: Sensitivity;
  budgetCents?: number;
  latencyTargetMs?: number;
  json?: boolean;
  tools?: any[];
  tenantId: string;
  userId?: string;
}

export interface ChatResponse {
  message: string;
  model: string;
  provider: Provider;
  costCents: number;
  tokens: { prompt: number; completion: number };
  latencyMs: number;
}

export interface EmbeddingRequest {
  text: string;
  model?: string;
  tenantId: string;
  userId?: string;
}

export interface EmbeddingResponse {
  embedding: number[];
  model: string;
  provider: Provider;
  tokens: { prompt: number; completion: number };
  latencyMs: number;
}

export interface RerankRequest {
  query: string;
  documents: string[];
  model?: string;
  tenantId: string;
  userId?: string;
}

export interface RerankResponse {
  results: Array<{ index: number; score: number }>;
  model: string;
  provider: Provider;
  latencyMs: number;
}

export class NexusAIGatewayService extends BaseService {
  private config: GatewayConfig;
  private apiBaseUrl: string;

  constructor(config: GatewayConfig = {}) {
    super();
    this.config = config;
    // Use the server API endpoint for AI operations
    const apiUrl = getEnv().api.url;
    this.apiBaseUrl = import.meta.env.VITE_AI_CHAT_URL?.replace('/api/ai/chat', '') || apiUrl;
  }

  /**
   * Chat with AI using server API
   */
  public async chat(request: ChatRequest): Promise<ServiceResponse<ChatResponse>> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: request.messages,
          system: request.system,
          role: request.role || 'chat',
          sensitivity: request.sensitivity || 'internal',
          budgetCents: request.budgetCents,
          latencyTargetMs: request.latencyTargetMs,
          json: request.json,
          tools: request.tools,
          tenantId: request.tenantId,
          userId: request.userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: {
          message: data.message,
          model: data.model,
          provider: data.provider,
          costCents: data.costCents,
          tokens: data.tokens,
          latencyMs: data.latencyMs,
        },
      };
    } catch (error) {
      logger.error('Chat request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate embeddings for text using server API
   */
  public async generateEmbeddings(request: EmbeddingRequest): Promise<ServiceResponse<EmbeddingResponse>> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/ai/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: request.text,
          model: request.model,
          tenantId: request.tenantId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: {
          embedding: data.embedding,
          model: data.model,
          provider: data.provider,
          tokens: data.tokens,
          latencyMs: data.latencyMs,
        },
      };
    } catch (error) {
      logger.error('Embedding generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Rerank documents based on query relevance
   */
  public async rerankDocuments(request: RerankRequest): Promise<ServiceResponse<RerankResponse>> {
    try {
      const llmRequest: LLMRequest = {
        task: 'rerank',
        role: 'rerank',
        input: { query: request.query, documents: request.documents },
        tenantId: request.tenantId,
        sensitivity: 'internal',
        model: request.model,
      };

      const response = await this.gateway.call<Array<{ index: number; score: number }>>(llmRequest);

      return {
        success: true,
        data: {
          results: response.output,
          model: response.model,
          provider: response.provider,
          latencyMs: response.latencyMs,
        },
      };
    } catch (error) {
      logger.error('Document reranking failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Analyze business data with AI using server API
   */
  public async analyzeBusinessData(
    data: any,
    analysisType: 'financial' | 'operational' | 'strategic',
    tenantId: string,
    userId?: string
  ): Promise<ServiceResponse<any>> {
    try {
      const systemPrompt = this.getAnalysisSystemPrompt(analysisType);
      
      const response = await fetch(`${this.apiBaseUrl}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: JSON.stringify(data) }],
          system: systemPrompt,
          role: 'reasoning',
          json: true,
          tenantId,
          userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const responseData = await response.json();
      
      return {
        success: true,
        data: responseData.message,
      };
    } catch (error) {
      logger.error('Business analysis failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate business recommendations using server API
   */
  public async generateRecommendations(
    context: string,
    recommendationType: 'growth' | 'efficiency' | 'risk' | 'opportunity',
    tenantId: string,
    userId?: string
  ): Promise<ServiceResponse<any>> {
    try {
      const systemPrompt = this.getRecommendationSystemPrompt(recommendationType);
      
      const response = await fetch(`${this.apiBaseUrl}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: context }],
          system: systemPrompt,
          role: 'reasoning',
          json: true,
          tenantId,
          userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const responseData = await response.json();
      
      return {
        success: true,
        data: responseData.message,
      };
    } catch (error) {
      logger.error('Recommendation generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Draft business documents using server API
   */
  public async draftDocument(
    content: string,
    documentType: 'proposal' | 'report' | 'plan' | 'email',
    tone: 'professional' | 'casual' | 'formal',
    tenantId: string,
    userId?: string
  ): Promise<ServiceResponse<string>> {
    try {
      const systemPrompt = this.getDocumentSystemPrompt(documentType, tone);
      
      const response = await fetch(`${this.apiBaseUrl}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content }],
          system: systemPrompt,
          role: 'draft',
          tenantId,
          userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const responseData = await response.json();
      
      return {
        success: true,
        data: responseData.message,
      };
    } catch (error) {
      logger.error('Document drafting failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get usage statistics using server API
   */
  public async getUsageStats(tenantId?: string, timeRange?: { start: Date; end: Date }) {
    try {
      const params = new URLSearchParams();
      if (tenantId) params.append('tenantId', tenantId);
      if (timeRange) {
        params.append('start', timeRange.start.toISOString());
        params.append('end', timeRange.end.toISOString());
      }

      const response = await fetch(`${this.apiBaseUrl}/api/ai/usage?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Usage stats failed:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get available models using server API
   */
  public async getAvailableModels(role?: string) {
    try {
      const params = role ? `?role=${role}` : '';
      const response = await fetch(`${this.apiBaseUrl}/api/ai/models${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Models fetch failed:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Test provider connections using server API
   */
  public async testConnections() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/ai/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Connection test failed:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get provider health status using server API
   */
  public async getProviderHealth() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/ai/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Health check failed:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }



  /**
   * Get system prompt for business analysis
   */
  private getAnalysisSystemPrompt(analysisType: string): string {
    const prompts = {
      financial: `You are a financial analyst. Analyze the provided data and provide insights on:
- Financial performance trends
- Key metrics and ratios
- Risk factors
- Opportunities for improvement
- Recommendations for financial optimization

Provide your analysis in a structured JSON format with sections for insights, metrics, risks, opportunities, and recommendations.`,

      operational: `You are an operations analyst. Analyze the provided data and provide insights on:
- Operational efficiency
- Process bottlenecks
- Resource utilization
- Performance metrics
- Improvement opportunities

Provide your analysis in a structured JSON format with sections for efficiency, bottlenecks, utilization, metrics, and improvements.`,

      strategic: `You are a strategic business analyst. Analyze the provided data and provide insights on:
- Market position
- Competitive landscape
- Strategic opportunities
- Long-term trends
- Strategic recommendations

Provide your analysis in a structured JSON format with sections for position, competition, opportunities, trends, and recommendations.`,
    };

    return prompts[analysisType as keyof typeof prompts] || prompts.strategic;
  }

  /**
   * Get system prompt for recommendations
   */
  private getRecommendationSystemPrompt(recommendationType: string): string {
    const prompts = {
      growth: `You are a business growth strategist. Based on the provided context, generate actionable growth recommendations:
- Market expansion opportunities
- Product/service development ideas
- Customer acquisition strategies
- Revenue optimization tactics
- Partnership opportunities

Provide recommendations in a structured JSON format with sections for opportunities, strategies, tactics, and partnerships.`,

      efficiency: `You are an efficiency optimization expert. Based on the provided context, generate efficiency improvement recommendations:
- Process optimization opportunities
- Resource allocation improvements
- Technology implementation suggestions
- Cost reduction strategies
- Performance enhancement tactics

Provide recommendations in a structured JSON format with sections for optimization, allocation, technology, cost reduction, and performance.`,

      risk: `You are a risk management specialist. Based on the provided context, generate risk mitigation recommendations:
- Identified risk factors
- Risk assessment and prioritization
- Mitigation strategies
- Monitoring and control measures
- Contingency plans

Provide recommendations in a structured JSON format with sections for risks, assessment, mitigation, monitoring, and contingencies.`,

      opportunity: `You are an opportunity identification expert. Based on the provided context, generate opportunity recommendations:
- Market opportunities
- Innovation possibilities
- Competitive advantages
- Strategic partnerships
- Investment opportunities

Provide recommendations in a structured JSON format with sections for markets, innovation, advantages, partnerships, and investments.`,
    };

    return prompts[recommendationType as keyof typeof prompts] || prompts.growth;
  }

  /**
   * Get system prompt for document drafting
   */
  private getDocumentSystemPrompt(documentType: string, tone: string): string {
    const tonePrompts = {
      professional: 'Use a professional tone suitable for business communication.',
      casual: 'Use a friendly, approachable tone while maintaining professionalism.',
      formal: 'Use a formal, authoritative tone appropriate for official documents.',
    };

    const documentPrompts = {
      proposal: `You are drafting a business proposal. ${tonePrompts[tone as keyof typeof tonePrompts]}
Structure the document with:
- Executive summary
- Problem statement
- Proposed solution
- Benefits and value proposition
- Implementation plan
- Budget and timeline
- Conclusion`,

      report: `You are drafting a business report. ${tonePrompts[tone as keyof typeof tonePrompts]}
Structure the document with:
- Executive summary
- Background and context
- Key findings
- Analysis and insights
- Conclusions
- Recommendations
- Appendices`,

      plan: `You are drafting a business plan. ${tonePrompts[tone as keyof typeof tonePrompts]}
Structure the document with:
- Executive summary
- Business overview
- Market analysis
- Strategy and implementation
- Financial projections
- Risk assessment
- Timeline and milestones`,

      email: `You are drafting a business email. ${tonePrompts[tone as keyof typeof tonePrompts]}
Keep it concise, clear, and actionable. Include:
- Clear subject line
- Professional greeting
- Main message
- Call to action
- Professional closing`,
    };

    return documentPrompts[documentType as keyof typeof documentPrompts] || documentPrompts.email;
  }


}
