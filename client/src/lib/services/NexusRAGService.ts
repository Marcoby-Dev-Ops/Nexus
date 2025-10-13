/**
 * Nexus RAG Service
 * 
 * Clean, focused RAG service that properly leverages the Nexus Knowledge domain.
 * Provides business-aware AI responses with comprehensive context integration.
 * 
 * The Knowledge domain contains:
 * - Business evidence and documentation
 * - Processes and procedures
 * - Company policies and guidelines
 * - Historical data and insights
 * - Best practices and standards
 */

import { callEdgeFunction } from '../api-client';
import { ckbRAGService } from './CKBRAGService';
import type { CKBResponse } from './CKBRAGService';
import { getPersona } from './personas';
import { logger } from '@/shared/utils/logger';

export interface NexusRAGContext {
  user: {
    id: string;
    name: string;
    role: string;
    department: string;
  };
  company: {
    id: string;
    name: string;
    industry: string;
    size: string;
    description?: string;
  } | null;
  agent: {
    id: string;
    type: string;
    capabilities: string[];
  };
  conversation: {
    id: string;
    history: Array<{
      role: string;
      content: string;
      timestamp: string;
    }>;
  };
  attachments: any[];
  ckbResponse?: CKBResponse;
}

export interface NexusRAGRequest {
  message: string;
  context: NexusRAGContext;
  agentId: string;
}

export interface NexusRAGResponse {
  success: boolean;
  data?: {
    content: string;
    sources: any[];
    confidence: number;
    recommendations: string[];
    businessContext: Record<string, any>;
    knowledgeTypes: string[];
  };
  error?: string;
}

export interface BusinessKnowledge {
  processes: any[];
  procedures: any[];
  policies: any[];
  evidence: any[];
  documentation: any[];
  bestPractices: any[];
  historicalData: any[];
}

class NexusRAGService {
  /**
   * Process a message with comprehensive RAG integration
   */
  async processMessage(request: NexusRAGRequest): Promise<NexusRAGResponse> {
    try {
      const { message, context, agentId } = request;

      // Step 1: Get comprehensive business knowledge from Nexus Knowledge domain
      let businessKnowledge: BusinessKnowledge | null = null;
      let ckbResponse: CKBResponse | null = null;
      
      if (context.company?.id) {
        try {
          logger.debug('Querying Nexus Knowledge Base for business documentation');
          
          // Get CKB RAG context
          ckbResponse = await ckbRAGService.queryCKB({
            query: message,
            companyId: context.company.id,
            department: context.user.department,
            includeBusinessData: true,
            includeHistoricalContext: true
          });

          // Get comprehensive business knowledge
          businessKnowledge = await this.getBusinessKnowledge(context.company.id, message);
          
          logger.info('Knowledge Base Response', {
            confidence: ckbResponse.confidence,
            sourcesCount: ckbResponse.sources.length,
            knowledgeTypes: businessKnowledge ? Object.keys(businessKnowledge).filter(key => (businessKnowledge as any)[key]?.length > 0) : [],
            hasRecommendations: ckbResponse.recommendations.length > 0
          });
        } catch (error) {
          logger.warn('Knowledge base query failed, continuing with basic context', { error });
        }
      }

      // Step 2: Build enhanced context with comprehensive knowledge
      const enhancedContext = this.buildEnhancedContext(context, ckbResponse, businessKnowledge, message);

      // Step 3: Generate AI response with comprehensive business context
      const aiResponse = await this.generateAIResponse(message, enhancedContext, agentId);

      return {
        success: true,
        data: {
          content: aiResponse.content,
          sources: ckbResponse?.sources || [],
          confidence: ckbResponse?.confidence || 0.8,
          recommendations: ckbResponse?.recommendations || [],
          businessContext: ckbResponse?.businessContext || {},
          knowledgeTypes: businessKnowledge ? this.getKnowledgeTypes(businessKnowledge) : []
        }
      };
    } catch (error) {
      logger.error('Nexus RAG processing error', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process message'
      };
    }
  }

  /**
   * Get comprehensive business knowledge from the Nexus Knowledge domain
   */
  private async getBusinessKnowledge(companyId: string, query: string): Promise<BusinessKnowledge> {
    try {
      // Query different types of business knowledge
      const [processes, procedures, policies, evidence, documentation, bestPractices, historicalData] = await Promise.all([
        this.queryBusinessProcesses(companyId, query),
        this.queryBusinessProcedures(companyId, query),
        this.queryBusinessPolicies(companyId, query),
        this.queryBusinessEvidence(companyId, query),
        this.queryBusinessDocumentation(companyId, query),
        this.queryBestPractices(companyId, query),
        this.queryHistoricalData(companyId, query)
      ]);

      return {
        processes,
        procedures,
        policies,
        evidence,
        documentation,
        bestPractices,
        historicalData
      };
    } catch (error) {
      logger.error('Error getting business knowledge', { error });
      return {
        processes: [],
        procedures: [],
        policies: [],
        evidence: [],
        documentation: [],
        bestPractices: [],
        historicalData: []
      };
    }
  }

  /**
   * Query business processes
   */
  private async queryBusinessProcesses(companyId: string, query: string): Promise<any[]> {
    try {
      const response = await callEdgeFunction('db_select', {
        table: 'business_processes',
        columns: ['id', 'name', 'description', 'steps', 'department', 'created_at'],
        where: { company_id: companyId },
        search: query,
        limit: 5
      });
      return response.success ? response.data || [] : [];
    } catch (error) {
      logger.warn('Error querying business processes', { error });
      return [];
    }
  }

  /**
   * Query business procedures
   */
  private async queryBusinessProcedures(companyId: string, query: string): Promise<any[]> {
    try {
      const response = await callEdgeFunction('db_select', {
        table: 'business_procedures',
        columns: ['id', 'name', 'description', 'procedure_steps', 'category', 'created_at'],
        where: { company_id: companyId },
        search: query,
        limit: 5
      });
      return response.success ? response.data || [] : [];
    } catch (error) {
      logger.warn('Error querying business procedures', { error });
      return [];
    }
  }

  /**
   * Query business policies
   */
  private async queryBusinessPolicies(companyId: string, query: string): Promise<any[]> {
    try {
      const response = await callEdgeFunction('db_select', {
        table: 'company_policies',
        columns: ['id', 'title', 'content', 'category', 'effective_date', 'created_at'],
        where: { company_id: companyId },
        search: query,
        limit: 5
      });
      return response.success ? response.data || [] : [];
    } catch (error) {
      logger.warn('Error querying business policies', { error });
      return [];
    }
  }

  /**
   * Query business evidence
   */
  private async queryBusinessEvidence(companyId: string, query: string): Promise<any[]> {
    try {
      const response = await callEdgeFunction('db_select', {
        table: 'business_evidence',
        columns: ['id', 'title', 'description', 'evidence_type', 'source', 'date_collected', 'created_at'],
        where: { company_id: companyId },
        search: query,
        limit: 5
      });
      return response.success ? response.data || [] : [];
    } catch (error) {
      logger.warn('Error querying business evidence', { error });
      return [];
    }
  }

  /**
   * Query business documentation
   */
  private async queryBusinessDocumentation(companyId: string, query: string): Promise<any[]> {
    try {
      const response = await callEdgeFunction('db_select', {
        table: 'company_documents',
        columns: ['id', 'title', 'content', 'document_type', 'department', 'created_at'],
        where: { company_id: companyId },
        search: query,
        limit: 5
      });
      return response.success ? response.data || [] : [];
    } catch (error) {
      logger.warn('Error querying business documentation', { error });
      return [];
    }
  }

  /**
   * Query best practices
   */
  private async queryBestPractices(companyId: string, query: string): Promise<any[]> {
    try {
      const response = await callEdgeFunction('db_select', {
        table: 'best_practices',
        columns: ['id', 'title', 'description', 'category', 'implementation_notes', 'created_at'],
        where: { company_id: companyId },
        search: query,
        limit: 5
      });
      return response.success ? response.data || [] : [];
    } catch (error) {
      logger.warn('Error querying best practices', { error });
      return [];
    }
  }

  /**
   * Query historical data
   */
  private async queryHistoricalData(companyId: string, query: string): Promise<any[]> {
    try {
      const response = await callEdgeFunction('db_select', {
        table: 'business_metrics_history',
        columns: ['id', 'metric_name', 'value', 'date_recorded', 'notes', 'created_at'],
        where: { company_id: companyId },
        search: query,
        limit: 5
      });
      return response.success ? response.data || [] : [];
    } catch (error) {
      logger.warn('Error querying historical data', { error });
      return [];
    }
  }

  /**
   * Build enhanced context with comprehensive knowledge
   */
  private buildEnhancedContext(
    baseContext: NexusRAGContext,
    ckbResponse: CKBResponse | null,
    businessKnowledge: BusinessKnowledge | null,
    message: string
  ): any {
    const enhancedContext = {
      ...baseContext,
      ckbResponse,
      businessKnowledge,
      ragContext: {
        hasKnowledgeBase: !!ckbResponse,
        confidence: ckbResponse?.confidence || 0,
        sourcesCount: ckbResponse?.sources?.length || 0,
        recommendations: ckbResponse?.recommendations || [],
        businessContext: ckbResponse?.businessContext || {},
        knowledgeTypes: businessKnowledge ? this.getKnowledgeTypes(businessKnowledge) : []
      },
      systemPrompt: this.buildSystemPrompt(baseContext, ckbResponse, businessKnowledge, message)
    };

    return enhancedContext;
  }

  /**
   * Get knowledge types that have data
   */
  private getKnowledgeTypes(businessKnowledge: BusinessKnowledge): string[] {
    const types = [];
    if (businessKnowledge.processes.length > 0) types.push('Processes');
    if (businessKnowledge.procedures.length > 0) types.push('Procedures');
    if (businessKnowledge.policies.length > 0) types.push('Policies');
    if (businessKnowledge.evidence.length > 0) types.push('Evidence');
    if (businessKnowledge.documentation.length > 0) types.push('Documentation');
    if (businessKnowledge.bestPractices.length > 0) types.push('Best Practices');
    if (businessKnowledge.historicalData.length > 0) types.push('Historical Data');
    return types;
  }

  /**
   * Build intelligent system prompt based on comprehensive business context
   */
  private buildSystemPrompt(
    context: NexusRAGContext,
    ckbResponse: CKBResponse | null,
    businessKnowledge: BusinessKnowledge | null,
    message: string
  ): string {
    // Prepend persona-specific system intro when available
    const persona = getPersona(context.agent?.id);
  const promptIntro = persona?.systemIntro ? `${persona.systemIntro}

` : '';

  const userTone = (context.user as any)?.preferredTone || persona?.tone || 'professional';

  let prompt = `${promptIntro}You are ${persona?.name || context.agent.id}, a specialized AI assistant for ${context.company?.name || 'business operations'}.

Your capabilities include: ${context.agent.capabilities.join(', ')}.

User Context:
- Name: ${context.user.name}
- Role: ${context.user.role}
- Department: ${context.user.department}
${context.company ? `- Company: ${context.company.name} (${context.company.industry} industry, ${context.company.size})` : ''}

Conversation History: ${context.conversation.history.length} messages
Tone: ${userTone}`;

    // Add RAG context if available
    if (ckbResponse) {
      prompt += `

KNOWLEDGE BASE CONTEXT (Confidence: ${Math.round(ckbResponse.confidence * 100)}%):
${ckbResponse.sources.map(source => `- ${source.content.substring(0, 200)}...`).join('\n')}

BUSINESS RECOMMENDATIONS:
${ckbResponse.recommendations.map(rec => `- ${rec}`).join('\n')}

BUSINESS CONTEXT:
${JSON.stringify(ckbResponse.businessContext, null, 2)}`;
    }

    // Add comprehensive business knowledge if available
    if (businessKnowledge) {
      prompt += `

COMPREHENSIVE BUSINESS KNOWLEDGE:

${businessKnowledge.processes.length > 0 ? `BUSINESS PROCESSES:
${businessKnowledge.processes.map(process => `- ${process.name}: ${process.description}`).join('\n')}` : ''}

${businessKnowledge.procedures.length > 0 ? `BUSINESS PROCEDURES:
${businessKnowledge.procedures.map(proc => `- ${proc.name}: ${proc.description}`).join('\n')}` : ''}

${businessKnowledge.policies.length > 0 ? `COMPANY POLICIES:
${businessKnowledge.policies.map(policy => `- ${policy.title}: ${policy.content.substring(0, 150)}...`).join('\n')}` : ''}

${businessKnowledge.evidence.length > 0 ? `BUSINESS EVIDENCE:
${businessKnowledge.evidence.map(evidence => `- ${evidence.title} (${evidence.evidence_type}): ${evidence.description}`).join('\n')}` : ''}

${businessKnowledge.documentation.length > 0 ? `COMPANY DOCUMENTATION:
${businessKnowledge.documentation.map(doc => `- ${doc.title} (${doc.document_type}): ${doc.content.substring(0, 150)}...`).join('\n')}` : ''}

${businessKnowledge.bestPractices.length > 0 ? `BEST PRACTICES:
${businessKnowledge.bestPractices.map(bp => `- ${bp.title}: ${bp.description}`).join('\n')}` : ''}

${businessKnowledge.historicalData.length > 0 ? `HISTORICAL DATA:
${businessKnowledge.historicalData.map(data => `- ${data.metric_name}: ${data.value} (${data.date_recorded})`).join('\n')}` : ''}`;
    }

    prompt += `

Instructions:
1. Provide accurate, helpful responses based on the available business knowledge
2. Reference specific processes, procedures, and policies when relevant
3. Use evidence and historical data to support recommendations
4. Follow established best practices and company documentation
5. Offer actionable recommendations based on company procedures
6. Maintain professional, business-focused communication
7. Consider the user's role and department context in your responses
8. When referencing company knowledge, cite the specific source (process, procedure, policy, etc.)

Current message: "${message}"`;

    return prompt;
  }

  /**
   * Generate AI response with comprehensive context
   */
  private async generateAIResponse(
    message: string,
    enhancedContext: any,
    agentId: string
  ): Promise<{ content: string }> {
    const response = await callEdgeFunction('ai_chat', {
      message,
      context: enhancedContext,
      agent: agentId
    });

    if (response.success && response.data) {
      const responseData = response.data as any;
      return {
        content: responseData.content || responseData.message || 'I apologize, but I couldn\'t process that request. Please try again.'
      };
    } else {
      throw new Error(response.error || 'Failed to generate AI response');
    }
  }

  /**
   * Get RAG statistics for a company
   */
  async getRAGStats(companyId: string): Promise<{
    totalDocuments: number;
    documentTypes: Record<string, number>;
    lastUpdated: string;
    confidence: number;
    knowledgeTypes: string[];
  }> {
    try {
      const ckbContext = await ckbRAGService.getCKBContext(companyId);
      const businessKnowledge = await this.getBusinessKnowledge(companyId, '');
      
      return {
        ...ckbContext.knowledgeBase,
        confidence: 0.85,
        knowledgeTypes: this.getKnowledgeTypes(businessKnowledge)
      };
    } catch (error) {
      logger.error('Error getting RAG stats', { error });
      return {
        totalDocuments: 0,
        documentTypes: {},
        lastUpdated: new Date().toISOString(),
        confidence: 0,
        knowledgeTypes: []
      };
    }
  }

  /**
   * Check if RAG is available for a company
   */
  async isRAGAvailable(companyId: string): Promise<boolean> {
    try {
      const stats = await this.getRAGStats(companyId);
      return stats.totalDocuments > 0 && stats.confidence > 0.5;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const nexusRAGService = new NexusRAGService();
