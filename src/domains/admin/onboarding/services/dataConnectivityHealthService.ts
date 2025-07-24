/**
 * Data Connectivity Health Service
 * Measures business health based on what data sources are connected and verified in Nexus
 * Higher scores for verified/connected data vs. self-reported data
 */

import { supabase, dbService } from '@/core/supabase';
import { logger } from '../security/logger';

export interface DataSource {
  id: string;
  name: string;
  category: 'business_profile' | 'communications' | 'sales' | 'finance' | 'operations' | 'marketing';
  isConnected: boolean;
  isVerified: boolean;
  accessLevel: 'none' | 'basic' | 'read' | 'full';
  lastSync?: string;
  pointsValue: number;
  description: string;
}

export interface ConnectivityHealthData {
  overallScore: number;
  maxPossibleScore: number;
  completionPercentage: number;
  connectedSources: DataSource[];
  unconnectedSources: DataSource[];
  categoryBreakdown: {
    businessprofile: { score: number; maxScore: number; percentage: number };
    communications: { score: number; maxScore: number; percentage: number };
    sales: { score: number; maxScore: number; percentage: number };
    finance: { score: number; maxScore: number; percentage: number };
    operations: { score: number; maxScore: number; percentage: number };
    marketing: { score: number; maxScore: number; percentage: number };
  };
  recommendations: string[];
  dataQualityScore: number;
}

export class DataConnectivityHealthService {
  private static instance: DataConnectivityHealthService;
  
  public static getInstance(): DataConnectivityHealthService {
    if (!DataConnectivityHealthService.instance) {
      DataConnectivityHealthService.instance = new DataConnectivityHealthService();
    }
    return DataConnectivityHealthService.instance;
  }

  /**
   * All possible data sources that can be connected to Nexus
   * Points are weighted based on business value and verification difficulty
   */
  private getDataSourceDefinitions(): DataSource[] {
    return [
      // Business Profile (Foundation)
      {
        id: 'business_email',
        name: 'Business Email',
        category: 'business_profile',
        isConnected: false,
        isVerified: false,
        accessLevel: 'none',
        pointsValue: 15,
        description: 'Connect and verify your business email domain'
      },
      {
        id: 'business_address',
        name: 'Business Address',
        category: 'business_profile',
        isConnected: false,
        isVerified: false,
        accessLevel: 'none',
        pointsValue: 10,
        description: 'Verify your business address with Google Places'
      },
      {
        id: 'business_phone',
        name: 'Business Phone',
        category: 'business_profile',
        isConnected: false,
        isVerified: false,
        accessLevel: 'none',
        pointsValue: 8,
        description: 'Connect and verify your business phone number'
      },
      {
        id: 'business_website',
        name: 'Business Website',
        category: 'business_profile',
        isConnected: false,
        isVerified: false,
        accessLevel: 'none',
        pointsValue: 12,
        description: 'Connect and verify your business website'
      },

      // Communications (High Value)
      {
        id: 'gmail_integration',
        name: 'Gmail Integration',
        category: 'communications',
        isConnected: false,
        isVerified: false,
        accessLevel: 'none',
        pointsValue: 25,
        description: 'Connect Gmail for email intelligence and automation'
      },
      {
        id: 'calendar_integration',
        name: 'Calendar Integration',
        category: 'communications',
        isConnected: false,
        isVerified: false,
        accessLevel: 'none',
        pointsValue: 20,
        description: 'Connect Google/Outlook calendar for scheduling data'
      },
      {
        id: 'slack_integration',
        name: 'Slack Integration',
        category: 'communications',
        isConnected: false,
        isVerified: false,
        accessLevel: 'none',
        pointsValue: 15,
        description: 'Connect Slack for team communication insights'
      },

      // Sales (Critical for Business Health)
      {
        id: 'hubspot_crm',
        name: 'HubSpot CRM',
        category: 'sales',
        isConnected: false,
        isVerified: false,
        accessLevel: 'none',
        pointsValue: 30,
        description: 'Connect HubSpot CRM for sales pipeline data'
      },
      {
        id: 'salesforce_crm',
        name: 'Salesforce CRM',
        category: 'sales',
        isConnected: false,
        isVerified: false,
        accessLevel: 'none',
        pointsValue: 30,
        description: 'Connect Salesforce CRM for sales data'
      },
      {
        id: 'pipedrive_crm',
        name: 'Pipedrive CRM',
        category: 'sales',
        isConnected: false,
        isVerified: false,
        accessLevel: 'none',
        pointsValue: 25,
        description: 'Connect Pipedrive CRM for sales pipeline'
      },

      // Finance (High Business Value)
      {
        id: 'stripe_payments',
        name: 'Stripe Payments',
        category: 'finance',
        isConnected: false,
        isVerified: false,
        accessLevel: 'none',
        pointsValue: 35,
        description: 'Connect Stripe for payment and revenue data'
      },
      {
        id: 'quickbooks_accounting',
        name: 'QuickBooks Accounting',
        category: 'finance',
        isConnected: false,
        isVerified: false,
        accessLevel: 'none',
        pointsValue: 30,
        description: 'Connect QuickBooks for accounting data'
      },
      {
        id: 'bank_account',
        name: 'Bank Account',
        category: 'finance',
        isConnected: false,
        isVerified: false,
        accessLevel: 'none',
        pointsValue: 25,
        description: 'Connect bank account for cash flow data'
      },

      // Operations
      {
        id: 'google_workspace',
        name: 'Google Workspace',
        category: 'operations',
        isConnected: false,
        isVerified: false,
        accessLevel: 'none',
        pointsValue: 20,
        description: 'Connect Google Workspace for operational data'
      },
      {
        id: 'microsoft_365',
        name: 'Microsoft 365',
        category: 'operations',
        isConnected: false,
        isVerified: false,
        accessLevel: 'none',
        pointsValue: 20,
        description: 'Connect Microsoft 365 for operational data'
      },
      {
        id: 'aws_services',
        name: 'AWS Services',
        category: 'operations',
        isConnected: false,
        isVerified: false,
        accessLevel: 'none',
        pointsValue: 15,
        description: 'Connect AWS for infrastructure data'
      },

      // Marketing
      {
        id: 'google_analytics',
        name: 'Google Analytics',
        category: 'marketing',
        isConnected: false,
        isVerified: false,
        accessLevel: 'none',
        pointsValue: 25,
        description: 'Connect Google Analytics for website data'
      },
      {
        id: 'facebook_ads',
        name: 'Facebook Ads',
        category: 'marketing',
        isConnected: false,
        isVerified: false,
        accessLevel: 'none',
        pointsValue: 20,
        description: 'Connect Facebook Ads for marketing data'
      },
      {
        id: 'google_ads',
        name: 'Google Ads',
        category: 'marketing',
        isConnected: false,
        isVerified: false,
        accessLevel: 'none',
        pointsValue: 20,
        description: 'Connect Google Ads for marketing data'
      },
      {
        id: 'mailchimp_email',
        name: 'Mailchimp',
        category: 'marketing',
        isConnected: false,
        isVerified: false,
        accessLevel: 'none',
        pointsValue: 15,
        description: 'Connect Mailchimp for email marketing data'
      }
    ];
  }

  /**
   * Get actual connectivity status for current user
   */
  async getConnectivityStatus(userId: string): Promise<ConnectivityHealthData> {
    try {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log(`🔍 [dataConnectivityHealthService] Getting connectivity status for user: ${userId}`);
      
      // Get current user's connected integrations using centralized service
      const { data: integrations, error: integrationsError } = await dbService.getUserIntegrations(
        userId,
        'dataConnectivityHealthService.getConnectivityStatus'
      );

      if (integrationsError) {
        logger.error('Failed to fetch user integrations', integrationsError);
        throw integrationsError;
      }

      // Get user's company status if they have a company
      let companyStatus = null;
      if (profile?.company_id) {
        const { data: companyStatusData, error: companyStatusError } = await dbService.getCompanyStatus(
          profile.company_id,
          'dataConnectivityHealthService.getConnectivityStatus'
        );
        
        if (!companyStatusError) {
          companyStatus = companyStatusData;
        }
      }

      // Calculate connectivity metrics
      const activeIntegrations = integrations?.filter(integration => integration.status === 'active') || [];
      const totalIntegrations = integrations?.length || 0;
      const connectivityScore = totalIntegrations > 0 ? Math.round((activeIntegrations.length / totalIntegrations) * 100) : 0;

      return {
        userId,
        integrations: integrations || [],
        companyStatus,
        connectivityScore,
        lastUpdated: new Date().toISOString(),
        status: connectivityScore >= 80 ? 'healthy' : connectivityScore >= 50 ? 'warning' : 'critical'
      };
    } catch (error) {
      logger.error('Error getting connectivity status', error);
      throw error;
    }
  }

  /**
   * Record business health snapshot for historical tracking
   */
  private async recordHealthSnapshot(userId: string, healthData: ConnectivityHealthData): Promise<void> {
    try {
      const verifiedCount = healthData.connectedSources.filter(s => s.isVerified).length;

      await supabase.rpc('record_business_health_snapshot', {
        puser_id: userId,
        poverall_score: healthData.overallScore,
        pconnected_sources: healthData.connectedSources.length,
        pverified_sources: verifiedCount,
        pcategory_scores: healthData.categoryBreakdown,
        pdata_quality_score: healthData.dataQualityScore,
        pcompletion_percentage: healthData.completionPercentage
      });

      logger.info('Recorded business health snapshot', {
        userId,
        score: healthData.overallScore,
        connectedSources: healthData.connectedSources.length
      });

    } catch (error) {
      logger.error('Failed to record health snapshot', error);
      // Don't throw - this shouldn't break the main flow
    }
  }

  /**
   * Calculate business health score based on data connectivity
   */
  private calculateConnectivityScore(
    connectedSources: DataSource[], 
    unconnectedSources: DataSource[]
  ): Omit<ConnectivityHealthData, 'connectedSources' | 'unconnectedSources' | 'recommendations'> {
    
    const allSources = [...connectedSources, ...unconnectedSources];
    const maxPossibleScore = allSources.reduce((sum, source) => sum + source.pointsValue, 0);
    
    // Calculate actual score with multipliers for verification and access level
    let actualScore = 0;
    
    connectedSources.forEach(source => {
      let multiplier = 0.3; // Base score for just being connected
      
      if (source.isVerified) {
        multiplier += 0.4; // Big bonus for verification
      }
      
      // Access level bonuses
      switch (source.accessLevel) {
        case 'basic':
          multiplier += 0.1;
          break;
        case 'read':
          multiplier += 0.2;
          break;
        case 'full':
          multiplier += 0.3;
          break;
      }
      
      actualScore += source.pointsValue * multiplier;
    });
    
    const overallScore = Math.round((actualScore / maxPossibleScore) * 100);
    const completionPercentage = Math.round((connectedSources.length / allSources.length) * 100);
    
    // Calculate category breakdown
    const categoryBreakdown = this.calculateCategoryBreakdown(connectedSources, unconnectedSources);
    
    // Calculate data quality score (based on verification and access levels)
    const dataQualityScore = this.calculateDataQualityScore(connectedSources);
    
    return {
      overallScore,
      maxPossibleScore,
      completionPercentage,
      categoryBreakdown,
      dataQualityScore
    };
  }

  private calculateCategoryBreakdown(connectedSources: DataSource[], unconnectedSources: DataSource[]) {
    const categories: (keyof ConnectivityHealthData['categoryBreakdown'])[] = [
      'business_profile', 'communications', 'sales', 'finance', 'operations', 'marketing'
    ];
    
    const breakdown: any = {};
    
    categories.forEach(category => {
      const categoryConnected = connectedSources.filter(s => s.category === category);
      const categoryUnconnected = unconnectedSources.filter(s => s.category === category);
      const categoryTotal = [...categoryConnected, ...categoryUnconnected];
      
      const maxScore = categoryTotal.reduce((sum, source) => sum + source.pointsValue, 0);
      let actualScore = 0;
      
      categoryConnected.forEach(source => {
        let multiplier = 0.3;
        if (source.isVerified) multiplier += 0.4;
        switch (source.accessLevel) {
          case 'basic': multiplier += 0.1; break;
          case 'read': multiplier += 0.2; break;
          case 'full': multiplier += 0.3; break;
        }
        actualScore += source.pointsValue * multiplier;
      });
      
      breakdown[category] = {
        score: Math.round(actualScore),
        maxScore,
        percentage: maxScore > 0 ? Math.round((actualScore / maxScore) * 100) : 0
      };
    });
    
    return breakdown;
  }

  private calculateDataQualityScore(connectedSources: DataSource[]): number {
    if (connectedSources.length === 0) return 0;
    
    const qualitySum = connectedSources.reduce((sum, source) => {
      let quality = 30; // Base quality for connection
      if (source.isVerified) quality += 50;
      if (source.accessLevel === 'full') quality += 20;
      else if (source.accessLevel === 'read') quality += 15;
      else if (source.accessLevel === 'basic') quality += 10;
      
      return sum + quality;
    }, 0);
    
    return Math.round(qualitySum / connectedSources.length);
  }

  private generateRecommendations(connectedSources: DataSource[], unconnectedSources: DataSource[]): string[] {
    const recommendations: string[] = [];
    
    // High-value disconnected sources
    const highValueDisconnected = unconnectedSources
      .filter(source => source.pointsValue >= 25)
      .sort((a, b) => b.pointsValue - a.pointsValue)
      .slice(0, 3);
    
    if (highValueDisconnected.length > 0) {
      recommendations.push(`Connect ${highValueDisconnected[0].name} for ${highValueDisconnected[0].pointsValue} points`);
    }
    
    // Unverified sources
    const unverifiedSources = connectedSources.filter(source => !source.isVerified);
    if (unverifiedSources.length > 0) {
      recommendations.push(`Verify ${unverifiedSources.length} connected sources to increase your score`);
    }
    
    // Low access level sources
    const lowAccessSources = connectedSources.filter(source => source.accessLevel === 'basic');
    if (lowAccessSources.length > 0) {
      recommendations.push(`Upgrade access level for ${lowAccessSources.length} sources to unlock more features`);
    }
    
    // Category-specific recommendations
    const salesConnected = connectedSources.filter(s => s.category === 'sales').length;
    const financeConnected = connectedSources.filter(s => s.category === 'finance').length;
    
    if (salesConnected === 0) {
      recommendations.push('Connect a CRM system to track your sales pipeline');
    }
    
    if (financeConnected === 0) {
      recommendations.push('Connect financial data sources to monitor cash flow');
    }
    
    return recommendations.slice(0, 5); // Limit to 5 recommendations
  }
}

export const dataConnectivityHealthService = DataConnectivityHealthService.getInstance(); 