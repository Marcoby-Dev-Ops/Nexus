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
import type { CKBQuery, CKBResponse } from './CKBRAGService';

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
  // Optional AbortSignal to support cancellation
  signal?: AbortSignal;
  // Optional streaming chunk callback
  onChunk?: (chunk: string) => void;
  // Optional request identifier to enable server-side cancellation
  requestId?: string;
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
    serverMessage?: any; // optional persisted message representation
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
  private readonly buildingBlockKeywords: Record<string, string[]> = {
    identity: ['identity', 'mission', 'vision', 'brand', 'positioning', 'value proposition'],
    revenue: ['revenue', 'sales', 'growth', 'pricing', 'pipeline', 'deal', 'customer acquisition'],
    cash: ['cash', 'finance', 'budget', 'expense', 'profit', 'loss', 'forecast', 'financial'],
    delivery: ['delivery', 'operations', 'fulfillment', 'service delivery', 'logistics', 'production'],
    people: ['people', 'team', 'hiring', 'talent', 'culture', 'hr', 'human resources'],
    knowledge: ['knowledge', 'documentation', 'training', 'learning', 'playbook', 'sop'],
    systems: ['systems', 'process', 'automation', 'tech stack', 'technology', 'workflow', 'infrastructure']
  };

  private readonly agentBuildingBlockMap: Record<string, string> = {
    'business-identity-consultant': 'identity',
    'sales-expert': 'revenue',
    'finance-expert': 'cash',
    'operations-expert': 'delivery',
    'people-expert': 'people',
    'knowledge-expert': 'knowledge',
    'systems-expert': 'systems'
  };

  /**
   * Process a message with comprehensive RAG integration
   */
  async processMessage(request: NexusRAGRequest): Promise<NexusRAGResponse> {
    try {
      const { message, context, agentId } = request;
      const trimmedMessage = message.trim();

      // Handle greetings/small talk without invoking RAG
      if (!trimmedMessage || this.isSmallTalk(trimmedMessage)) {
        const minimalContext = this.buildEnhancedContext(context, null, null, trimmedMessage);
        // Forward optional cancellation info so generateAIResponse can include it
        (minimalContext as any)._signal = (request as any).signal;
        (minimalContext as any)._requestId = (request as any).requestId;
        const aiResponse = await this.generateAIResponse(trimmedMessage, minimalContext, agentId);
        return {
          success: true,
          data: {
            content: aiResponse.content,
            sources: [],
            confidence: 0,
            recommendations: [],
            businessContext: {},
            knowledgeTypes: []
          }
        };
      }

      // Determine whether the message maps to one of the seven building blocks
      const buildingBlock = this.detectBuildingBlock(trimmedMessage) || this.detectBuildingBlockFromAgent(agentId);
  const companyId = context.company?.id || null;
  const shouldUseKnowledge = !!buildingBlock && !!companyId;

      // Step 1: Get comprehensive business knowledge limited to the identified building block
      let businessKnowledge: BusinessKnowledge | null = null;
      let ckbResponse: CKBResponse | null = null;
      
      if (shouldUseKnowledge && companyId) {
        try {
          console.log('🔍 Querying Nexus Knowledge Base for building block:', buildingBlock);
          
          // Get CKB RAG context
          ckbResponse = await ckbRAGService.queryCKB({
            query: `${buildingBlock} ${trimmedMessage}`,
            companyId,
            department: buildingBlock,
            includeBusinessData: true,
            includeHistoricalContext: true
          });

          // Get comprehensive business knowledge
          businessKnowledge = await this.getBusinessKnowledge(companyId, `${buildingBlock} ${trimmedMessage}`);
          
          console.log('✅ Knowledge Base Response:', {
            confidence: ckbResponse.confidence,
            sourcesCount: ckbResponse.sources.length,
            knowledgeTypes: businessKnowledge ? Object.keys(businessKnowledge).filter(key => businessKnowledge![key as keyof BusinessKnowledge]?.length > 0) : [],
            hasRecommendations: ckbResponse.recommendations.length > 0
          });
        } catch (error) {
          console.warn('⚠️ Knowledge base query failed, continuing with basic context:', error);
        }
      }

      // Step 2: Build enhanced context with comprehensive knowledge
      const enhancedContext = this.buildEnhancedContext(context, ckbResponse, businessKnowledge, trimmedMessage);

  // Step 3: Generate AI response with comprehensive business context
  // Attach optional signal/requestId for cooperative cancellation
  (enhancedContext as any)._signal = (request as any).signal;
  (enhancedContext as any)._requestId = (request as any).requestId;
  const aiResponse = await this.generateAIResponse(trimmedMessage, enhancedContext, agentId);

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
      console.error('❌ Nexus RAG processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process message'
      };
    }
  }

  private detectBuildingBlock(message: string): string | null {
    const lower = message.toLowerCase();
    for (const [block, keywords] of Object.entries(this.buildingBlockKeywords)) {
      if (keywords.some(keyword => lower.includes(keyword))) {
        return block;
      }
    }
    return null;
  }

  private detectBuildingBlockFromAgent(agentId: string): string | null {
    return this.agentBuildingBlockMap[agentId] || null;
  }

  private isSmallTalk(message: string): boolean {
    const normalized = message.toLowerCase().trim();
    const smallTalkPhrases = [
      'hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening',
      'thanks', 'thank you', 'bye', 'goodbye', 'how are you'
    ];
    return smallTalkPhrases.includes(normalized) || normalized.length <= 15 && /^(hi|hello|hey|thanks|thank you|yo|sup)$/i.test(normalized);
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
      console.error('Error getting business knowledge:', error);
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
      console.warn('Error querying business processes:', error);
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
      console.warn('Error querying business procedures:', error);
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
      console.warn('Error querying business policies:', error);
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
      console.warn('Error querying business evidence:', error);
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
      console.warn('Error querying business documentation:', error);
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
      console.warn('Error querying best practices:', error);
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
      console.warn('Error querying historical data:', error);
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
    let prompt = `You are ${context.agent.id}, a specialized AI assistant for ${context.company?.name || 'business operations'}.

Your capabilities include: ${context.agent.capabilities.join(', ')}.

User Context:
- Name: ${context.user.name}
- Role: ${context.user.role}
- Department: ${context.user.department}
${context.company ? `- Company: ${context.company.name} (${context.company.industry} industry, ${context.company.size})` : ''}

Conversation History: ${context.conversation.history.length} messages`;

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

    // If contact information is provided in context, add a strict PII output template
    try {
      if ((context as any)?.contact) {
        const contactInstructions = `

PII HANDLING INSTRUCTIONS:
- The context includes the user's contact information. Only reveal personally identifiable information (PII) when explicitly requested by the user.
- If asked for the user's phone number, respond using THIS EXACT, SINGLE-LINE TEMPLATE and nothing else:
  "Your phone number on file is: {{phone}}"
  Replace {{phone}} only with the phone number provided in the context.contact.phone field. Do NOT add any extra commentary, formatting, or additional PII.
- If the contact.phone field is missing or blank, respond exactly with: "I do not have a phone number on file."
- Do NOT hallucinate, invent, or guess phone numbers or other contact details. If unsure, say you don't have the information.
- Never include other contact fields (email, address) unless explicitly asked and present in the context; if asked, follow the same single-line template pattern for that field (e.g., "Your email on file is: {{email}}").
`;

        prompt += contactInstructions;
      }
    } catch (piiErr) {
      // Non-fatal: don't break prompt generation if context is unexpected
      console.warn('Failed to append PII instructions to system prompt:', piiErr);
    }

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
    // If the caller provided a signal/requestId, forward them via the payload
    const payload: Record<string, unknown> = {
      message,
      context: enhancedContext,
      agent: agentId
    };

    // Try to detect if the caller passed through a signal/requestId by inspecting
    // the enhancedContext (higher-level callers attach them there). This is a
    // best-effort approach; explicit wiring from callers is preferred.
    const possibleSignal = (enhancedContext as any)?._signal as AbortSignal | undefined;
    const possibleRequestId = (enhancedContext as any)?._requestId as string | undefined;

    if (possibleRequestId) payload.requestId = possibleRequestId;

    const response = await callEdgeFunction('ai_chat', payload, { signal: possibleSignal });

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
      console.error('Error getting RAG stats:', error);
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
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const nexusRAGService = new NexusRAGService();
