/**
 * Quantum Business Service
 * 
 * Manages quantum business model operations including profile management,
 * insights generation, recommendations, and AI agent deployment.
 */

import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import { 
  callRPC, 
  callEdgeFunction, 
  selectData, 
  selectOne, 
  insertOne, 
  updateOne, 
  upsertOne, 
  deleteOne 
} from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';
import { 
  type QuantumBusinessProfile,
  type QuantumBlockProfile,
  type QuantumInsight,
  type QuantumRecommendation,
  getAllQuantumBlocks,
  getQuantumBlock,
  calculateBusinessHealth,
  generateQuantumInsights,
  generateQuantumRecommendations
} from '@/core/config/quantumBusinessModel';

export interface QuantumBusinessServiceResponse<T> extends ServiceResponse<T> {
  insights?: QuantumInsight[];
  recommendations?: QuantumRecommendation[];
}

export class QuantumBusinessService extends BaseService {
  private static instance: QuantumBusinessService;

  public static getInstance(): QuantumBusinessService {
    if (!QuantumBusinessService.instance) {
      QuantumBusinessService.instance = new QuantumBusinessService();
    }
    return QuantumBusinessService.instance;
  }

  /**
   * Create or update a quantum business profile
   */
  async saveQuantumProfile(
    profile: QuantumBusinessProfile
  ): Promise<QuantumBusinessServiceResponse<QuantumBusinessProfile>> {
    try {
      logger.info('Saving quantum business profile', { profileId: profile.id });

      // Calculate health score
      profile.healthScore = calculateBusinessHealth(profile);

      // Generate insights and recommendations
      const insights = generateQuantumInsights(profile);
      const recommendations = generateQuantumRecommendations(profile);

      // Save to database
      const { data, error } = await upsertOne(
        'quantum_business_profiles',
        {
          id: profile.id,
          organization_id: profile.organizationId, // Changed from company_id
          profile_data: profile,
          health_score: profile.healthScore,
          maturity_level: profile.maturityLevel,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      );

      if (error) {
        logger.error('Error saving quantum profile', { error });
        return this.handleError('Failed to save quantum business profile', error);
      }

      logger.info('Quantum business profile saved successfully', { profileId: profile.id });

      return this.createResponse(profile, {
        insights,
        recommendations
      });
    } catch (error) {
      logger.error('Unexpected error saving quantum profile', { error });
      return this.handleError('Unexpected error saving quantum business profile', error);
    }
  }

  /**
   * Get quantum business profile for an organization
   */
  async getQuantumProfile(
    organizationId: string // Changed from companyId
  ): Promise<QuantumBusinessServiceResponse<QuantumBusinessProfile | null>> {
    try {
      logger.info('Fetching quantum business profile', { organizationId });

      console.log('🔍 [QuantumBusinessService] Starting getQuantumProfile with organizationId:', organizationId);

      const { data, error } = await selectData(
        'quantum_business_profiles',
        '*',
        { organization_id: organizationId } // Changed from company_id
      );

      console.log('🔍 [QuantumBusinessService] Database query result:', { data, error });

      if (error) {
        logger.error('Error fetching quantum profile', { error });
        console.error('❌ [QuantumBusinessService] Database error:', error);
        return this.handleError('Failed to fetch quantum business profile', error);
      }

      if (!data || data.length === 0) {
        console.log('ℹ️ [QuantumBusinessService] No quantum profile found for organizationId:', organizationId);
        // Auto-create a default profile on first access
        const defaultBlocks = getAllQuantumBlocks().map(block => ({
          blockId: block.id,
          strength: 50,
          health: 50,
          properties: {},
          healthIndicators: {},
          aiCapabilities: [],
          marketplaceIntegrations: []
        }));

        const defaultProfile: QuantumBusinessProfile = {
          id: crypto.randomUUID(),
          organizationId,
          blocks: defaultBlocks,
          relationships: [],
          healthScore: calculateBusinessHealth({
            id: 'temp',
            organizationId,
            blocks: defaultBlocks,
            relationships: [],
            healthScore: 0,
            maturityLevel: 'startup',
            lastUpdated: new Date().toISOString()
          }),
          maturityLevel: 'startup',
          lastUpdated: new Date().toISOString()
        };

        const saveResult = await this.saveQuantumProfile(defaultProfile);
        if (!saveResult.success || !saveResult.data) {
          return this.handleError('Failed to initialize quantum profile', saveResult.error || new Error('Initialization failed'));
        }

        const insightsInit = saveResult.insights ?? generateQuantumInsights(saveResult.data);
        const recommendationsInit = saveResult.recommendations ?? generateQuantumRecommendations(saveResult.data);
        return this.createResponse(saveResult.data, { insights: insightsInit, recommendations: recommendationsInit });
      }

      // Get the most recent profile
      const latestProfile = data[0] as any;
      console.log('🔍 [QuantumBusinessService] Latest profile from database:', latestProfile);
      
      const profile: QuantumBusinessProfile = latestProfile.profile_data;
      console.log('🔍 [QuantumBusinessService] Parsed profile data:', profile);
      
      const insights = generateQuantumInsights(profile);
      const recommendations = generateQuantumRecommendations(profile);

      logger.info('Quantum business profile fetched successfully', { profileId: profile.id });

      return this.createResponse(profile, {
        insights,
        recommendations
      });
    } catch (error) {
      logger.error('Unexpected error fetching quantum profile', { error });
      console.error('❌ [QuantumBusinessService] Unexpected error:', error);
      return this.handleError('Unexpected error fetching quantum business profile', error);
    }
  }

  /**
   * Update a specific quantum block
   */
  async updateQuantumBlock(
    organizationId: string, // Changed from companyId
    blockId: string,
    blockData: Partial<QuantumBlockProfile>
  ): Promise<QuantumBusinessServiceResponse<QuantumBusinessProfile>> {
    try {
      logger.info('Updating quantum block', { organizationId, blockId });

      // Get current profile
      const currentProfileResponse = await this.getQuantumProfile(organizationId);
      if (!currentProfileResponse.success || !currentProfileResponse.data) {
        return this.handleError('No quantum profile found for organization', new Error('Profile not found'));
      }

      const profile = currentProfileResponse.data;

      // Update the specific block
      const updatedBlocks = profile.blocks.map(block => 
        block.blockId === blockId 
          ? { ...block, ...blockData }
          : block
      );

      // Create updated profile
      const updatedProfile: QuantumBusinessProfile = {
        ...profile,
        blocks: updatedBlocks,
        healthScore: calculateBusinessHealth({ ...profile, blocks: updatedBlocks }),
        lastUpdated: new Date().toISOString()
      };

      // Save updated profile
      const saveResponse = await this.saveQuantumProfile(updatedProfile);
      if (!saveResponse.success) {
        return saveResponse;
      }

      logger.info('Quantum block updated successfully', { organizationId, blockId });

      return this.createResponse(updatedProfile, {
        insights: saveResponse.insights,
        recommendations: saveResponse.recommendations
      });
    } catch (error) {
      logger.error('Unexpected error updating quantum block', { error });
      return this.handleError('Unexpected error updating quantum block', error);
    }
  }

  /**
   * Get insights for a quantum business profile
   */
  async getQuantumInsights(
    organizationId: string // Changed from companyId
  ): Promise<QuantumBusinessServiceResponse<QuantumInsight[]>> {
    try {
      logger.info('Generating quantum insights', { organizationId });

      const profileResponse = await this.getQuantumProfile(organizationId);
      if (!profileResponse.success || !profileResponse.data) {
        return this.handleError('No quantum profile found for organization');
      }

      const insights = generateQuantumInsights(profileResponse.data);

      logger.info('Quantum insights generated successfully', { 
        organizationId, 
        insightCount: insights.length 
      });

      return this.createResponse(insights);
    } catch (error) {
      logger.error('Unexpected error generating quantum insights', { error });
      return this.handleError('Unexpected error generating quantum insights', error);
    }
  }

  /**
   * Get recommendations for a quantum business profile
   */
  async getQuantumRecommendations(
    organizationId: string // Changed from companyId
  ): Promise<QuantumBusinessServiceResponse<QuantumRecommendation[]>> {
    try {
      logger.info('Generating quantum recommendations', { organizationId });

      const profileResponse = await this.getQuantumProfile(organizationId);
      if (!profileResponse.success || !profileResponse.data) {
        return this.handleError('No quantum profile found for organization');
      }

      const recommendations = generateQuantumRecommendations(profileResponse.data);

      logger.info('Quantum recommendations generated successfully', { 
        organizationId, 
        recommendationCount: recommendations.length 
      });

      return this.createResponse(recommendations);
    } catch (error) {
      logger.error('Unexpected error generating quantum recommendations', { error });
      return this.handleError('Unexpected error generating quantum recommendations', error);
    }
  }

  /**
   * Deploy AI agent for a specific quantum block
   */
  async deployAIAgent(
    organizationId: string, // Changed from companyId
    blockId: string,
    capabilityId: string
  ): Promise<QuantumBusinessServiceResponse<{ agentId: string; status: string }>> {
    try {
      logger.info('Deploying AI agent', { organizationId, blockId, capabilityId });

      // Get quantum block configuration
      const quantumBlock = getQuantumBlock(blockId);
      if (!quantumBlock) {
        return this.handleError('Invalid quantum block ID');
      }

      // Find the AI capability
      const capability = quantumBlock.aiCapabilities.find(cap => cap.id === capabilityId);
      if (!capability) {
        return this.handleError('Invalid AI capability ID');
      }

      // Call AI agent deployment edge function
      const { data, error } = await callEdgeFunction('deploy-ai-agent', {
        organizationId,
        blockId,
        capabilityId,
        capability: capability,
        block: quantumBlock
      });

      if (error) {
        logger.error('Error deploying AI agent', { error });
        return this.handleError('Failed to deploy AI agent', error);
      }

      logger.info('AI agent deployed successfully', { 
        organizationId, 
        blockId, 
        capabilityId,
        agentId: data.agentId 
      });

      return this.createResponse({
        agentId: data.agentId,
        status: 'deployed'
      });
    } catch (error) {
      logger.error('Unexpected error deploying AI agent', { error });
      return this.handleError('Unexpected error deploying AI agent', error);
    }
  }

  /**
   * Get quantum business health score
   */
  async getBusinessHealthScore(
    organizationId: string // Changed from companyId
  ): Promise<QuantumBusinessServiceResponse<{ score: number; details: any }>> {
    try {
      logger.info('Calculating business health score', { organizationId });

      const profileResponse = await this.getQuantumProfile(organizationId);
      if (!profileResponse.success || !profileResponse.data) {
        return this.handleError('No quantum profile found for organization');
      }

      const profile = profileResponse.data;
      const healthScore = calculateBusinessHealth(profile);

      // Calculate block-specific health details
      const healthDetails = profile.blocks.map(block => {
        const quantumBlock = getQuantumBlock(block.blockId);
        return {
          blockId: block.blockId,
          blockName: quantumBlock?.name || 'Unknown',
          strength: block.strength,
          health: block.health,
          overallScore: Math.round((block.strength + block.health) / 2)
        };
      });

      logger.info('Business health score calculated successfully', { 
        organizationId, 
        healthScore 
      });

      return this.createResponse({
        score: healthScore,
        details: healthDetails
      });
    } catch (error) {
      logger.error('Unexpected error calculating business health score', { error });
      return this.handleError('Unexpected error calculating business health score', error);
    }
  }

  /**
   * Get quantum business maturity assessment
   */
  async getMaturityAssessment(
    organizationId: string // Changed from companyId
  ): Promise<QuantumBusinessServiceResponse<{ level: string; score: number; recommendations: string[] }>> {
    try {
      logger.info('Assessing business maturity', { organizationId });

      const profileResponse = await this.getQuantumProfile(organizationId);
      if (!profileResponse.success || !profileResponse.data) {
        return this.handleError('No quantum profile found for organization');
      }

      const profile = profileResponse.data;
      const healthScore = calculateBusinessHealth(profile);

      // Determine maturity level based on health score
      let maturityLevel: string;
      let recommendations: string[] = [];

      if (healthScore >= 85) {
        maturityLevel = 'mature';
        recommendations = [
          'Focus on optimization and scaling',
          'Explore advanced AI capabilities',
          'Consider international expansion'
        ];
      } else if (healthScore >= 70) {
        maturityLevel = 'scaling';
        recommendations = [
          'Strengthen weak quantum blocks',
          'Implement advanced automation',
          'Build scalable processes'
        ];
      } else if (healthScore >= 50) {
        maturityLevel = 'growing';
        recommendations = [
          'Address critical health issues',
          'Establish core processes',
          'Build foundational systems'
        ];
      } else {
        maturityLevel = 'startup';
        recommendations = [
          'Focus on core business fundamentals',
          'Establish basic processes',
          'Build essential systems'
        ];
      }

      logger.info('Business maturity assessment completed', { 
        organizationId, 
        maturityLevel,
        healthScore 
      });

      return this.createResponse({
        level: maturityLevel,
        score: healthScore,
        recommendations
      });
    } catch (error) {
      logger.error('Unexpected error assessing business maturity', { error });
      return this.handleError('Unexpected error assessing business maturity', error);
    }
  }

  /**
   * Get quantum business dashboard data
   */
  async getDashboardData(
    organizationId: string // Changed from companyId
  ): Promise<QuantumBusinessServiceResponse<{
    profile: QuantumBusinessProfile;
    insights: QuantumInsight[];
    recommendations: QuantumRecommendation[];
    healthScore: number;
    maturityLevel: string;
  }>> {
    try {
      logger.info('Fetching quantum dashboard data', { organizationId });

      const profileResponse = await this.getQuantumProfile(organizationId);
      if (!profileResponse.success || !profileResponse.data) {
        return this.handleError('No quantum profile found for organization');
      }

      const profile = profileResponse.data;
      const insights = generateQuantumInsights(profile);
      const recommendations = generateQuantumRecommendations(profile);
      const healthScore = calculateBusinessHealth(profile);

      // Determine maturity level
      let maturityLevel = 'startup';
      if (healthScore >= 85) maturityLevel = 'mature';
      else if (healthScore >= 70) maturityLevel = 'scaling';
      else if (healthScore >= 50) maturityLevel = 'growing';

      logger.info('Quantum dashboard data fetched successfully', { 
        organizationId, 
        healthScore,
        maturityLevel 
      });

      return this.createResponse({
        profile,
        insights,
        recommendations,
        healthScore,
        maturityLevel
      });
    } catch (error) {
      logger.error('Unexpected error fetching quantum dashboard data', { error });
      return this.handleError('Unexpected error fetching quantum dashboard data', error);
    }
  }
}

// Export singleton instance
export const quantumBusinessService = QuantumBusinessService.getInstance();
