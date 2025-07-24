/**
 * Centralized Apps Orchestrator
 * Unifies all business applications through AI agents and n8n workflows
 * Provides a single interface for accessing and managing all business functions
 */

// import { n8nService } from '@/domains/integrations/lib/n8nService';
import { executiveAgent, departmentalAgents } from '@/domains/ai/lib/agentRegistry';
import type { Agent } from '@/domains/ai/lib/agentRegistry';

// Business Application Categories
export interface BusinessApp {
  id: string;
  name: string;
  category: AppCategory;
  status: 'connected' | 'disconnected' | 'configuring' | 'error';
  lastSync?: Date;
  dataPoints?: number;
  primaryAgent?: string; // Which agent manages this app
  integrationLevel: 'basic' | 'advanced' | 'deep';
  capabilities: AppCapability[];
  workflows: string[]; // Associated n8n workflow IDs
  metrics: AppMetrics;
}

export type AppCategory = 
  | 'crm-sales' 
  | 'finance-accounting' 
  | 'marketing-advertising'
  | 'operations-productivity'
  | 'hr-people'
  | 'analytics-bi'
  | 'communication'
  | 'e-commerce'
  | 'development'
  | 'security';

export interface AppCapability {
  type: 'read' | 'write' | 'automate' | 'analyze';
  description: string;
  agentSupported: boolean;
  workflowId?: string;
}

export interface AppMetrics {
  dailyAPIRequests: number;
  successRate: number;
  avgResponseTime: number;
  errorCount: number;
  lastError?: string;
}

// Centralized Business Function
export interface BusinessFunction {
  id: string;
  name: string;
  description: string;
  category: AppCategory;
  requiredApps: string[];
  supportingAgents: string[];
  automationWorkflows: string[];
  manualTasks: string[];
  isAutomated: boolean;
  automationLevel: number; // 0-100%
}

class CentralizedAppsOrchestrator {
  private apps: Map<string, BusinessApp> = new Map();
  private functions: Map<string, BusinessFunction> = new Map();
  private activeConnections: Map<string, any> = new Map();

  constructor() {
    this.initializeApps();
    this.initializeBusinessFunctions();
  }

  /**
   * Initialize all business applications
   */
  private initializeApps(): void {
    const apps: BusinessApp[] = [
      // CRM & Sales
      {
        id: 'salesforce',
        name: 'Salesforce',
        category: 'crm-sales',
        status: 'connected',
        lastSync: new Date(),
        dataPoints: 2847,
        primaryAgent: 'sales-dept',
        integrationLevel: 'deep',
        capabilities: [
          { type: 'read', description: 'Contact & lead data', agentSupported: true, workflowId: 'sf-read' },
          { type: 'write', description: 'Create/update records', agentSupported: true, workflowId: 'sf-write' },
          { type: 'automate', description: 'Pipeline automation', agentSupported: true, workflowId: 'sf-automate' },
          { type: 'analyze', description: 'Sales analytics', agentSupported: true, workflowId: 'sf-analyze' }
        ],
        workflows: ['sf-sync', 'sf-automation', 'sf-reporting'],
        metrics: { dailyAPIRequests: 1250, successRate: 99.2, avgResponseTime: 180, errorCount: 2 }
      },
      {
        id: 'hubspot',
        name: 'HubSpot',
        category: 'crm-sales',
        status: 'connected',
        primaryAgent: 'sales-dept',
        integrationLevel: 'advanced',
        capabilities: [
          { type: 'read', description: 'Marketing & sales data', agentSupported: true },
          { type: 'automate', description: 'Marketing automation', agentSupported: true }
        ],
        workflows: ['hubspot-sync', 'hubspot-marketing'],
        metrics: { dailyAPIRequests: 890, successRate: 98.7, avgResponseTime: 150, errorCount: 1 }
      },

      // Finance & Accounting
      {
        id: 'quickbooks',
        name: 'QuickBooks Online',
        category: 'finance-accounting',
        status: 'connected',
        primaryAgent: 'finance-dept',
        integrationLevel: 'deep',
        capabilities: [
          { type: 'read', description: 'Financial data', agentSupported: true },
          { type: 'write', description: 'Invoice & expense creation', agentSupported: true },
          { type: 'analyze', description: 'Financial analytics', agentSupported: true }
        ],
        workflows: ['qb-sync', 'qb-invoicing', 'qb-reporting'],
        metrics: { dailyAPIRequests: 650, successRate: 99.8, avgResponseTime: 120, errorCount: 0 }
      },
      {
        id: 'stripe',
        name: 'Stripe',
        category: 'finance-accounting',
        status: 'connected',
        primaryAgent: 'finance-dept',
        integrationLevel: 'advanced',
        capabilities: [
          { type: 'read', description: 'Payment data', agentSupported: true },
          { type: 'automate', description: 'Payment processing', agentSupported: true }
        ],
        workflows: ['stripe-payments', 'stripe-analytics'],
        metrics: { dailyAPIRequests: 2100, successRate: 99.9, avgResponseTime: 95, errorCount: 0 }
      },

      // Operations & Productivity
      {
        id: 'microsoft365',
        name: 'Microsoft 365',
        category: 'operations-productivity',
        status: 'connected',
        primaryAgent: 'operations-dept',
        integrationLevel: 'deep',
        capabilities: [
          { type: 'read', description: 'Files & collaboration data', agentSupported: true },
          { type: 'write', description: 'Document creation', agentSupported: true },
          { type: 'automate', description: 'Workflow automation', agentSupported: true }
        ],
        workflows: ['ms365-sync', 'ms365-automation'],
        metrics: { dailyAPIRequests: 3200, successRate: 98.5, avgResponseTime: 200, errorCount: 12 }
      },
      {
        id: 'slack',
        name: 'Slack',
        category: 'communication',
        status: 'connected',
        primaryAgent: 'operations-dept',
        integrationLevel: 'advanced',
        capabilities: [
          { type: 'read', description: 'Messages & team data', agentSupported: true },
          { type: 'write', description: 'Send notifications', agentSupported: true },
          { type: 'automate', description: 'Bot responses', agentSupported: true }
        ],
        workflows: ['slack-notifications', 'slack-bot'],
        metrics: { dailyAPIRequests: 1800, successRate: 99.1, avgResponseTime: 85, errorCount: 3 }
      },

      // Marketing & Advertising
      {
        id: 'mailchimp',
        name: 'Mailchimp',
        category: 'marketing-advertising',
        status: 'connected',
        primaryAgent: 'marketing-dept',
        integrationLevel: 'advanced',
        capabilities: [
          { type: 'read', description: 'Campaign & subscriber data', agentSupported: true },
          { type: 'write', description: 'Campaign creation', agentSupported: true },
          { type: 'automate', description: 'Email automation', agentSupported: true }
        ],
        workflows: ['mailchimp-campaigns', 'mailchimp-analytics'],
        metrics: { dailyAPIRequests: 420, successRate: 98.9, avgResponseTime: 160, errorCount: 1 }
      },

      // Analytics & BI
      {
        id: 'google-analytics',
        name: 'Google Analytics',
        category: 'analytics-bi',
        status: 'connected',
        primaryAgent: 'marketing-dept',
        integrationLevel: 'basic',
        capabilities: [
          { type: 'read', description: 'Website analytics', agentSupported: true },
          { type: 'analyze', description: 'Traffic analysis', agentSupported: true }
        ],
        workflows: ['ga-reporting'],
        metrics: { dailyAPIRequests: 300, successRate: 99.5, avgResponseTime: 140, errorCount: 0 }
      }
    ];

    apps.forEach(app => this.apps.set(app.id, app));
  }

  /**
   * Initialize business functions that span multiple apps
   */
  private initializeBusinessFunctions(): void {
    const functions: BusinessFunction[] = [
      {
        id: 'lead-to-cash',
        name: 'Lead to Cash Process',
        description: 'Complete customer journey from lead generation to payment',
        category: 'crm-sales',
        requiredApps: ['salesforce', 'hubspot', 'stripe', 'quickbooks'],
        supportingAgents: ['sales-dept', 'finance-dept', 'marketing-dept'],
        automationWorkflows: ['lead-scoring', 'proposal-generation', 'payment-processing'],
        manualTasks: ['discovery-calls', 'contract-negotiation'],
        isAutomated: true,
        automationLevel: 75
      },
      {
        id: 'financial-reporting',
        name: 'Monthly Financial Reporting',
        description: 'Automated generation of comprehensive financial reports',
        category: 'finance-accounting',
        requiredApps: ['quickbooks', 'stripe', 'salesforce'],
        supportingAgents: ['finance-dept', 'executive'],
        automationWorkflows: ['data-aggregation', 'report-generation', 'distribution'],
        manualTasks: ['executive-review', 'board-presentation'],
        isAutomated: true,
        automationLevel: 90
      },
      {
        id: 'customer-onboarding',
        name: 'Customer Onboarding',
        description: 'Seamless new customer experience from signup to success',
        category: 'operations-productivity',
        requiredApps: ['salesforce', 'slack', 'microsoft365', 'mailchimp'],
        supportingAgents: ['sales-dept', 'customer-success', 'operations-dept'],
        automationWorkflows: ['welcome-sequence', 'account-setup', 'training-scheduling'],
        manualTasks: ['kickoff-meeting', 'customization'],
        isAutomated: true,
        automationLevel: 65
      },
      {
        id: 'marketing-campaign',
        name: 'Integrated Marketing Campaigns',
        description: 'Cross-channel marketing campaign execution and tracking',
        category: 'marketing-advertising',
        requiredApps: ['hubspot', 'mailchimp', 'google-analytics', 'slack'],
        supportingAgents: ['marketing-dept', 'marketing-analytics'],
        automationWorkflows: ['campaign-creation', 'audience-targeting', 'performance-tracking'],
        manualTasks: ['creative-development', 'strategy-planning'],
        isAutomated: true,
        automationLevel: 80
      }
    ];

    functions.forEach(func => this.functions.set(func.id, func));
  }

  /**
   * Execute a business function through AI agent coordination
   */
  async executeBusinessFunction(
    functionId: string, 
    parameters: Record<string, any>,
    userId: string
  ): Promise<{
    success: boolean;
    results: any[];
    agentsInvolved: string[];
    workflowsTriggered: string[];
    error?: string;
  }> {
    const businessFunction = this.functions.get(functionId);
    if (!businessFunction) {
      return { success: false, results: [], agentsInvolved: [], workflowsTriggered: [], error: 'Function not found' };
    }

    const results: any[] = [];
    const agentsToInvolve = new Set<string>();
    const workflowsToTrigger = new Set<string>();

    try {
      // Step 1: Identify the main agent and workflows
      const involvedAgent = this.getAgentForFunction(businessFunction);
      if (involvedAgent) {
        agentsToInvolve.add(involvedAgent.id);
      }

      // Step 2: Determine which supporting agents to involve based on parameters
      businessFunction.supportingAgents.forEach(agentId => {
        if (this.shouldInvolveAgent(businessFunction, agentId, _parameters)) {
          agentsToInvolve.add(agentId);
        }
      });

      // Step 3: Execute automation workflows
      for (const workflowId of businessFunction.automationWorkflows) {
        // const workflowResult = await n8nService.triggerWorkflow(workflowId, _parameters);
        const workflowResult = { error: null, data: {} }; // Mock implementation
        results.push({ workflowId, data: workflowResult });
        workflowsToTrigger.add(workflowId);

        if (workflowResult.error) {
          // // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error(`Error in workflow ${workflowId}:`, workflowResult.error);
          // const primaryAgent = this.getAgentById(businessFunction.supportingAgents[0]);
        }
      }

      // Step 4: Aggregate results and finalize
      // This is a simplified aggregation. A real implementation would be more complex.
      const finalResult = results.reduce((acc, curr) => ({ ...acc, ...curr.data }), {});
      
      return {
        success: true,
        results: [finalResult],
        agentsInvolved: Array.from(agentsToInvolve),
        workflowsTriggered: Array.from(workflowsToTrigger)
      };

    } catch (error) {
      // // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error(`Failed to execute business function ${functionId}:`, error);
      return {
        success: false,
        results: [],
        agentsInvolved: [],
        workflowsTriggered: [],
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Get unified status of all connected apps
   */
  getAppsCentralizedStatus(): {
    totalApps: number;
    connectedApps: number;
    healthyApps: number;
    totalDataPoints: number;
    categories: Record<AppCategory, { connected: number; total: number }>;
  } {
    const apps = Array.from(this.apps.values());
    const categories: Record<AppCategory, { connected: number; total: number }> = {} as any;

    // Initialize categories
    const allCategories: AppCategory[] = [
      'crm-sales', 'finance-accounting', 'marketing-advertising', 
      'operations-productivity', 'hr-people', 'analytics-bi', 
      'communication', 'e-commerce', 'development', 'security'
    ];
    
    allCategories.forEach(cat => {
      categories[cat] = { connected: 0, total: 0 };
    });

    // Count apps by category
    apps.forEach(app => {
      categories[app.category].total++;
      if (app.status === 'connected') {
        categories[app.category].connected++;
      }
    });

    return {
      totalApps: apps.length,
      connectedApps: apps.filter(app => app.status === 'connected').length,
      healthyApps: apps.filter(app => app.status === 'connected' && app.metrics.successRate > 95).length,
      totalDataPoints: apps.reduce((sum, app) => sum + (app.dataPoints || 0), 0),
      categories
    };
  }

  /**
   * Execute unified command across multiple apps through AI orchestration
   */
  async executeUnifiedCommand(
    command: string,
    targetApps: string[],
    userId: string
  ): Promise<{
    success: boolean;
    results: Record<string, any>;
    agentRecommendations: string[];
  }> {
    // This is a mock implementation.
    // A real implementation would involve complex NLP and agent interaction.
    return {
      success: false,
      results: { message: "Unified command execution is not fully implemented." },
      agentRecommendations: [executiveAgent.id]
    };
  }

  /**
   * Get business insights from centralized app data
   */
  async getBusinessInsights(userId: string): Promise<{
    kpis: Array<{ name: string; value: string; trend: 'up' | 'down' | 'stable'; source: string[] }>;
    recommendations: string[];
    crossAppOpportunities: string[];
  }> {
    const status = this.getAppsCentralizedStatus();

    const kpis: Array<{ name: string; value: string; trend: 'up' | 'down' | 'stable'; source: string[] }> = [
      { name: 'Connected Apps', value: `${status.connectedApps} / ${status.totalApps}`, trend: 'stable', source: ['all'] },
      { name: 'Total Data Points', value: status.totalDataPoints.toLocaleString(), trend: 'up', source: ['all'] },
    ];

    // 2. Identify cross-app opportunities (mock data)
    const crossAppOpportunities = [
      'Automate lead-to-invoice process between Salesforce and QuickBooks.',
      'Sync customer support tickets from Slack to Salesforce for 360-degree view.'
    ];

    // 3. Use an agent to generate qualitative insights
    const recommendations: string[] = [];

    return {
      kpis,
      recommendations,
      crossAppOpportunities
    };
  }

  // Helper methods
  private getAgentForFunction(businessFunction: BusinessFunction): Agent | null {
    const primaryAgentId = businessFunction.supportingAgents[0];
    return this.getAgentById(primaryAgentId);
  }

  private getAgentById(agentId: string): Agent | null {
    if (agentId === executiveAgent.id) {
      return executiveAgent;
    }
    const deptAgent = departmentalAgents.find(agent => agent.id === agentId);
    if (deptAgent) {
      return deptAgent;
    }
    return null;
  }

  private shouldInvolveAgent(businessFunction: BusinessFunction, agentId: string, parameters: Record<string, any>): boolean {
    // Logic to determine if agent should be involved based on function requirements and parameters
    return _businessFunction.supportingAgents.includes(agentId);
  }

  private getAgentRole(agentId: string, businessFunction: BusinessFunction): string {
    const agent = this.getAgentById(agentId);
    return agent ? `${agent.name} - ${agent.description}` : 'Supporting role';
  }

  // Public accessors
  getConnectedApps(): BusinessApp[] {
    return Array.from(this.apps.values()).filter(app => app.status === 'connected');
  }

  getBusinessFunctions(): BusinessFunction[] {
    return Array.from(this.functions.values());
  }

  getAppById(appId: string): BusinessApp | undefined {
    return this.apps.get(appId);
  }

  getFunctionById(functionId: string): BusinessFunction | undefined {
    return this.functions.get(functionId);
  }
}

const orchestrator = new CentralizedAppsOrchestrator();

export { orchestrator, CentralizedAppsOrchestrator };

// Already exported at definition
// export type { BusinessApp, BusinessFunction, AppCategory, AppCapability, AppMetrics }; 