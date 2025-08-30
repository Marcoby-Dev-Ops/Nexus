import { callEdgeFunction } from '@/lib/api-client';
import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import { logger } from '@/shared/utils/logger';
import { z } from 'zod';

// Validation schemas
const CompanyIntelligenceDataSchema = z.object({
  companyId: z.string().uuid(),
  intelligenceProfile: z.object({
    businessContext: z.record(z.unknown()).optional(),
    marketPosition: z.record(z.unknown()).optional(),
    competitiveAnalysis: z.record(z.unknown()).optional(),
    customerIntelligence: z.record(z.unknown()).optional(),
    financialHealth: z.record(z.unknown()).optional(),
    operationalMetrics: z.record(z.unknown()).optional(),
    technologyStack: z.record(z.unknown()).optional(),
    riskAssessment: z.record(z.unknown()).optional(),
    growthIndicators: z.record(z.unknown()).optional(),
    sustainabilityMetrics: z.record(z.unknown()).optional(),
    talentAnalytics: z.record(z.unknown()).optional(),
    innovationIndex: z.record(z.unknown()).optional(),
    predictiveAnalytics: z.record(z.unknown()).optional(),
    aiInsights: z.array(z.record(z.unknown())).optional(),
  }).optional(),
  integrationAnalysis: z.object({
    activeIntegrations: z.array(z.string()).optional(),
    integrationHealth: z.record(z.unknown()).optional(),
    dataQualityScores: z.record(z.number()).optional(),
    crossPlatformCorrelations: z.array(z.record(z.unknown())).optional(),
    optimizationRecommendations: z.array(z.record(z.unknown())).optional(),
  }).optional(),
  performanceMetrics: z.object({
    kpiMetrics: z.record(z.unknown()).optional(),
    performanceTrends: z.record(z.unknown()).optional(),
    goalTracking: z.record(z.unknown()).optional(),
    alertTriggers: z.record(z.unknown()).optional(),
  }).optional(),
  analysisMetadata: z.object({
    lastAnalysisAt: z.string().optional(),
    analysisVersion: z.string().optional(),
    dataSources: z.array(z.string()).optional(),
    confidenceScores: z.record(z.number()).optional(),
  }).optional(),
});

type CompanyIntelligenceData = z.infer<typeof CompanyIntelligenceDataSchema>;

interface CompanyIntelligenceResult {
  companyId: string;
  intelligenceScore: number;
  intelligenceCompleted: boolean;
  profileUpdated: boolean;
  analysisCompleted: boolean;
  insightsGenerated: number;
  recommendationsCount: number;
}

export class CompanyIntelligenceService extends BaseService {
  constructor() {
    super('CompanyIntelligenceService');
  }

  /**
   * Update company intelligence profile with comprehensive analysis
   */
  async updateCompanyIntelligence(
    companyId: string,
    intelligenceData: CompanyIntelligenceData
  ): Promise<ServiceResponse<CompanyIntelligenceResult>> {
    return this.executeDbOperation(async () => {
      const validatedData = CompanyIntelligenceDataSchema.parse(intelligenceData);
      
      logger.info('Updating company intelligence', { 
        companyId, 
        hasProfile: !!validatedData.intelligenceProfile,
        hasAnalysis: !!validatedData.integrationAnalysis,
        hasMetrics: !!validatedData.performanceMetrics 
      });

      // 1. Update company intelligence profile
      const profileUpdateResult = await this.updateIntelligenceProfile(companyId, validatedData);
      if (!profileUpdateResult.success) {
        return { data: null, error: profileUpdateResult.error };
      }

      // 2. Update integration analysis
      const analysisResult = await this.updateIntegrationAnalysis(companyId, validatedData);
      if (!analysisResult.success) {
        return { data: null, error: analysisResult.error };
      }

      // 3. Update performance metrics
      const metricsResult = await this.updatePerformanceMetrics(companyId, validatedData);
      if (!metricsResult.success) {
        return { data: null, error: metricsResult.error };
      }

      // 4. Calculate and update intelligence score
      const scoreResult = await this.calculateIntelligenceScore(companyId);
      if (!scoreResult.success) {
        return { data: null, error: scoreResult.error };
      }

      // 5. Generate AI insights
      const insightsResult = await this.generateAIInsights(companyId, validatedData);
      if (!insightsResult.success) {
        return { data: null, error: insightsResult.error };
      }

      logger.info('Company intelligence updated successfully', { companyId });

      return this.createResponse({
        companyId,
        intelligenceScore: scoreResult.data?.score || 0,
        intelligenceCompleted: (scoreResult.data?.score || 0) >= 50,
        profileUpdated: true,
        analysisCompleted: true,
        insightsGenerated: insightsResult.data?.insightsCount || 0,
        recommendationsCount: insightsResult.data?.recommendationsCount || 0,
      });
    });
  }

  /**
   * Update intelligence profile with business context and analysis
   */
  private async updateIntelligenceProfile(
    companyId: string,
    data: CompanyIntelligenceData
  ): Promise<ServiceResponse<void>> {
    try {
      const profileUpdates: any = {};
      
      if (data.intelligenceProfile) {
        const profile = data.intelligenceProfile;
        
        if (profile.businessContext) profileUpdates.business_context = profile.businessContext;
        if (profile.marketPosition) profileUpdates.market_position = profile.marketPosition;
        if (profile.competitiveAnalysis) profileUpdates.competitive_analysis = profile.competitiveAnalysis;
        if (profile.customerIntelligence) profileUpdates.customer_intelligence = profile.customerIntelligence;
        if (profile.financialHealth) profileUpdates.financial_health = profile.financialHealth;
        if (profile.operationalMetrics) profileUpdates.operational_metrics = profile.operationalMetrics;
        if (profile.technologyStack) profileUpdates.technology_stack = profile.technologyStack;
        if (profile.riskAssessment) profileUpdates.risk_assessment = profile.riskAssessment;
        if (profile.growthIndicators) profileUpdates.growth_indicators = profile.growthIndicators;
        if (profile.sustainabilityMetrics) profileUpdates.sustainability_metrics = profile.sustainabilityMetrics;
        if (profile.talentAnalytics) profileUpdates.talent_analytics = profile.talentAnalytics;
        if (profile.innovationIndex) profileUpdates.innovation_index = profile.innovationIndex;
        if (profile.predictiveAnalytics) profileUpdates.predictive_analytics = profile.predictiveAnalytics;
        if (profile.aiInsights) profileUpdates.ai_insights = profile.aiInsights;
      }

      if (data.analysisMetadata) {
        const metadata = data.analysisMetadata;
        
        if (metadata.lastAnalysisAt) profileUpdates.last_intelligence_update = metadata.lastAnalysisAt;
        if (metadata.analysisVersion) profileUpdates.intelligence_version = metadata.analysisVersion;
        if (metadata.dataSources) profileUpdates.analysis_metadata = { dataSources: metadata.dataSources };
        if (metadata.confidenceScores) {
          profileUpdates.analysis_metadata = {
            ...profileUpdates.analysis_metadata,
            confidenceScores: metadata.confidenceScores
          };
        }
      }

      if (Object.keys(profileUpdates).length > 0) {
        profileUpdates.updated_at = new Date().toISOString();
        
        const { error } = await updateOne('companies', companyId, profileUpdates);
        if (error) {
          logger.error('Failed to update company intelligence profile', { companyId, error });
          return { data: null, error: `Failed to update intelligence profile: ${error.message}` };
        }
      }

      return this.createResponse(undefined);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Update integration analysis with cross-platform intelligence
   */
  private async updateIntegrationAnalysis(
    companyId: string,
    data: CompanyIntelligenceData
  ): Promise<ServiceResponse<void>> {
    try {
      if (!data.integrationAnalysis) {
        return this.createResponse(undefined);
      }

      const analysis = data.integrationAnalysis;
      
      // Update integration status
      const integrationUpdates: any = {};
      
      if (analysis.activeIntegrations) {
        integrationUpdates.active_integrations = analysis.activeIntegrations;
      }
      
      if (analysis.integrationHealth) {
        integrationUpdates.integration_health = analysis.integrationHealth;
      }
      
      if (analysis.dataQualityScores) {
        integrationUpdates.data_quality_score = Math.round(
          Object.values(analysis.dataQualityScores).reduce((a: number, b: number) => a + b, 0) / 
          Object.keys(analysis.dataQualityScores).length
        );
      }

      if (analysis.crossPlatformCorrelations) {
        integrationUpdates.cross_platform_correlations = analysis.crossPlatformCorrelations;
      }

      if (analysis.optimizationRecommendations) {
        integrationUpdates.optimization_recommendations = analysis.optimizationRecommendations;
      }

      if (Object.keys(integrationUpdates).length > 0) {
        integrationUpdates.updated_at = new Date().toISOString();
        
        // Update or create company intelligence profile
        const { error } = await upsertOne('company_intelligence_profiles', {
          company_id: companyId,
          ...integrationUpdates
        });

        if (error) {
          logger.error('Failed to update integration analysis', { companyId, error });
          return { data: null, error: `Failed to update integration analysis: ${error.message}` };
        }
      }

      return this.createResponse(undefined);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Update performance metrics and KPI tracking
   */
  private async updatePerformanceMetrics(
    companyId: string,
    data: CompanyIntelligenceData
  ): Promise<ServiceResponse<void>> {
    try {
      if (!data.performanceMetrics) {
        return this.createResponse(undefined);
      }

      const metrics = data.performanceMetrics;
      const performanceUpdates: any = {};
      
      if (metrics.kpiMetrics) {
        performanceUpdates.kpi_metrics = metrics.kpiMetrics;
      }
      
      if (metrics.performanceTrends) {
        performanceUpdates.performance_trends = metrics.performanceTrends;
      }
      
      if (metrics.goalTracking) {
        performanceUpdates.goal_tracking = metrics.goalTracking;
      }
      
      if (metrics.alertTriggers) {
        performanceUpdates.alert_triggers = metrics.alertTriggers;
      }

      if (Object.keys(performanceUpdates).length > 0) {
        performanceUpdates.updated_at = new Date().toISOString();
        
        // Update company intelligence profile with performance metrics
        const { error } = await upsertOne('company_intelligence_profiles', {
          company_id: companyId,
          ...performanceUpdates
        });

        if (error) {
          logger.error('Failed to update performance metrics', { companyId, error });
          return { data: null, error: `Failed to update performance metrics: ${error.message}` };
        }
      }

      return this.createResponse(undefined);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Calculate intelligence score based on data quality and integration coverage
   */
  private async calculateIntelligenceScore(companyId: string): Promise<ServiceResponse<{ score: number }>> {
    try {
      // Call the database function to calculate intelligence score
      const { data, error } = await callEdgeFunction('calculate-company-intelligence', {
        companyId
      });

      if (error) {
        logger.error('Failed to calculate intelligence score', { companyId, error });
        return { data: null, error: `Failed to calculate intelligence score: ${error}` };
      }

      return this.createResponse({ score: data?.score || 0 });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Generate AI insights and recommendations
   */
  private async generateAIInsights(
    companyId: string,
    data: CompanyIntelligenceData
  ): Promise<ServiceResponse<{ insightsCount: number; recommendationsCount: number }>> {
    try {
      // Call AI insights generation edge function
      const { data: insightsData, error } = await callEdgeFunction('generate-company-insights', {
        companyId,
        intelligenceData: data
      });

      if (error) {
        logger.error('Failed to generate AI insights', { companyId, error });
        return { data: null, error: `Failed to generate AI insights: ${error}` };
      }

      return this.createResponse({
        insightsCount: insightsData?.insightsCount || 0,
        recommendationsCount: insightsData?.recommendationsCount || 0
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get company intelligence summary
   */
  async getCompanyIntelligence(companyId: string): Promise<ServiceResponse<any>> {
    return this.executeDbOperation(async () => {
      const { data: company, error: companyError } = await selectOne('companies', companyId);
      if (companyError) {
        return { data: null, error: `Failed to get company: ${companyError.message}` };
      }

      const { data: intelligenceProfile, error: profileError } = await selectOne(
        'company_intelligence_profiles',
        { company_id: companyId }
      );

      const { data: integrationAnalysis, error: analysisError } = await selectOne(
        'company_integration_analysis',
        { company_id: companyId }
      );

      return this.createResponse({
        company,
        intelligenceProfile,
        integrationAnalysis,
        intelligenceScore: company?.intelligence_score || 0,
        intelligenceCompleted: company?.intelligence_completed || false,
        lastUpdate: company?.last_intelligence_update
      });
    });
  }

  /**
   * Get intelligence insights and recommendations
   */
  async getIntelligenceInsights(companyId: string): Promise<ServiceResponse<any>> {
    return this.executeDbOperation(async () => {
      const { data: company, error } = await selectOne('companies', companyId);
      if (error) {
        return { data: null, error: `Failed to get company: ${error.message}` };
      }

      return this.createResponse({
        aiInsights: company?.ai_insights || [],
        performanceMetrics: company?.performance_metrics || {},
        riskAssessment: company?.risk_assessment || {},
        growthIndicators: company?.growth_indicators || {},
        marketPosition: company?.market_position || {},
        competitiveAnalysis: company?.competitive_analysis || {},
        customerIntelligence: company?.customer_intelligence || {},
        operationalMetrics: company?.operational_metrics || {},
        financialHealth: company?.financial_health || {},
        technologyStack: company?.technology_stack || {},
        sustainabilityMetrics: company?.sustainability_metrics || {},
        talentAnalytics: company?.talent_analytics || {},
        innovationIndex: company?.innovation_index || {},
        predictiveAnalytics: company?.predictive_analytics || {}
      });
    });
  }

  /**
   * Get integration analysis and health
   */
  async getIntegrationAnalysis(companyId: string): Promise<ServiceResponse<any>> {
    return this.executeDbOperation(async () => {
      const { data: analysis, error } = await selectOne(
        'company_integration_analysis',
        { company_id: companyId }
      );

      if (error) {
        return { data: null, error: `Failed to get integration analysis: ${error.message}` };
      }

      return this.createResponse({
        analysis,
        integrationHealth: analysis?.integration_health || {},
        dataQualityScores: analysis?.data_quality_score || 0,
        crossPlatformCorrelations: analysis?.cross_platform_correlations || [],
        optimizationRecommendations: analysis?.optimization_recommendations || []
      });
    });
  }
} 
