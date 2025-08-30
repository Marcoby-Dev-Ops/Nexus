import { insertOne, updateOne, selectOne, upsertOne, selectData as select } from '@/lib/api-client';
import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import { logger } from '@/shared/utils/logger';
import { z } from 'zod';

// Validation schemas
const UserContributionSchema = z.object({
  userIntegrationId: z.string().uuid(),
  companyIntegrationId: z.string().uuid(),
  contributionType: z.enum(['data_source', 'configuration', 'usage_pattern', 'performance_metrics', 'error_reporting', 'optimization_suggestion']),
  dataContribution: z.record(z.unknown()).optional(),
  contributionConfidence: z.number().min(0).max(1).optional(),
  impactScore: z.number().min(0).max(100).optional(),
});

const UserResponsibilitySchema = z.object({
  userId: z.string().uuid(),
  companyIntegrationId: z.string().uuid(),
  responsibilityType: z.enum(['owner', 'admin', 'user', 'viewer', 'contributor', 'reviewer', 'maintainer']),
  autoContribute: z.boolean().optional(),
  contributionFrequency: z.enum(['realtime', 'hourly', 'daily', 'weekly', 'manual']).optional(),
  contributionScope: z.record(z.unknown()).optional(),
});

type UserContributionData = z.infer<typeof UserContributionSchema>;
type UserResponsibilityData = z.infer<typeof UserResponsibilitySchema>;

interface CompanyIntegrationIntelligence {
  companyIntegrationId: string;
  aggregatedDataQualityScore: number;
  aggregatedReliabilityScore: number;
  totalContributingUsers: number;
  activeContributors: number;
  crossUserCorrelations: any[];
  userSynergyOpportunities: any[];
  conflictingUserPatterns: any[];
}

interface UserContributionResult {
  contributionId: string;
  contributionType: string;
  impactScore: number;
  reliabilityScore: number;
  consistencyScore: number;
  companyIntelligenceUpdated: boolean;
}

export class UserCompanyIntegrationBridgeService extends BaseService {
  constructor() {
    super('UserCompanyIntegrationBridgeService');
  }

  /**
   * Create or update a user contribution to company integration intelligence
   */
  async createUserContribution(
    contributionData: UserContributionData
  ): Promise<ServiceResponse<UserContributionResult>> {
    return this.executeDbOperation(async () => {
      const validatedData = UserContributionSchema.parse(contributionData);
      
      logger.info('Creating user contribution', { 
        userIntegrationId: validatedData.userIntegrationId,
        companyIntegrationId: validatedData.companyIntegrationId,
        contributionType: validatedData.contributionType
      });

      // Calculate scores based on contribution data
      const impactScore = validatedData.impactScore || this.calculateImpactScore(validatedData);
      const reliabilityScore = this.calculateReliabilityScore(validatedData);
      const consistencyScore = this.calculateConsistencyScore(validatedData);

      // Create or update user contribution
      const { data: contribution, error } = await upsertOne('user_integration_contributions', {
        user_integration_id: validatedData.userIntegrationId,
        company_integration_id: validatedData.companyIntegrationId,
        contribution_type: validatedData.contributionType,
        contribution_status: 'active',
        contribution_confidence: validatedData.contributionConfidence || 0.8,
        data_contribution: validatedData.dataContribution || {},
        data_freshness_hours: this.calculateDataFreshness(validatedData),
        data_quality_score: this.calculateDataQualityScore(validatedData),
        impact_score: impactScore,
        reliability_score: reliabilityScore,
        consistency_score: consistencyScore,
        updated_at: new Date().toISOString()
      });

      if (error) {
        logger.error('Failed to create user contribution', { error });
        return { data: null, error: `Failed to create user contribution: ${error.message}` };
      }

      // Trigger aggregation of company intelligence
      const aggregationResult = await this.aggregateCompanyIntelligence(validatedData.companyIntegrationId);
      if (!aggregationResult.success) {
        logger.warn('Failed to aggregate company intelligence', { error: aggregationResult.error });
      }

      logger.info('User contribution created successfully', { 
        contributionId: contribution?.id,
        impactScore,
        reliabilityScore 
      });

      return this.createResponse({
        contributionId: contribution?.id || '',
        contributionType: validatedData.contributionType,
        impactScore,
        reliabilityScore,
        consistencyScore,
        companyIntelligenceUpdated: aggregationResult.success
      });
    });
  }

  /**
   * Assign user responsibility for company integration
   */
  async assignUserResponsibility(
    responsibilityData: UserResponsibilityData
  ): Promise<ServiceResponse<void>> {
    return this.executeDbOperation(async () => {
      const validatedData = UserResponsibilitySchema.parse(responsibilityData);
      
      logger.info('Assigning user responsibility', { 
        userId: validatedData.userId,
        companyIntegrationId: validatedData.companyIntegrationId,
        responsibilityType: validatedData.responsibilityType
      });

      const { error } = await upsertOne('user_integration_responsibilities', {
        user_id: validatedData.userId,
        company_integration_id: validatedData.companyIntegrationId,
        responsibility_type: validatedData.responsibilityType,
        auto_contribute: validatedData.autoContribute ?? true,
        contribution_frequency: validatedData.contributionFrequency || 'realtime',
        contribution_scope: validatedData.contributionScope || {},
        assigned_by: validatedData.userId, // Self-assignment for now
        updated_at: new Date().toISOString()
      });

      if (error) {
        logger.error('Failed to assign user responsibility', { error });
        return { data: null, error: `Failed to assign user responsibility: ${error.message}` };
      }

      logger.info('User responsibility assigned successfully');
      return this.createResponse(undefined);
    });
  }

  /**
   * Get company integration intelligence aggregated from user contributions
   */
  async getCompanyIntegrationIntelligence(
    companyIntegrationId: string
  ): Promise<ServiceResponse<CompanyIntegrationIntelligence>> {
    return this.executeDbOperation(async () => {
      const { data: intelligence, error } = await selectOne(
        'company_integration_intelligence',
        { company_integration_id: companyIntegrationId }
      );

      if (error) {
        return { data: null, error: `Failed to get company integration intelligence: ${error.message}` };
      }

      return this.createResponse({
        companyIntegrationId,
        aggregatedDataQualityScore: intelligence?.aggregated_data_quality_score || 0,
        aggregatedReliabilityScore: intelligence?.aggregated_reliability_score || 0,
        totalContributingUsers: intelligence?.total_contributing_users || 0,
        activeContributors: intelligence?.active_contributors || 0,
        crossUserCorrelations: intelligence?.cross_user_correlations || [],
        userSynergyOpportunities: intelligence?.user_synergy_opportunities || [],
        conflictingUserPatterns: intelligence?.conflicting_user_patterns || []
      });
    });
  }

  /**
   * Get user contributions for a specific company integration
   */
  async getUserContributions(
    companyIntegrationId: string
  ): Promise<ServiceResponse<any[]>> {
    return this.executeDbOperation(async () => {
      const { data: contributions, error } = await select(
        'user_integration_contributions',
        { company_integration_id: companyIntegrationId },
        {
          orderBy: { column: 'created_at', direction: 'desc' }
        }
      );

      if (error) {
        return { data: null, error: `Failed to get user contributions: ${error.message}` };
      }

      return this.createResponse(contributions || []);
    });
  }

  /**
   * Get user responsibilities for company integrations
   */
  async getUserResponsibilities(
    userId: string
  ): Promise<ServiceResponse<any[]>> {
    return this.executeDbOperation(async () => {
      const { data: responsibilities, error } = await select(
        'user_integration_responsibilities',
        { user_id: userId }
      );

      if (error) {
        return { data: null, error: `Failed to get user responsibilities: ${error.message}` };
      }

      return this.createResponse(responsibilities || []);
    });
  }

  /**
   * Trigger aggregation of company intelligence from user contributions
   */
  private async aggregateCompanyIntelligence(
    companyIntegrationId: string
  ): Promise<ServiceResponse<void>> {
    try {
      // Call the database function to aggregate intelligence
      const { error } = await this.executeSql(
        `SELECT aggregate_user_contributions_to_company_intelligence($1)`,
        [companyIntegrationId]
      );

      if (error) {
        logger.error('Failed to aggregate company intelligence', { companyIntegrationId, error });
        return { data: null, error: `Failed to aggregate company intelligence: ${error.message}` };
      }

      return this.createResponse(undefined);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Calculate impact score based on contribution data
   */
  private calculateImpactScore(data: UserContributionData): number {
    let score = 50; // Base score

    // Adjust based on contribution type
    switch (data.contributionType) {
      case 'data_source':
        score += 20;
        break;
      case 'performance_metrics':
        score += 15;
        break;
      case 'error_reporting':
        score += 10;
        break;
      case 'optimization_suggestion':
        score += 25;
        break;
      default:
        score += 5;
    }

    // Adjust based on confidence
    if (data.contributionConfidence) {
      score += data.contributionConfidence * 20;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate reliability score
   */
  private calculateReliabilityScore(data: UserContributionData): number {
    let score = 60; // Base reliability

    // Adjust based on contribution type
    switch (data.contributionType) {
      case 'data_source':
        score += 20;
        break;
      case 'error_reporting':
        score -= 10;
        break;
      case 'optimization_suggestion':
        score += 10;
        break;
    }

    // Adjust based on confidence
    if (data.contributionConfidence) {
      score += data.contributionConfidence * 15;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate consistency score
   */
  private calculateConsistencyScore(data: UserContributionData): number {
    let score = 70; // Base consistency

    // Adjust based on contribution type
    switch (data.contributionType) {
      case 'usage_pattern':
        score += 15;
        break;
      case 'performance_metrics':
        score += 10;
        break;
      case 'error_reporting':
        score -= 5;
        break;
    }

    // Adjust based on confidence
    if (data.contributionConfidence) {
      score += data.contributionConfidence * 10;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate data freshness in hours
   */
  private calculateDataFreshness(data: UserContributionData): number {
    // Default to 24 hours if no specific data
    return 24;
  }

  /**
   * Calculate data quality score
   */
  private calculateDataQualityScore(data: UserContributionData): number {
    let score = 60; // Base quality

    // Adjust based on contribution type
    switch (data.contributionType) {
      case 'data_source':
        score += 25;
        break;
      case 'performance_metrics':
        score += 15;
        break;
      case 'error_reporting':
        score += 10;
        break;
      case 'optimization_suggestion':
        score += 20;
        break;
    }

    // Adjust based on confidence
    if (data.contributionConfidence) {
      score += data.contributionConfidence * 20;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Get cross-user correlation insights
   */
  async getCrossUserCorrelations(
    companyIntegrationId: string
  ): Promise<ServiceResponse<any[]>> {
    return this.executeDbOperation(async () => {
      const { data: intelligence, error } = await selectOne(
        'company_integration_intelligence',
        { company_integration_id: companyIntegrationId }
      );

      if (error) {
        return { data: null, error: `Failed to get cross-user correlations: ${error.message}` };
      }

      return this.createResponse(intelligence?.cross_user_correlations || []);
    });
  }

  /**
   * Get user synergy opportunities
   */
  async getUserSynergyOpportunities(
    companyIntegrationId: string
  ): Promise<ServiceResponse<any[]>> {
    return this.executeDbOperation(async () => {
      const { data: intelligence, error } = await selectOne(
        'company_integration_intelligence',
        { company_integration_id: companyIntegrationId }
      );

      if (error) {
        return { data: null, error: `Failed to get user synergy opportunities: ${error.message}` };
      }

      return this.createResponse(intelligence?.user_synergy_opportunities || []);
    });
  }

  /**
   * Get conflicting user patterns
   */
  async getConflictingUserPatterns(
    companyIntegrationId: string
  ): Promise<ServiceResponse<any[]>> {
    return this.executeDbOperation(async () => {
      const { data: intelligence, error } = await selectOne(
        'company_integration_intelligence',
        { company_integration_id: companyIntegrationId }
      );

      if (error) {
        return { data: null, error: `Failed to get conflicting user patterns: ${error.message}` };
      }

      return this.createResponse(intelligence?.conflicting_user_patterns || []);
    });
  }

  /**
   * Get comprehensive company integration analysis
   */
  async getCompanyIntegrationAnalysis(
    companyIntegrationId: string
  ): Promise<ServiceResponse<any>> {
    return this.executeDbOperation(async () => {
      // Get company integration details
      const { data: companyIntegration, error: ciError } = await selectOne(
        'company_integrations',
        companyIntegrationId
      );

      if (ciError) {
        return { data: null, error: `Failed to get company integration: ${ciError.message}` };
      }

      // Get aggregated intelligence
      const intelligenceResult = await this.getCompanyIntegrationIntelligence(companyIntegrationId);
      if (!intelligenceResult.success) {
        return { data: null, error: intelligenceResult.error };
      }

      // Get user contributions
      const contributionsResult = await this.getUserContributions(companyIntegrationId);
      if (!contributionsResult.success) {
        return { data: null, error: contributionsResult.error };
      }

      // Get cross-user insights
      const correlationsResult = await this.getCrossUserCorrelations(companyIntegrationId);
      const synergyResult = await this.getUserSynergyOpportunities(companyIntegrationId);
      const conflictsResult = await this.getConflictingUserPatterns(companyIntegrationId);

      return this.createResponse({
        companyIntegration,
        intelligence: intelligenceResult.data,
        userContributions: contributionsResult.data,
        crossUserCorrelations: correlationsResult.data || [],
        userSynergyOpportunities: synergyResult.data || [],
        conflictingUserPatterns: conflictsResult.data || [],
        analysis: {
          totalContributors: intelligenceResult.data?.totalContributingUsers || 0,
          activeContributors: intelligenceResult.data?.activeContributors || 0,
          averageDataQuality: intelligenceResult.data?.aggregatedDataQualityScore || 0,
          averageReliability: intelligenceResult.data?.aggregatedReliabilityScore || 0,
          correlationCount: correlationsResult.data?.length || 0,
          synergyOpportunities: synergyResult.data?.length || 0,
          conflictCount: conflictsResult.data?.length || 0
        }
      });
    });
  }
} 
