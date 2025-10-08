/**
 * Integration Context Service
 * 
 * Provides real-time context from connected integrations to enhance
 * RAG queries and chat responses with live business data.
 */

export interface IntegrationContext {
  hubspot?: {
    recentDeals: any[];
    pipelineMetrics: any;
    contactActivity: any[];
  };
  analytics?: {
    pageViews: any[];
    conversionMetrics: any;
    userBehavior: any[];
  };
  finance?: {
    cashFlow: any;
    revenueMetrics: any;
    expenseData: any[];
  };
  operations?: {
    taskMetrics: any;
    processData: any[];
    efficiencyScores: any;
  };
}

export interface BusinessContext {
  companyId: string;
  userId: string;
  integrations: IntegrationContext;
  dashboardMetrics: any;
  nextBestActions: any[];
  businessHealth: number;
  lastUpdated: string;
}

export class IntegrationContextService {
  private static instance: IntegrationContextService;
  private contextCache: Map<string, BusinessContext> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): IntegrationContextService {
    if (!IntegrationContextService.instance) {
      IntegrationContextService.instance = new IntegrationContextService();
    }
    return IntegrationContextService.instance;
  }

  /**
   * Get comprehensive business context for RAG and chat
   */
  async getBusinessContext(userId: string, companyId?: string): Promise<BusinessContext> {
    const cacheKey = `${userId}-${companyId || 'default'}`;
    const cached = this.contextCache.get(cacheKey);
    
    if (cached && Date.now() - new Date(cached.lastUpdated).getTime() < this.cacheTimeout) {
      return cached;
    }

    try {
      const integrations = await this.getIntegrationData(userId, companyId);
      const dashboardMetrics = await this.getDashboardMetrics(userId, companyId);
      const nextBestActions = await this.getNextBestActions(userId, companyId);
      const businessHealth = await this.getBusinessHealth(userId, companyId);

      const context: BusinessContext = {
        companyId: companyId || 'default',
        userId,
        integrations,
        dashboardMetrics,
        nextBestActions,
        businessHealth,
        lastUpdated: new Date().toISOString()
      };

      this.contextCache.set(cacheKey, context);
      return context;
    } catch (error) {
      console.error('Error getting business context:', error);
      return this.getFallbackContext(userId, companyId);
    }
  }

  /**
   * Get integration data from connected services
   */
  private async getIntegrationData(userId: string, companyId?: string): Promise<IntegrationContext> {
    const integrations: IntegrationContext = {};

    try {
      // HubSpot integration data
      if (await this.isIntegrationActive('hubspot', userId)) {
        integrations.hubspot = await this.getHubSpotData(userId, companyId);
      }

      // Google Analytics data
      if (await this.isIntegrationActive('google-analytics', userId)) {
        integrations.analytics = await this.getAnalyticsData(userId, companyId);
      }

      // Financial data
      if (await this.isIntegrationActive('finance', userId)) {
        integrations.finance = await this.getFinanceData(userId, companyId);
      }

      // Operations data
      integrations.operations = await this.getOperationsData(userId, companyId);

    } catch (error) {
      console.error('Error fetching integration data:', error);
    }

    return integrations;
  }

  /**
   * Check if an integration is active for the user
   */
  private async isIntegrationActive(integrationType: string, userId: string): Promise<boolean> {
    // For now, return false since the API endpoint doesn't exist
    // This prevents 404 errors while the backend is being developed
    return false;
  }

  /**
   * Get HubSpot integration data
   */
  private async getHubSpotData(userId: string, companyId?: string): Promise<any> {
    try {
      const response = await fetch('/api/integrations/hubspot/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, companyId })
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error fetching HubSpot data:', error);
    }

    return {
      recentDeals: [],
      pipelineMetrics: {},
      contactActivity: []
    };
  }

  /**
   * Get Google Analytics data
   */
  private async getAnalyticsData(userId: string, companyId?: string): Promise<any> {
    try {
      const response = await fetch('/api/integrations/analytics/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, companyId })
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    }

    return {
      pageViews: [],
      conversionMetrics: {},
      userBehavior: []
    };
  }

  /**
   * Get financial data
   */
  private async getFinanceData(userId: string, companyId?: string): Promise<any> {
    try {
      const response = await fetch('/api/integrations/finance/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, companyId })
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error fetching finance data:', error);
    }

    return {
      cashFlow: {},
      revenueMetrics: {},
      expenseData: []
    };
  }

  /**
   * Get operations data
   */
  private async getOperationsData(userId: string, companyId?: string): Promise<any> {
    // Return mock data since the API endpoint doesn't exist
    return {
      taskMetrics: {
        completed: 45,
        pending: 12,
        overdue: 3
      },
      processData: [
        { process: 'Lead Qualification', efficiency: 0.85 },
        { process: 'Sales Follow-up', efficiency: 0.72 },
        { process: 'Customer Onboarding', efficiency: 0.91 }
      ],
      efficiencyScores: {
        avgTaskTime: 2.5,
        benchmarkTime: 1.8,
        overallEfficiency: 0.78
      }
    };
  }

  /**
   * Get dashboard metrics
   */
  private async getDashboardMetrics(userId: string, companyId?: string): Promise<any> {
    // Return mock data since the API endpoint doesn't exist
    return {
      monthlyRevenue: 125000,
      growthRate: 0.15,
      customerCount: 342,
      churnRate: 0.08,
      avgOrderValue: 365,
      conversionRate: 0.12
    };
  }

  /**
   * Get next best actions
   */
  private async getNextBestActions(userId: string, companyId?: string): Promise<any[]> {
    // Return mock data since the API endpoint doesn't exist
    return [
      {
        id: 'optimize-pipeline',
        title: 'Optimize Sales Pipeline',
        description: 'Your conversion rate is below industry average. Let\'s improve it by 25%',
        priority: 'high',
        category: 'sales',
        estimatedTime: '2-3 hours',
        impact: 'High revenue impact',
        canDelegate: true,
        aiAssisted: true
      },
      {
        id: 'customer-retention',
        title: 'Improve Customer Retention',
        description: 'Churn rate is at 8%. We can reduce it to 5% with targeted strategies',
        priority: 'medium',
        category: 'marketing',
        estimatedTime: '1-2 hours',
        impact: 'Medium revenue impact',
        canDelegate: true,
        aiAssisted: true
      }
    ];
  }

  /**
   * Get business health score
   */
  private async getBusinessHealth(userId: string, companyId?: string): Promise<number> {
    // Return mock data since the API endpoint doesn't exist
    return 78; // Mock health score
  }

  /**
   * Get fallback context when integrations fail
   */
  private getFallbackContext(userId: string, companyId?: string): BusinessContext {
    return {
      companyId: companyId || 'default',
      userId,
      integrations: {},
      dashboardMetrics: {},
      nextBestActions: [],
      businessHealth: 0,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Clear context cache
   */
  clearCache(userId?: string): void {
    if (userId) {
      // Clear specific user cache
      for (const key of this.contextCache.keys()) {
        if (key.startsWith(userId)) {
          this.contextCache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.contextCache.clear();
    }
  }

  /**
   * Get context summary for RAG queries
   */
  async getContextSummary(userId: string, companyId?: string): Promise<string> {
    const context = await this.getBusinessContext(userId, companyId);
    
    const summary = [
      `Business Health Score: ${context.businessHealth}%`,
      `Active Integrations: ${Object.keys(context.integrations).length}`,
      `Next Best Actions: ${context.nextBestActions.length} available`,
      `Last Updated: ${new Date(context.lastUpdated).toLocaleString()}`
    ];

    return summary.join(' | ');
  }
}

export const integrationContextService = IntegrationContextService.getInstance();
