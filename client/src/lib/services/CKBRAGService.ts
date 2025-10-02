/**
 * CKB (Company Knowledge Base) RAG Service
 * 
 * This service integrates RAG functionality with your existing CKB system,
 * leveraging the company_knowledge_vectors table and business intelligence data.
 */

import { callEdgeFunction } from '../api-client';
import ragService from './RAGService';
import type { RAGContext, DocumentChunk } from './RAGTypes';

export interface CKBContext {
  companyId: string;
  companyName: string;
  industry: string;
  businessIntelligence: {
    activeIntegrations: string[];
    performanceMetrics: Record<string, any>;
    businessContext: Record<string, any>;
    aiInsights: any[];
  };
  knowledgeBase: {
    totalDocuments: number;
    documentTypes: Record<string, number>;
    lastUpdated: string;
  };
}

export interface CKBQuery {
  query: string;
  companyId: string;
  department?: string;
  includeBusinessData?: boolean;
  includeHistoricalContext?: boolean;
}

export interface CKBResponse {
  answer: string;
  sources: DocumentChunk[];
  businessContext: Record<string, any>;
  confidence: number;
  recommendations: string[];
}

class CKBRAGService {
  private defaultLimit = 5;
  private defaultThreshold = 0.7;

  /**
   * Get comprehensive CKB context for a company
   */
  async getCKBContext(companyId: string): Promise<CKBContext> {
    try {
      // Get company information
      const companyResponse = await callEdgeFunction('db_select', {
        table: 'companies',
        columns: ['id', 'name', 'industry'],
        where: { id: companyId }
      });

      const company = companyResponse.success && companyResponse.data?.[0]
        ? companyResponse.data[0]
        : {
            id: companyId,
            name: 'Unknown Company',
            industry: 'Unknown'
          };

      // Get business intelligence data
      const intelligenceResponse = await callEdgeFunction('db_select', {
        table: 'company_intelligence_profiles',
        columns: ['active_integrations', 'performance_metrics', 'business_context', 'ai_insights'],
        where: { company_id: companyId }
      });

      const intelligence = intelligenceResponse.success ? intelligenceResponse.data?.[0] : {};

      // Get knowledge base statistics
      const kbStats = await ragService.getRAGStats(companyId);

      return {
        companyId,
        companyName: company.name,
        industry: company.industry || 'Unknown',
        businessIntelligence: {
          activeIntegrations: intelligence.active_integrations || [],
          performanceMetrics: intelligence.performance_metrics || {},
          businessContext: intelligence.business_context || {},
          aiInsights: intelligence.ai_insights || []
        },
        knowledgeBase: kbStats
      };
    } catch (error) {
      console.error('Error getting CKB context:', error);
      throw error;
    }
  }

  /**
   * Enhanced RAG query with CKB integration
   */
  async queryCKB(request: CKBQuery): Promise<CKBResponse> {
    try {
      const { query, companyId, department, includeBusinessData = true, includeHistoricalContext = true } = request;

      // Get CKB context
      const ckbContext = await this.getCKBContext(companyId);

      // Build enhanced RAG context
      const ragContext = await this.buildEnhancedRAGContext(query, ckbContext, department);

      // Generate AI response with CKB context
      const response = await this.generateCKBResponse(query, ragContext, ckbContext);

      return response;
    } catch (error) {
      console.error('Error querying CKB:', error);
      throw error;
    }
  }

  /**
   * Build enhanced RAG context with CKB data
   */
  private async buildEnhancedRAGContext(
    query: string, 
    ckbContext: CKBContext, 
    department?: string
  ): Promise<RAGContext> {
    // Get base RAG context
    const baseRAGContext = await ragService.buildRAGContext(
      query,
      ckbContext.companyId,
      {
        company: ckbContext.companyName,
        industry: ckbContext.industry,
        role: department || 'general'
      }
    );

    // Enhance with business intelligence data
    const enhancedDocuments = await this.enhanceWithBusinessData(
      baseRAGContext.relevantDocuments,
      ckbContext,
      query
    );

    return {
      ...baseRAGContext,
      relevantDocuments: enhancedDocuments
    };
  }

  /**
   * Enhance documents with business intelligence data
   */
  private async enhanceWithBusinessData(
    documents: DocumentChunk[],
    ckbContext: CKBContext,
    query: string
  ): Promise<DocumentChunk[]> {
    const enhancedDocuments = [...documents];

    // Add business intelligence as context documents
    if (ckbContext.businessIntelligence.performanceMetrics) {
      enhancedDocuments.push({
        id: 'business_metrics',
        content: `Current Business Performance: ${JSON.stringify(ckbContext.businessIntelligence.performanceMetrics, null, 2)}`,
        contentType: 'business_intelligence',
        metadata: {
          source: 'company_intelligence_profiles',
          type: 'performance_metrics',
          relevance: 'high'
        },
        similarity: 0.9
      });
    }

    // Add AI insights if relevant
    if (ckbContext.businessIntelligence.aiInsights?.length > 0) {
      const relevantInsights = ckbContext.businessIntelligence.aiInsights
        .filter(insight => this.isInsightRelevant(insight, query))
        .slice(0, 3);

      if (relevantInsights.length > 0) {
        enhancedDocuments.push({
          id: 'ai_insights',
          content: `AI-Generated Insights: ${JSON.stringify(relevantInsights, null, 2)}`,
          contentType: 'ai_insights',
          metadata: {
            source: 'ai_analysis',
            type: 'insights',
            relevance: 'high'
          },
          similarity: 0.85
        });
      }
    }

    // Add integration context
    if (ckbContext.businessIntelligence.activeIntegrations?.length > 0) {
      enhancedDocuments.push({
        id: 'integrations',
        content: `Active Business Integrations: ${ckbContext.businessIntelligence.activeIntegrations.join(', ')}`,
        contentType: 'integrations',
        metadata: {
          source: 'company_intelligence_profiles',
          type: 'integrations',
          relevance: 'medium'
        },
        similarity: 0.7
      });
    }

    return enhancedDocuments;
  }

  /**
   * Check if AI insight is relevant to the query
   */
  private isInsightRelevant(insight: any, query: string): boolean {
    const queryLower = query.toLowerCase();
    const insightText = JSON.stringify(insight).toLowerCase();
    
    // Simple relevance check - can be enhanced with more sophisticated logic
    const relevantKeywords = ['sales', 'revenue', 'growth', 'performance', 'metrics', 'trends'];
    return relevantKeywords.some(keyword => 
      queryLower.includes(keyword) && insightText.includes(keyword)
    );
  }

  /**
   * Generate AI response with CKB context
   */
  private async generateCKBResponse(
    query: string, 
    ragContext: RAGContext, 
    ckbContext: CKBContext
  ): Promise<CKBResponse> {
    try {
      // Format RAG context for AI prompt
      const ragPrompt = ragService.formatRAGContextForPrompt(ragContext);

      // Build comprehensive system prompt
      const systemPrompt = this.buildCKBSystemPrompt(ckbContext, ragPrompt);

      // Call AI with enhanced context
      const response = await callEdgeFunction('ai_chat', {
        message: query,
        context: {
          systemPrompt,
          businessContext: ckbContext.businessIntelligence,
          ragContext: ragContext,
          companyContext: {
            name: ckbContext.companyName,
            industry: ckbContext.industry,
            knowledgeBaseSize: ckbContext.knowledgeBase.totalDocuments
          }
        }
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to generate response');
      }

      // Extract recommendations from response
      const recommendations = this.extractRecommendations(response.data.message);

      return {
        answer: response.data.message,
        sources: ragContext.relevantDocuments,
        businessContext: ckbContext.businessIntelligence,
        confidence: ragContext.confidence,
        recommendations
      };
    } catch (error) {
      console.error('Error generating CKB response:', error);
      throw error;
    }
  }

  /**
   * Build comprehensive system prompt for CKB
   */
  private buildCKBSystemPrompt(ckbContext: CKBContext, ragPrompt: string): string {
    const systemPrompt = `You are an expert business advisor with access to ${ckbContext.companyName}'s comprehensive knowledge base and business intelligence data.

COMPANY CONTEXT:
- Company: ${ckbContext.companyName}
- Industry: ${ckbContext.industry}
- Knowledge Base: ${ckbContext.knowledgeBase.totalDocuments} documents
- Active Integrations: ${ckbContext.businessIntelligence.activeIntegrations.join(', ')}

BUSINESS INTELLIGENCE:
${JSON.stringify(ckbContext.businessIntelligence, null, 2)}

INSTRUCTIONS:
1. Use the company's knowledge base and business intelligence to provide accurate, contextual responses
2. Reference specific data points and insights when relevant
3. Provide actionable recommendations based on the company's current state
4. Consider the company's industry and business context
5. If you reference information, cite the source (knowledge base document, business metric, etc.)

${ragPrompt}`;

    return systemPrompt;
  }

  /**
   * Extract actionable recommendations from AI response
   */
  private extractRecommendations(response: string): string[] {
    const recommendations: string[] = [];
    
    // Simple extraction logic - can be enhanced with more sophisticated parsing
    const lines = response.split('\n');
    for (const line of lines) {
      if (line.includes('recommend') || line.includes('suggest') || line.includes('should') || line.includes('consider')) {
        recommendations.push(line.trim());
      }
    }
    
    return recommendations.slice(0, 3); // Limit to top 3 recommendations
  }

  /**
   * Store company knowledge in CKB
   */
  async storeCompanyKnowledge(
    content: string,
    contentType: string,
    companyId: string,
    metadata: Record<string, any> = {}
  ): Promise<boolean> {
    try {
      // Store in vector database
      const success = await ragService.storeDocument(content, contentType, companyId, {
        ...metadata,
        source: 'ckb',
        storedAt: new Date().toISOString()
      });

      if (success) {
        // Update CKB statistics
        await this.updateCKBStats(companyId);
      }

      return success;
    } catch (error) {
      console.error('Error storing company knowledge:', error);
      return false;
    }
  }

  /**
   * Update CKB statistics
   */
  private async updateCKBStats(companyId: string): Promise<void> {
    try {
      // This would typically update a CKB stats table
      // For now, we'll just log the update
      console.log(`CKB stats updated for company ${companyId}`);
    } catch (error) {
      console.error('Error updating CKB stats:', error);
    }
  }

  /**
   * Get CKB analytics
   */
  async getCKBAnalytics(companyId: string): Promise<{
    totalDocuments: number;
    documentTypes: Record<string, number>;
    queryHistory: any[];
    popularTopics: string[];
    knowledgeGaps: string[];
  }> {
    try {
      const kbStats = await ragService.getRAGStats(companyId);
      
      // This would typically include more analytics
      // For now, return basic stats
      return {
        totalDocuments: kbStats.totalDocuments,
        documentTypes: kbStats.documentTypes,
        queryHistory: [],
        popularTopics: [],
        knowledgeGaps: []
      };
    } catch (error) {
      console.error('Error getting CKB analytics:', error);
      throw error;
    }
  }
}

export const ckbRAGService = new CKBRAGService();
export default ckbRAGService;
