import { BaseService } from '../../core/services/BaseService';

export interface SimilarOrganization {
  id: string;
  industry: string;
  companySize: string;
  maturityLevel: string;
  sophisticationLevel: string;
  insightCount: number;
  buildingBlocksCovered: string[];
  priorityAreas: string[];
  toolCategoriesCount: number;
  integrationCount: number;
  selectedIntegrations: string[];
  confidenceScore: number;
  similarityScore: number;
  createdAt: string;
}

export interface SimilarOrganizationsSummary {
  message: string;
  summary: {
    totalOrganizations: number;
    averageInsights: number;
    averageToolCategories: number;
    averageIntegrations: number;
    topBuildingBlocks: string[];
  };
  organizations: SimilarOrganization[];
}

export interface IndustryTrends {
  industry: string;
  companySize: string;
  maturityLevel: string;
  sophisticationLevel: string;
  organizationCount: number;
  avgInsightsPerOrg: number;
  avgToolCategories: number;
  avgIntegrations: number;
  avgConfidence: number;
  topBuildingBlocks: string[];
  topPriorities: string[];
}

export interface MaturityLevelInsights {
  maturityLevel: string;
  sophisticationLevel: string;
  organizationCount: number;
  avgInsights: number;
  avgToolCategories: number;
  avgIntegrations: number;
  avgConfidence: number;
  commonInsights: string[];
  toolAdoption: Record<string, number>;
}

export class InsightsAnalyticsClient extends BaseService {
  private baseUrl = '/api/analytics';

  /**
   * Get similar organizations based on user context
   */
  async getSimilarOrganizations(userContext: {
    industry?: string;
    companySize?: string;
    maturityLevel?: string;
    sophisticationLevel?: string;
    keyPriorities?: string[];
    selectedTools?: Record<string, string[]>;
  }, limit: number = 5): Promise<SimilarOrganizationsSummary> {
    return this.executeDbOperation(async () => {
      const response = await fetch(`${this.baseUrl}/similar-organizations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify({ userContext, limit }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get similar organizations: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    });
  }

  /**
   * Get industry trends and insights
   */
  async getIndustryTrends(industry: string, timeRange: string = '90 days'): Promise<IndustryTrends[]> {
    return this.executeDbOperation(async () => {
      const response = await fetch(`${this.baseUrl}/industry-trends`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify({ industry, timeRange }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get industry trends: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    });
  }

  /**
   * Get maturity level insights and recommendations
   */
  async getMaturityLevelInsights(maturityLevel: string, industry?: string): Promise<MaturityLevelInsights[]> {
    return this.executeDbOperation(async () => {
      const response = await fetch(`${this.baseUrl}/maturity-insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify({ maturityLevel, industry }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get maturity level insights: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    });
  }

  /**
   * Get comprehensive analytics dashboard data
   */
  async getAnalyticsDashboard(userContext: {
    industry?: string;
    companySize?: string;
    maturityLevel?: string;
    sophisticationLevel?: string;
    keyPriorities?: string[];
    selectedTools?: Record<string, string[]>;
  }) {
    return this.executeDbOperation(async () => {
      const [similarOrgs, industryTrends, maturityInsights] = await Promise.all([
        this.getSimilarOrganizations(userContext),
        userContext.industry ? this.getIndustryTrends(userContext.industry) : Promise.resolve([]),
        userContext.maturityLevel ? this.getMaturityLevelInsights(userContext.maturityLevel, userContext.industry) : Promise.resolve([])
      ]);

      return {
        similarOrganizations: similarOrgs,
        industryTrends,
        maturityInsights,
        summary: {
          hasSimilarOrgs: similarOrgs.organizations.length > 0,
          hasIndustryTrends: industryTrends.length > 0,
          hasMaturityInsights: maturityInsights.length > 0,
          totalDataPoints: similarOrgs.summary.totalOrganizations + industryTrends.length + maturityInsights.length
        }
      };
    });
  }
}
