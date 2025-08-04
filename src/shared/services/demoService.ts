/**
 * Demo Service
 * 
 * Provides comprehensive mock data for all application features
 * Used when demo mode is enabled or for development/testing
 */

import { getDemoData, type DemoData } from '@/shared/config/demoConfig';

export interface DemoDashboardData {
  overview: {
    totalRevenue: number;
    monthlyGrowth: number;
    activeUsers: number;
    conversionRate: number;
  };
  metrics: {
    sales: {
      pipeline: number;
      deals: number;
      conversion: number;
      averageDealSize: number;
    };
    marketing: {
      leads: number;
      cpa: number;
      roi: number;
      campaigns: number;
    };
    finance: {
      expenses: number;
      profit: number;
      cashFlow: number;
      burnRate: number;
    };
  };
  recentActivity: Array<{
    id: string;
    type: 'deal' | 'lead' | 'integration' | 'ai';
    title: string;
    description: string;
    timestamp: string;
    value?: number;
  }>;
}

export interface DemoAnalyticsData {
  googleAnalytics: {
    connected: boolean;
    metrics: {
      pageViews: number;
      uniqueVisitors: number;
      bounceRate: number;
      avgSessionDuration: number;
      topPages: Array<{
        page: string;
        views: number;
        conversion: number;
      }>;
    };
  };
  googleWorkspace: {
    connected: boolean;
    metrics: {
      emailsSent: number;
      meetingsScheduled: number;
      documentsCreated: number;
      storageUsed: number;
    };
  };
  integrations: Array<{
    name: string;
    status: 'connected' | 'disconnected' | 'error';
    lastSync: string;
    dataPoints: number;
  }>;
}

export interface DemoAIData {
  agents: Array<{
    id: string;
    name: string;
    type: 'sales' | 'support' | 'marketing' | 'general';
    status: 'active' | 'inactive';
    conversations: number;
    accuracy: number;
    satisfaction: number;
  }>;
  conversations: Array<{
    id: string;
    agent: string;
    user: string;
    topic: string;
    duration: number;
    satisfaction: number;
    timestamp: string;
  }>;
  insights: Array<{
    id: string;
    type: 'opportunity' | 'risk' | 'trend' | 'recommendation';
    title: string;
    description: string;
    confidence: number;
    impact: 'high' | 'medium' | 'low';
    timestamp: string;
  }>;
  performance: {
    responseTime: number;
    accuracy: number;
    satisfaction: number;
    costPerConversation: number;
    totalCost: number;
  };
}

export interface DemoIntegrationData {
  connected: Array<{
    id: string;
    name: string;
    type: 'crm' | 'payment' | 'communication' | 'analytics';
    status: 'active' | 'warning' | 'error';
    lastSync: string;
    dataPoints: number;
    metrics: Record<string, any>;
  }>;
  available: Array<{
    id: string;
    name: string;
    type: 'crm' | 'payment' | 'communication' | 'analytics';
    description: string;
    features: string[];
    pricing: string;
  }>;
  insights: Array<{
    id: string;
    integration: string;
    type: 'data_sync' | 'performance' | 'usage';
    title: string;
    description: string;
    value: number;
    trend: 'up' | 'down' | 'stable';
  }>;
}

export interface DemoBillingData {
  subscription: {
    plan: 'starter' | 'professional' | 'enterprise';
    status: 'active' | 'past_due' | 'canceled';
    nextBilling: string;
    amount: number;
  };
  usage: {
    aiConversations: number;
    storageUsed: number;
    integrations: number;
    users: number;
  };
  invoices: Array<{
    id: string;
    date: string;
    amount: number;
    status: 'paid' | 'pending' | 'overdue';
    description: string;
  }>;
  paymentMethods: Array<{
    id: string;
    type: 'card' | 'bank';
    last4: string;
    brand: string;
    expiry?: string;
    isDefault: boolean;
  }>;
}

export class DemoService {
  private demoData: DemoData | null = null;

  constructor(accountId?: string) {
    if (accountId) {
      this.demoData = getDemoData(accountId);
    }
  }

  // Dashboard Data
  getDashboardData(): DemoDashboardData {
    const baseRevenue = this.demoData?.metrics.revenue || 1000000;
    
    return {
      overview: {
        totalRevenue: baseRevenue,
        monthlyGrowth: this.demoData?.metrics.growth || 12.5,
        activeUsers: this.demoData?.business.employees || 50,
        conversionRate: 3.2,
      },
      metrics: {
        sales: {
          pipeline: baseRevenue * 2.5,
          deals: 47,
          conversion: 28,
          averageDealSize: baseRevenue / 20,
        },
        marketing: {
          leads: 156,
          cpa: 45,
          roi: 320,
          campaigns: 8,
        },
        finance: {
          expenses: baseRevenue * 0.7,
          profit: baseRevenue * 0.3,
          cashFlow: baseRevenue * 0.15,
          burnRate: baseRevenue * 0.08,
        },
      },
      recentActivity: [
        {
          id: '1',
          type: 'deal',
          title: 'New Enterprise Deal',
          description: 'TechCorp Solutions - $125,000 opportunity',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          value: 125000,
        },
        {
          id: '2',
          type: 'lead',
          title: 'High-Value Lead',
          description: 'Innovation Labs - Qualified lead from website',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '3',
          type: 'integration',
          title: 'HubSpot Connected',
          description: 'CRM integration successfully established',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '4',
          type: 'ai',
          title: 'AI Insight Generated',
          description: 'New opportunity identified in Q4 pipeline',
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        },
      ],
    };
  }

  // Analytics Data
  getAnalyticsData(): DemoAnalyticsData {
    return {
      googleAnalytics: {
        connected: true,
        metrics: {
          pageViews: 15420,
          uniqueVisitors: 3247,
          bounceRate: 23.5,
          avgSessionDuration: 245,
          topPages: [
            { page: '/dashboard', views: 3247, conversion: 12.5 },
            { page: '/analytics', views: 2156, conversion: 8.3 },
            { page: '/ai', views: 1892, conversion: 15.7 },
            { page: '/integrations', views: 1456, conversion: 6.2 },
          ],
        },
      },
      googleWorkspace: {
        connected: true,
        metrics: {
          emailsSent: 2847,
          meetingsScheduled: 156,
          documentsCreated: 89,
          storageUsed: 45.2,
        },
      },
      integrations: [
        {
          name: 'HubSpot CRM',
          status: 'connected',
          lastSync: '2 minutes ago',
          dataPoints: 1247,
        },
        {
          name: 'Stripe Payments',
          status: 'connected',
          lastSync: '1 minute ago',
          dataPoints: 892,
        },
        {
          name: 'Slack',
          status: 'connected',
          lastSync: '5 minutes ago',
          dataPoints: 2156,
        },
        {
          name: 'Google Analytics',
          status: 'connected',
          lastSync: '3 minutes ago',
          dataPoints: 3247,
        },
      ],
    };
  }

  // AI Data
  getAIData(): DemoAIData {
    const baseConversations = this.demoData?.ai.conversations || 1000;
    const baseAccuracy = this.demoData?.ai.accuracy || 90;
    
    return {
      agents: [
        {
          id: 'sales-agent',
          name: 'Sales Assistant',
          type: 'sales',
          status: 'active',
          conversations: Math.floor(baseConversations * 0.4),
          accuracy: baseAccuracy,
          satisfaction: 4.7,
        },
        {
          id: 'support-agent',
          name: 'Support Bot',
          type: 'support',
          status: 'active',
          conversations: Math.floor(baseConversations * 0.3),
          accuracy: baseAccuracy - 2,
          satisfaction: 4.5,
        },
        {
          id: 'marketing-agent',
          name: 'Marketing Assistant',
          type: 'marketing',
          status: 'active',
          conversations: Math.floor(baseConversations * 0.2),
          accuracy: baseAccuracy - 1,
          satisfaction: 4.6,
        },
        {
          id: 'general-agent',
          name: 'General Assistant',
          type: 'general',
          status: 'active',
          conversations: Math.floor(baseConversations * 0.1),
          accuracy: baseAccuracy - 3,
          satisfaction: 4.3,
        },
      ],
      conversations: [
        {
          id: 'conv-1',
          agent: 'Sales Assistant',
          user: 'john@techcorp.com',
          topic: 'Product Inquiry',
          duration: 180,
          satisfaction: 5,
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        },
        {
          id: 'conv-2',
          agent: 'Support Bot',
          user: 'sarah@innovate.com',
          topic: 'Technical Support',
          duration: 240,
          satisfaction: 4,
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        },
        {
          id: 'conv-3',
          agent: 'Marketing Assistant',
          user: 'mike@startup.com',
          topic: 'Campaign Strategy',
          duration: 300,
          satisfaction: 5,
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        },
      ],
      insights: [
        {
          id: 'insight-1',
          type: 'opportunity',
          title: 'High-Value Lead Identified',
          description: 'TechCorp Solutions shows strong buying signals',
          confidence: 87,
          impact: 'high',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'insight-2',
          type: 'trend',
          title: 'Sales Cycle Optimization',
          description: 'AI analysis suggests 15% reduction in sales cycle',
          confidence: 92,
          impact: 'medium',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'insight-3',
          type: 'recommendation',
          title: 'Customer Retention Strategy',
          description: 'Implement loyalty program for 25% revenue increase',
          confidence: 78,
          impact: 'high',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        },
      ],
      performance: {
        responseTime: 1.2,
        accuracy: baseAccuracy,
        satisfaction: this.demoData?.ai.satisfaction || 4.5,
        costPerConversation: 0.15,
        totalCost: baseConversations * 0.15,
      },
    };
  }

  // Integration Data
  getIntegrationData(): DemoIntegrationData {
    return {
      connected: [
        {
          id: 'hubspot',
          name: 'HubSpot CRM',
          type: 'crm',
          status: 'active',
          lastSync: '2 minutes ago',
          dataPoints: 1247,
          metrics: {
            contacts: 2847,
            deals: 156,
            pipeline: 2450000,
          },
        },
        {
          id: 'stripe',
          name: 'Stripe Payments',
          type: 'payment',
          status: 'active',
          lastSync: '1 minute ago',
          dataPoints: 892,
          metrics: {
            transactions: 892,
            revenue: 125000,
            refunds: 2,
          },
        },
        {
          id: 'slack',
          name: 'Slack',
          type: 'communication',
          status: 'active',
          lastSync: '5 minutes ago',
          dataPoints: 2156,
          metrics: {
            messages: 2156,
            channels: 12,
            members: 45,
          },
        },
        {
          id: 'google-analytics',
          name: 'Google Analytics',
          type: 'analytics',
          status: 'active',
          lastSync: '3 minutes ago',
          dataPoints: 3247,
          metrics: {
            pageViews: 15420,
            visitors: 3247,
            conversions: 156,
          },
        },
      ],
      available: [
        {
          id: 'salesforce',
          name: 'Salesforce',
          type: 'crm',
          description: 'Enterprise CRM with advanced automation',
          features: ['Lead Management', 'Sales Automation', 'Analytics'],
          pricing: '$25/user/month',
        },
        {
          id: 'zapier',
          name: 'Zapier',
          type: 'automation',
          description: 'Connect apps and automate workflows',
          features: ['Workflow Automation', 'App Integration', 'Triggers'],
          pricing: '$20/month',
        },
        {
          id: 'quickbooks',
          name: 'QuickBooks',
          type: 'accounting',
          description: 'Small business accounting software',
          features: ['Invoicing', 'Expense Tracking', 'Financial Reports'],
          pricing: '$30/month',
        },
      ],
      insights: [
        {
          id: 'insight-1',
          integration: 'HubSpot CRM',
          type: 'data_sync',
          title: 'Data Sync Performance',
          description: '99.8% sync success rate over last 30 days',
          value: 99.8,
          trend: 'up',
        },
        {
          id: 'insight-2',
          integration: 'Stripe Payments',
          type: 'performance',
          title: 'Payment Processing',
          description: 'Average processing time: 1.2 seconds',
          value: 1.2,
          trend: 'stable',
        },
        {
          id: 'insight-3',
          integration: 'Slack',
          type: 'usage',
          title: 'Team Communication',
          description: '45% increase in team collaboration',
          value: 45,
          trend: 'up',
        },
      ],
    };
  }

  // Billing Data
  getBillingData(): DemoBillingData {
    return {
      subscription: {
        plan: 'professional',
        status: 'active',
        nextBilling: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 299,
      },
      usage: {
        aiConversations: this.demoData?.ai.conversations || 1000,
        storageUsed: 45.2,
        integrations: this.demoData?.integrations.connected || 4,
        users: this.demoData?.business.employees || 50,
      },
      invoices: [
        {
          id: 'inv-001',
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 299,
          status: 'paid',
          description: 'Professional Plan - January 2024',
        },
        {
          id: 'inv-002',
          date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 299,
          status: 'paid',
          description: 'Professional Plan - December 2023',
        },
        {
          id: 'inv-003',
          date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 299,
          status: 'paid',
          description: 'Professional Plan - November 2023',
        },
      ],
      paymentMethods: [
        {
          id: 'pm-001',
          type: 'card',
          last4: '4242',
          brand: 'Visa',
          expiry: '12/25',
          isDefault: true,
        },
        {
          id: 'pm-002',
          type: 'bank',
          last4: '1234',
          brand: 'Chase',
          isDefault: false,
        },
      ],
    };
  }

  // Generic mock data generator
  generateMockData<T>(template: T, variations: number = 1): T[] {
    const results: T[] = [];
    for (let i = 0; i < variations; i++) {
      results.push({ ...template });
    }
    return results;
  }
}

// Export singleton instance
export const demoService = new DemoService(); 