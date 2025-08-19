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
          company_id: profile.companyId,
          profile_data: profile,
          health_score: profile.healthScore,
          maturity_level: profile.maturityLevel,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      );

      if (error) {
        logger.error('Error saving quantum profile', { error });
        return this.error('Failed to save quantum business profile', error);
      }

      logger.info('Quantum business profile saved successfully', { profileId: profile.id });

      return this.success(profile, {
        insights,
        recommendations
      });
    } catch (error) {
      logger.error('Unexpected error saving quantum profile', { error });
      return this.error('Unexpected error saving quantum business profile', error);
    }
  }

  /**
   * Get quantum business profile for a company
   */
  async getQuantumProfile(
    companyId: string
  ): Promise<QuantumBusinessServiceResponse<QuantumBusinessProfile | null>> {
    try {
      logger.info('Fetching quantum business profile', { companyId });

      const { data, error } = await selectOne(
        'quantum_business_profiles',
        { company_id: companyId },
        { orderBy: 'updated_at', orderDirection: 'desc' }
      );

      if (error) {
        logger.error('Error fetching quantum profile', { error });
        return this.error('Failed to fetch quantum business profile', error);
      }

      if (!data) {
        return this.success(null);
      }

      const profile: QuantumBusinessProfile = data.profile_data;
      const insights = generateQuantumInsights(profile);
      const recommendations = generateQuantumRecommendations(profile);

      logger.info('Quantum business profile fetched successfully', { profileId: profile.id });

      return this.success(profile, {
        insights,
        recommendations
      });
    } catch (error) {
      logger.error('Unexpected error fetching quantum profile', { error });
      return this.error('Unexpected error fetching quantum business profile', error);
    }
  }

  /**
   * Update a specific quantum block
   */
  async updateQuantumBlock(
    companyId: string,
    blockId: string,
    blockData: Partial<QuantumBlockProfile>
  ): Promise<QuantumBusinessServiceResponse<QuantumBusinessProfile>> {
    try {
      logger.info('Updating quantum block', { companyId, blockId });

      // Get current profile
      const currentProfileResponse = await this.getQuantumProfile(companyId);
      if (!currentProfileResponse.success || !currentProfileResponse.data) {
        return this.error('No quantum profile found for company');
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

      logger.info('Quantum block updated successfully', { companyId, blockId });

      return this.success(updatedProfile, {
        insights: saveResponse.insights,
        recommendations: saveResponse.recommendations
      });
    } catch (error) {
      logger.error('Unexpected error updating quantum block', { error });
      return this.error('Unexpected error updating quantum block', error);
    }
  }

  /**
   * Get insights for a quantum business profile
   */
  async getQuantumInsights(
    companyId: string
  ): Promise<QuantumBusinessServiceResponse<QuantumInsight[]>> {
    try {
      logger.info('Generating quantum insights', { companyId });

      const profileResponse = await this.getQuantumProfile(companyId);
      if (!profileResponse.success || !profileResponse.data) {
        return this.error('No quantum profile found for company');
      }

      const insights = generateQuantumInsights(profileResponse.data);

      logger.info('Quantum insights generated successfully', { 
        companyId, 
        insightCount: insights.length 
      });

      return this.success(insights);
    } catch (error) {
      logger.error('Unexpected error generating quantum insights', { error });
      return this.error('Unexpected error generating quantum insights', error);
    }
  }

  /**
   * Get recommendations for a quantum business profile
   */
  async getQuantumRecommendations(
    companyId: string
  ): Promise<QuantumBusinessServiceResponse<QuantumRecommendation[]>> {
    try {
      logger.info('Generating quantum recommendations', { companyId });

      const profileResponse = await this.getQuantumProfile(companyId);
      if (!profileResponse.success || !profileResponse.data) {
        return this.error('No quantum profile found for company');
      }

      const recommendations = generateQuantumRecommendations(profileResponse.data);

      logger.info('Quantum recommendations generated successfully', { 
        companyId, 
        recommendationCount: recommendations.length 
      });

      return this.success(recommendations);
    } catch (error) {
      logger.error('Unexpected error generating quantum recommendations', { error });
      return this.error('Unexpected error generating quantum recommendations', error);
    }
  }

  /**
   * Deploy AI agent for a specific quantum block
   */
  async deployAIAgent(
    companyId: string,
    blockId: string,
    capabilityId: string
  ): Promise<QuantumBusinessServiceResponse<{ agentId: string; status: string }>> {
    try {
      logger.info('Deploying AI agent', { companyId, blockId, capabilityId });

      // Get quantum block configuration
      const quantumBlock = getQuantumBlock(blockId);
      if (!quantumBlock) {
        return this.error('Invalid quantum block ID');
      }

      // Find the AI capability
      const capability = quantumBlock.aiCapabilities.find(cap => cap.id === capabilityId);
      if (!capability) {
        return this.error('Invalid AI capability ID');
      }

      // Call AI agent deployment edge function
      const { data, error } = await callEdgeFunction('deploy-ai-agent', {
        companyId,
        blockId,
        capabilityId,
        capability: capability,
        block: quantumBlock
      });

      if (error) {
        logger.error('Error deploying AI agent', { error });
        return this.error('Failed to deploy AI agent', error);
      }

      logger.info('AI agent deployed successfully', { 
        companyId, 
        blockId, 
        capabilityId,
        agentId: data.agentId 
      });

      return this.success({
        agentId: data.agentId,
        status: 'deployed'
      });
    } catch (error) {
      logger.error('Unexpected error deploying AI agent', { error });
      return this.error('Unexpected error deploying AI agent', error);
    }
  }

  /**
   * Get quantum business health score
   */
  async getBusinessHealthScore(
    companyId: string
  ): Promise<QuantumBusinessServiceResponse<{ score: number; details: any }>> {
    try {
      logger.info('Calculating business health score', { companyId });

      const profileResponse = await this.getQuantumProfile(companyId);
      if (!profileResponse.success || !profileResponse.data) {
        return this.error('No quantum profile found for company');
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
        companyId, 
        healthScore 
      });

      return this.success({
        score: healthScore,
        details: healthDetails
      });
    } catch (error) {
      logger.error('Unexpected error calculating business health score', { error });
      return this.error('Unexpected error calculating business health score', error);
    }
  }

  /**
   * Get quantum business maturity assessment
   */
  async getMaturityAssessment(
    companyId: string
  ): Promise<QuantumBusinessServiceResponse<{ level: string; score: number; recommendations: string[] }>> {
    try {
      logger.info('Assessing business maturity', { companyId });

      const profileResponse = await this.getQuantumProfile(companyId);
      if (!profileResponse.success || !profileResponse.data) {
        return this.error('No quantum profile found for company');
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
        companyId, 
        maturityLevel,
        healthScore 
      });

      return this.success({
        level: maturityLevel,
        score: healthScore,
        recommendations
      });
    } catch (error) {
      logger.error('Unexpected error assessing business maturity', { error });
      return this.error('Unexpected error assessing business maturity', error);
    }
  }

  /**
   * Get quantum business dashboard data
   */
  async getDashboardData(
    companyId: string
  ): Promise<QuantumBusinessServiceResponse<{
    profile: QuantumBusinessProfile;
    insights: QuantumInsight[];
    recommendations: QuantumRecommendation[];
    healthScore: number;
    maturityLevel: string;
  }>> {
    try {
      logger.info('Fetching quantum dashboard data', { companyId });

      const profileResponse = await this.getQuantumProfile(companyId);
      if (!profileResponse.success || !profileResponse.data) {
        return this.error('No quantum profile found for company');
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
        companyId, 
        healthScore,
        maturityLevel 
      });

      return this.success({
        profile,
        insights,
        recommendations,
        healthScore,
        maturityLevel
      });
    } catch (error) {
      logger.error('Unexpected error fetching quantum dashboard data', { error });
      return this.error('Unexpected error fetching quantum dashboard data', error);
    }
  }
}

// Export singleton instance
export const quantumBusinessService = QuantumBusinessService.getInstance();
