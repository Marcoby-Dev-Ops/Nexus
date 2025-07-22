/**
 * Domain Agent Service
 * 
 * Provides specialized AI agents with domain-specific knowledge, tools, and contextual awareness.
 * Each domain agent has access to relevant business data, specialized prompts, and department-specific tools.
 */

import type { Agent} from '@/domains/ai/lib/agentRegistry';
import { agentRegistry, getAgentsByDepartment } from '@/domains/ai/lib/agentRegistry';
import { BusinessHealthService } from '../services/businessHealthService';
import { supabase } from '@/core/supabase';

export interface DomainContext {
  departmentId: string;
  recentKPIs?: Record<string, any>;
  relevantData?: Record<string, any>;
  businessHealth?: any;
  userRole?: string;
  companyId?: string;
}

export interface EnhancedAgent extends Agent {
  domainContext: DomainContext;
  availableTools: string[];
  contextualKnowledge: string[];
  recentInsights: string[];
}

export class DomainAgentService {
  private businessHealthService: BusinessHealthService;

  constructor() {
    this.businessHealthService = new BusinessHealthService();
  }

  /**
   * Get an enhanced agent with domain-specific context and capabilities
   */
  async getEnhancedAgent(agentId: string, userContext?: any): Promise<EnhancedAgent | null> {
    const baseAgent = agentRegistry.find(agent => agent.id === agentId);
    if (!baseAgent) return null;

    const domainContext = await this.buildDomainContext(baseAgent, userContext);
    const availableTools = this.getAvailableTools(baseAgent);
    const contextualKnowledge = await this.getContextualKnowledge(baseAgent, domainContext);
    const recentInsights = await this.getRecentInsights(baseAgent, domainContext);

    return {
      ...baseAgent,
      domainContext,
      availableTools,
      contextualKnowledge,
      recentInsights
    };
  }

  /**
   * Build domain-specific context for an agent
   */
  private async buildDomainContext(agent: Agent, userContext?: any): Promise<DomainContext> {
    const departmentId = agent.department || 'executive';
    
    try {
      // Get recent KPIs for the department
      const recentKPIs = await this.getRecentKPIs(departmentId, userContext?.companyId);
      
      // Get business health data
      const businessHealth = await this.businessHealthService.getBusinessHealth();
      
      // Get department-specific data
      const relevantData = await this.getDepartmentData(departmentId, userContext?.companyId);

      return {
        departmentId,
        recentKPIs,
        relevantData,
        businessHealth,
        userRole: userContext?.role,
        companyId: userContext?.companyId
      };
    } catch (error) {
      console.error('Error building domain context:', error);
      return {
        departmentId,
        userRole: userContext?.role,
        companyId: userContext?.companyId
      };
    }
  }

  /**
   * Get recent KPIs for a department
   */
  private async getRecentKPIs(departmentId: string, companyId?: string): Promise<Record<string, any>> {
    if (!companyId) return {};

    try {
      const { data, error } = await supabase
        .from('ai_kpi_snapshots')
        .select('kpi_id, value, captured_at')
        .eq('org_id', companyId)
        .eq('department_id', departmentId)
        .gte('captured_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
        .order('captured_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const kpis: Record<string, any> = {};
      data?.forEach(kpi => {
        kpis[kpi.kpi_id] = {
          value: kpi.value,
          captured_at: kpi.captured_at
        };
      });

      return kpis;
    } catch (error) {
      console.error('Error fetching recent KPIs:', error);
      return {};
    }
  }

  /**
   * Get department-specific data
   */
  private async getDepartmentData(departmentId: string, companyId?: string): Promise<Record<string, any>> {
    if (!companyId) return {};

    const data: Record<string, any> = {};

    try {
      switch (departmentId) {
        case 'sales':
          data.deals = await this.getSalesData(companyId);
          data.contacts = await this.getContactData(companyId);
          break;
        case 'marketing':
          data.campaigns = await this.getMarketingData(companyId);
          break;
        case 'finance':
          data.financial_metrics = await this.getFinancialData(companyId);
          break;
        case 'operations':
          data.operational_metrics = await this.getOperationalData(companyId);
          break;
        case 'support':
          data.support_metrics = await this.getSupportData(companyId);
          break;
      }
    } catch (error) {
      console.error(`Error fetching ${departmentId} data:`, error);
    }

    return data;
  }

  /**
   * Get sales-specific data
   */
  private async getSalesData(companyId: string): Promise<any> {
    try {
      const { data: deals, error } = await supabase
        .from('deals')
        .select('*')
        .gte('lastSyncedAt', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
        .order('lastSyncedAt', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Calculate sales metrics
      const openDeals = deals?.filter(deal => !deal.stage?.toLowerCase().includes('closed')) || [];
      const closedWonDeals = deals?.filter(deal => 
        deal.stage?.toLowerCase().includes('closed') && 
        deal.stage?.toLowerCase().includes('won')
      ) || [];
      const totalPipelineValue = openDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0);
      const conversionRate = deals?.length ? (closedWonDeals.length / deals.length) * 100 : 0;

      return {
        recent_deals: deals?.slice(0, 10),
        pipeline_summary: {
          open_deals_count: openDeals.length,
          total_pipeline_value: totalPipelineValue,
          closed_won_count: closedWonDeals.length,
          conversion_rate: conversionRate
        }
      };
    } catch (error) {
      console.error('Error fetching sales data:', error);
      return {};
    }
  }

  /**
   * Get contact data
   */
  private async getContactData(companyId: string): Promise<any> {
    try {
      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('companyId', companyId)
        .gte('lastSyncedAt', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('lastSyncedAt', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Calculate engagement metrics
      const totalContacts = contacts?.length || 0;
      const totalEmailOpens = contacts?.reduce((sum, contact) => 
        sum + (parseInt(contact.properties?.email_opens) || 0), 0) || 0;
      const totalResponses = contacts?.reduce((sum, contact) => 
        sum + (parseInt(contact.properties?.responses) || 0), 0) || 0;

      return {
        recent_contacts: contacts?.slice(0, 10),
        engagement_summary: {
          total_contacts: totalContacts,
          total_email_opens: totalEmailOpens,
          total_responses: totalResponses,
          response_rate: totalEmailOpens ? (totalResponses / totalEmailOpens) * 100 : 0
        }
      };
    } catch (error) {
      console.error('Error fetching contact data:', error);
      return {};
    }
  }

  /**
   * Get marketing data (placeholder - would integrate with actual marketing platforms)
   */
  private async getMarketingData(companyId: string): Promise<any> {
    // This would integrate with marketing platforms like HubSpot, Google Analytics, etc.
    return {
      placeholder: 'Marketing data integration pending'
    };
  }

  /**
   * Get financial data (placeholder - would integrate with accounting systems)
   */
  private async getFinancialData(companyId: string): Promise<any> {
    // This would integrate with financial systems like QuickBooks, Stripe, etc.
    return {
      placeholder: 'Financial data integration pending'
    };
  }

  /**
   * Get operational data (placeholder - would integrate with operational systems)
   */
  private async getOperationalData(companyId: string): Promise<any> {
    // This would integrate with operational systems like monitoring tools, etc.
    return {
      placeholder: 'Operational data integration pending'
    };
  }

  /**
   * Get support data (placeholder - would integrate with support systems)
   */
  private async getSupportData(companyId: string): Promise<any> {
    // This would integrate with support systems like Zendesk, Intercom, etc.
    return {
      placeholder: 'Support data integration pending'
    };
  }

  /**
   * Get available tools for an agent
   */
  private getAvailableTools(agent: Agent): string[] {
    const basTools = ['web_search', 'data_analysis', 'report_generation'];
    
    const departmentTools: Record<string, string[]> = {
      sales: ['crm_integration', 'pipeline_analysis', 'lead_scoring', 'sales_forecasting'],
      marketing: ['campaign_analysis', 'seo_tools', 'social_media_analytics', 'content_generation'],
      finance: ['financial_modeling', 'budget_analysis', 'cost_optimization', 'roi_calculation'],
      operations: ['process_optimization', 'automation_tools', 'performance_monitoring', 'workflow_design'],
      support: ['ticket_analysis', 'knowledge_base_search', 'customer_sentiment', 'escalation_management']
    };

    const agentTools = agent.department ? departmentTools[agent.department] || [] : [];
    
    return [...basTools, ...agentTools];
  }

  /**
   * Get contextual knowledge for an agent
   */
  private async getContextualKnowledge(agent: Agent, context: DomainContext): Promise<string[]> {
    const knowledge: string[] = [];

    // Add agent's core knowledge
    if (agent.knowledgeBase.frameworks) {
      knowledge.push(`Frameworks: ${agent.knowledgeBase.frameworks.join(', ')}`);
    }
    
    if (agent.knowledgeBase.tools) {
      knowledge.push(`Tools: ${agent.knowledgeBase.tools.join(', ')}`);
    }

    // Add contextual business knowledge
    if (context.businessHealth) {
      const score = context.businessHealth.score || 0;
      knowledge.push(`Current business health score: ${score}/100`);
      
      if (context.businessHealth.breakdown) {
        const deptScore = context.businessHealth.breakdown[context.departmentId];
        if (deptScore !== undefined) {
          knowledge.push(`${context.departmentId} department score: ${deptScore}/100`);
        }
      }
    }

    // Add recent KPI insights
    if (context.recentKPIs && Object.keys(context.recentKPIs).length > 0) {
      knowledge.push(`Recent KPIs available for: ${Object.keys(context.recentKPIs).join(', ')}`);
    }

    return knowledge;
  }

  /**
   * Get recent insights for an agent
   */
  private async getRecentInsights(agent: Agent, context: DomainContext): Promise<string[]> {
    const insights: string[] = [];

    // Generate department-specific insights based on data
    if (context.relevantData) {
      switch (context.departmentId) {
        case 'sales':
          if (context.relevantData.deals?.pipeline_summary) {
            const summary = context.relevantData.deals.pipeline_summary;
            insights.push(`Pipeline: ${summary.open_deals_count} open deals worth $${summary.total_pipeline_value?.toLocaleString()}`);
            insights.push(`Conversion rate: ${summary.conversion_rate?.toFixed(1)}%`);
          }
          break;
        case 'marketing':
          // Add marketing-specific insights
          break;
        case 'finance':
          // Add finance-specific insights
          break;
        case 'operations':
          // Add operations-specific insights
          break;
        case 'support':
          // Add support-specific insights
          break;
      }
    }

    return insights;
  }

  /**
   * Generate enhanced system prompt with domain context
   */
  generateEnhancedSystemPrompt(enhancedAgent: EnhancedAgent): string {
    const basePrompt = enhancedAgent.systemPrompt;
    
    const contextAdditions: string[] = [];
    
    // Add business context
    if (enhancedAgent.domainContext.businessHealth) {
      contextAdditions.push(`\nCURRENT BUSINESS CONTEXT:
- Overall business health score: ${enhancedAgent.domainContext.businessHealth.score}/100
- Department score: ${enhancedAgent.domainContext.businessHealth.breakdown?.[enhancedAgent.domainContext.departmentId] || 'N/A'}/100`);
    }

    // Add recent insights
    if (enhancedAgent.recentInsights.length > 0) {
      contextAdditions.push(`\nRECENT INSIGHTS:
${enhancedAgent.recentInsights.map(insight => `- ${insight}`).join('\n')}`);
    }

    // Add available tools
    if (enhancedAgent.availableTools.length > 0) {
      contextAdditions.push(`\nAVAILABLE TOOLS:
${enhancedAgent.availableTools.map(tool => `- ${tool}`).join('\n')}`);
    }

    // Add contextual knowledge
    if (enhancedAgent.contextualKnowledge.length > 0) {
      contextAdditions.push(`\nCONTEXTUAL KNOWLEDGE:
${enhancedAgent.contextualKnowledge.map(knowledge => `- ${knowledge}`).join('\n')}`);
    }

    return basePrompt + contextAdditions.join('\n');
  }

  /**
   * Get department-specific agents
   */
  getDepartmentAgents(departmentId: string): Agent[] {
    return getAgentsByDepartment(departmentId);
  }

  /**
   * Get all available domain agents
   */
  getAllDomainAgents(): Agent[] {
    return agentRegistry.filter(agent => agent.type === 'departmental' || agent.type === 'specialist');
  }
}

export const domainAgentService = new DomainAgentService(); 