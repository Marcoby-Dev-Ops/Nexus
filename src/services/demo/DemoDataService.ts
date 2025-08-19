/**
 * Demo Data Service
 * Provides realistic placeholder data for demo accounts and organizations
 * This ensures demo users see meaningful business metrics and integrations
 */

import { logger } from '@/shared/utils/logger';

export interface DemoFinancialData {
  totalRevenue: number;
  totalExpenses: number;
  profitMargin: number;
  cashFlow: number;
  monthlyGrowth: number;
  customerCount: number;
  averageOrderValue: number;
  churnRate: number;
}

export interface DemoIntegrationData {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'error';
  lastSync: string;
  dataPoints: number;
  category: 'sales' | 'marketing' | 'finance' | 'operations' | 'communication';
}

export interface DemoBusinessHealthData {
  overall: number;
  sales: number;
  marketing: number;
  operations: number;
  finance: number;
  customerSatisfaction: number;
  employeeSatisfaction: number;
  processEfficiency: number;
}

export interface DemoKPIData {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  category: string;
  lastUpdated: string;
}

export interface DemoActivityData {
  id: string;
  type: 'sale' | 'lead' | 'task' | 'integration' | 'alert';
  title: string;
  description: string;
  timestamp: string;
  priority: 'high' | 'medium' | 'low';
  status: 'completed' | 'pending' | 'failed';
}

export interface DemoNextBestAction {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'sales' | 'marketing' | 'ops' | 'finance';
  estimatedTime: string;
  impact: string;
  canDelegate: boolean;
  aiAssisted: boolean;
  estimatedValue: number;
}

export interface DemoMetricsData {
  sales: {
    pipelineValue: number;
    conversionRate: number;
    averageDealSize: number;
    salesCycleLength: number;
    newLeads: number;
  };
  marketing: {
    websiteTraffic: number;
    leadGeneration: number;
    emailOpenRate: number;
    socialMediaEngagement: number;
    campaignROI: number;
  };
  operations: {
    customerSatisfaction: number;
    employeeProductivity: number;
    processEfficiency: number;
    projectCompletionRate: number;
    resourceUtilization: number;
  };
  finance: {
    monthlyRecurringRevenue: number;
    customerLifetimeValue: number;
    burnRate: number;
    runway: number;
    grossMargin: number;
  };
}

class DemoDataService {
  private static instance: DemoDataService;
  private demoDataCache: Map<string, any> = new Map();

  static getInstance(): DemoDataService {
    if (!DemoDataService.instance) {
      DemoDataService.instance = new DemoDataService();
    }
    return DemoDataService.instance;
  }

  /**
   * Get realistic financial data for demo accounts
   */
  getFinancialData(userId: string): DemoFinancialData {
    const cacheKey = `financial_${userId}`;
    if (this.demoDataCache.has(cacheKey)) {
      return this.demoDataCache.get(cacheKey);
    }

    // Generate realistic but varied financial data
    const baseRevenue = 50000 + Math.random() * 150000; // $50K - $200K
    const expenses = baseRevenue * (0.6 + Math.random() * 0.3); // 60-90% of revenue
    const profitMargin = ((baseRevenue - expenses) / baseRevenue) * 100;
    const cashFlow = baseRevenue - expenses + (Math.random() * 10000 - 5000);
    const monthlyGrowth = (Math.random() * 20 - 5); // -5% to +15%
    const customerCount = 50 + Math.floor(Math.random() * 200);
    const averageOrderValue = 150 + Math.random() * 350;
    const churnRate = 2 + Math.random() * 8; // 2-10%

    const data: DemoFinancialData = {
      totalRevenue: Math.round(baseRevenue),
      totalExpenses: Math.round(expenses),
      profitMargin: Math.round(profitMargin * 10) / 10,
      cashFlow: Math.round(cashFlow),
      monthlyGrowth: Math.round(monthlyGrowth * 10) / 10,
      customerCount,
      averageOrderValue: Math.round(averageOrderValue),
      churnRate: Math.round(churnRate * 10) / 10
    };

    this.demoDataCache.set(cacheKey, data);
    return data;
  }

  /**
   * Get realistic integration data for demo accounts
   */
  getIntegrationData(userId: string): DemoIntegrationData[] {
    const cacheKey = `integrations_${userId}`;
    if (this.demoDataCache.has(cacheKey)) {
      return this.demoDataCache.get(cacheKey);
    }

    const integrations: DemoIntegrationData[] = [
      {
        id: 'hubspot-1',
        name: 'HubSpot CRM',
        type: 'crm',
        status: 'active',
        lastSync: new Date(Date.now() - Math.random() * 3600000).toISOString(), // Within last hour
        dataPoints: 1250 + Math.floor(Math.random() * 500),
        category: 'sales'
      },
      {
        id: 'stripe-1',
        name: 'Stripe Payments',
        type: 'payment',
        status: 'active',
        lastSync: new Date(Date.now() - Math.random() * 1800000).toISOString(), // Within last 30 min
        dataPoints: 890 + Math.floor(Math.random() * 200),
        category: 'finance'
      },
      {
        id: 'mailchimp-1',
        name: 'Mailchimp',
        type: 'email',
        status: 'active',
        lastSync: new Date(Date.now() - Math.random() * 7200000).toISOString(), // Within last 2 hours
        dataPoints: 3400 + Math.floor(Math.random() * 1000),
        category: 'marketing'
      },
      {
        id: 'slack-1',
        name: 'Slack',
        type: 'communication',
        status: 'active',
        lastSync: new Date(Date.now() - Math.random() * 300000).toISOString(), // Within last 5 min
        dataPoints: 5600 + Math.floor(Math.random() * 2000),
        category: 'communication'
      },
      {
        id: 'quickbooks-1',
        name: 'QuickBooks',
        type: 'accounting',
        status: 'active',
        lastSync: new Date(Date.now() - Math.random() * 86400000).toISOString(), // Within last day
        dataPoints: 2100 + Math.floor(Math.random() * 800),
        category: 'finance'
      },
      {
        id: 'google-analytics-1',
        name: 'Google Analytics',
        type: 'analytics',
        status: 'active',
        lastSync: new Date(Date.now() - Math.random() * 3600000).toISOString(), // Within last hour
        dataPoints: 8900 + Math.floor(Math.random() * 3000),
        category: 'marketing'
      }
    ];

    // Randomly deactivate 1-2 integrations to show variety
    const deactivateCount = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < deactivateCount; i++) {
      const randomIndex = Math.floor(Math.random() * integrations.length);
      integrations[randomIndex].status = 'inactive';
    }

    this.demoDataCache.set(cacheKey, integrations);
    return integrations;
  }

  /**
   * Get realistic business health data for demo accounts
   */
  getBusinessHealthData(userId: string): DemoBusinessHealthData {
    const cacheKey = `health_${userId}`;
    if (this.demoDataCache.has(cacheKey)) {
      return this.demoDataCache.get(cacheKey);
    }

    const data: DemoBusinessHealthData = {
      overall: 65 + Math.floor(Math.random() * 30), // 65-95%
      sales: 60 + Math.floor(Math.random() * 35), // 60-95%
      marketing: 70 + Math.floor(Math.random() * 25), // 70-95%
      operations: 75 + Math.floor(Math.random() * 20), // 75-95%
      finance: 65 + Math.floor(Math.random() * 30), // 65-95%
      customerSatisfaction: 80 + Math.floor(Math.random() * 15), // 80-95%
      employeeSatisfaction: 75 + Math.floor(Math.random() * 20), // 75-95%
      processEfficiency: 70 + Math.floor(Math.random() * 25) // 70-95%
    };

    this.demoDataCache.set(cacheKey, data);
    return data;
  }

  /**
   * Get realistic KPI data for demo accounts
   */
  getKPIData(userId: string): DemoKPIData[] {
    const cacheKey = `kpis_${userId}`;
    if (this.demoDataCache.has(cacheKey)) {
      return this.demoDataCache.get(cacheKey);
    }

    const kpis: DemoKPIData[] = [
      {
        id: 'mrr-1',
        name: 'Monthly Recurring Revenue',
        value: 45000 + Math.random() * 100000,
        target: 75000,
        unit: 'USD',
        trend: 'up',
        category: 'finance',
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'conversion-1',
        name: 'Lead Conversion Rate',
        value: 12 + Math.random() * 8,
        target: 15,
        unit: '%',
        trend: 'up',
        category: 'sales',
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'satisfaction-1',
        name: 'Customer Satisfaction',
        value: 85 + Math.random() * 10,
        target: 90,
        unit: '%',
        trend: 'stable',
        category: 'operations',
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'efficiency-1',
        name: 'Process Efficiency',
        value: 78 + Math.random() * 15,
        target: 85,
        unit: '%',
        trend: 'up',
        category: 'operations',
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'traffic-1',
        name: 'Website Traffic',
        value: 15000 + Math.random() * 25000,
        target: 20000,
        unit: 'visitors',
        trend: 'up',
        category: 'marketing',
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'clv-1',
        name: 'Customer Lifetime Value',
        value: 2500 + Math.random() * 1500,
        target: 3000,
        unit: 'USD',
        trend: 'up',
        category: 'finance',
        lastUpdated: new Date().toISOString()
      }
    ];

    this.demoDataCache.set(cacheKey, kpis);
    return kpis;
  }

  /**
   * Get realistic activity data for demo accounts
   */
  getActivityData(userId: string): DemoActivityData[] {
    const cacheKey = `activity_${userId}`;
    if (this.demoDataCache.has(cacheKey)) {
      return this.demoDataCache.get(cacheKey);
    }

    const activities: DemoActivityData[] = [
      {
        id: 'sale-1',
        type: 'sale',
        title: 'New Sale: Enterprise Package',
        description: 'Closed $25,000 enterprise deal with TechCorp Inc.',
        timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        priority: 'high',
        status: 'completed'
      },
      {
        id: 'lead-1',
        type: 'lead',
        title: 'New Lead: Marketing Director',
        description: 'Qualified lead from LinkedIn campaign',
        timestamp: new Date(Date.now() - Math.random() * 7200000).toISOString(),
        priority: 'medium',
        status: 'pending'
      },
      {
        id: 'task-1',
        type: 'task',
        title: 'Follow up with prospects',
        description: 'Call 5 qualified leads from last week',
        timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        priority: 'medium',
        status: 'pending'
      },
      {
        id: 'integration-1',
        type: 'integration',
        title: 'HubSpot sync completed',
        description: 'Successfully synced 150 new contacts',
        timestamp: new Date(Date.now() - Math.random() * 1800000).toISOString(),
        priority: 'low',
        status: 'completed'
      },
      {
        id: 'alert-1',
        type: 'alert',
        title: 'High churn rate detected',
        description: 'Customer churn rate increased to 8.5%',
        timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        priority: 'high',
        status: 'pending'
      }
    ];

    this.demoDataCache.set(cacheKey, activities);
    return activities;
  }

  /**
   * Get realistic next best actions for demo accounts
   */
  getNextBestActions(userId: string): DemoNextBestAction[] {
    const cacheKey = `actions_${userId}`;
    if (this.demoDataCache.has(cacheKey)) {
      return this.demoDataCache.get(cacheKey);
    }

    const actions: DemoNextBestAction[] = [
      {
        id: 'action-1',
        title: 'Optimize checkout process',
        description: 'Reduce cart abandonment by improving checkout UX',
        priority: 'critical',
        category: 'sales',
        estimatedTime: '2-3 hours',
        impact: 'High - 15% revenue increase',
        canDelegate: true,
        aiAssisted: true,
        estimatedValue: 15000
      },
      {
        id: 'action-2',
        title: 'Launch email campaign',
        description: 'Re-engage dormant customers with personalized offers',
        priority: 'high',
        category: 'marketing',
        estimatedTime: '1-2 hours',
        impact: 'Medium - 8% conversion boost',
        canDelegate: true,
        aiAssisted: true,
        estimatedValue: 8000
      },
      {
        id: 'action-3',
        title: 'Review pricing strategy',
        description: 'Analyze competitor pricing and adjust accordingly',
        priority: 'high',
        category: 'finance',
        estimatedTime: '3-4 hours',
        impact: 'High - 12% margin improvement',
        canDelegate: false,
        aiAssisted: true,
        estimatedValue: 12000
      },
      {
        id: 'action-4',
        title: 'Streamline onboarding',
        description: 'Reduce customer onboarding time by 50%',
        priority: 'medium',
        category: 'ops',
        estimatedTime: '4-6 hours',
        impact: 'Medium - 20% efficiency gain',
        canDelegate: true,
        aiAssisted: false,
        estimatedValue: 6000
      },
      {
        id: 'action-5',
        title: 'Update website content',
        description: 'Refresh homepage with new value propositions',
        priority: 'medium',
        category: 'marketing',
        estimatedTime: '2-3 hours',
        impact: 'Medium - 10% traffic increase',
        canDelegate: true,
        aiAssisted: true,
        estimatedValue: 5000
      }
    ];

    this.demoDataCache.set(cacheKey, actions);
    return actions;
  }

  /**
   * Get comprehensive metrics data for demo accounts
   */
  getMetricsData(userId: string): DemoMetricsData {
    const cacheKey = `metrics_${userId}`;
    if (this.demoDataCache.has(cacheKey)) {
      return this.demoDataCache.get(cacheKey);
    }

    const data: DemoMetricsData = {
      sales: {
        pipelineValue: 150000 + Math.random() * 200000,
        conversionRate: 12 + Math.random() * 8,
        averageDealSize: 8000 + Math.random() * 12000,
        salesCycleLength: 30 + Math.random() * 45,
        newLeads: 45 + Math.floor(Math.random() * 30)
      },
      marketing: {
        websiteTraffic: 15000 + Math.random() * 25000,
        leadGeneration: 120 + Math.floor(Math.random() * 80),
        emailOpenRate: 25 + Math.random() * 15,
        socialMediaEngagement: 8 + Math.random() * 7,
        campaignROI: 320 + Math.random() * 180
      },
      operations: {
        customerSatisfaction: 85 + Math.random() * 10,
        employeeProductivity: 78 + Math.random() * 15,
        processEfficiency: 82 + Math.random() * 13,
        projectCompletionRate: 88 + Math.random() * 10,
        resourceUtilization: 75 + Math.random() * 20
      },
      finance: {
        monthlyRecurringRevenue: 45000 + Math.random() * 100000,
        customerLifetimeValue: 2500 + Math.random() * 1500,
        burnRate: 15000 + Math.random() * 10000,
        runway: 18 + Math.random() * 12,
        grossMargin: 65 + Math.random() * 25
      }
    };

    this.demoDataCache.set(cacheKey, data);
    return data;
  }

  /**
   * Check if user is a demo account
   */
  isDemoUser(userId: string): boolean {
    return userId.includes('demo') || userId.includes('test') || userId.startsWith('demo_');
  }

  /**
   * Clear demo data cache
   */
  clearCache(): void {
    this.demoDataCache.clear();
    logger.info('Demo data cache cleared');
  }

  /**
   * Get all demo data for a user
   */
  getAllDemoData(userId: string) {
    return {
      financial: this.getFinancialData(userId),
      integrations: this.getIntegrationData(userId),
      health: this.getBusinessHealthData(userId),
      kpis: this.getKPIData(userId),
      activities: this.getActivityData(userId),
      actions: this.getNextBestActions(userId),
      metrics: this.getMetricsData(userId)
    };
  }
}

export const demoDataService = DemoDataService.getInstance();
export default demoDataService;
