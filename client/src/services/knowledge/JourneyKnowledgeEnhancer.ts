/**
 * Journey Knowledge Enhancer
 * 
 * Leverages existing CompanyKnowledgeService and Unified Brain to generate
 * context notes and enhance knowledge from journey results
 */

import { BaseService } from '../shared/BaseService';
import { logger } from '@/shared/utils/logger';
import { companyKnowledgeService } from '../business/CompanyKnowledgeService';
import { nexusUnifiedBrain } from '../ai/nexusUnifiedBrain';
import { journeyAnalyticsService } from '../analytics/JourneyAnalyticsService';
import type { UserJourneyProgress, JourneyResponse } from '../playbook/JourneyTypes';
import type { CompanyKnowledgeData } from '../business/CompanyKnowledgeService';

export interface JourneyContextNote {
  id: string;
  companyId: string;
  journeyId: string;
  stepId: string;
  noteType: 'insight' | 'pattern' | 'recommendation' | 'learning';
  title: string;
  content: string;
  confidence: number;
  metadata: {
    journeyTemplate: string;
    stepType: string;
    userResponse: Record<string, any>;
    businessContext: Record<string, any>;
    brainAnalysis?: any;
  };
  created_at: string;
}

export interface KnowledgeEnhancement {
  companyId: string;
  journeyId: string;
  contextNotes: JourneyContextNote[];
  knowledgeUpdates: Partial<CompanyKnowledgeData>;
  brainInsights: any;
  recommendations: string[];
}

export class JourneyKnowledgeEnhancer extends BaseService {
  constructor() {
    super('JourneyKnowledgeEnhancer');
  }

  /**
   * Generate context notes and knowledge enhancements from journey completion
   */
  async enhanceJourneyKnowledge(
    userId: string,
    organizationId: string,
    journeyId: string,
    journeyResponses: JourneyResponse[]
  ): Promise<ServiceResponse<KnowledgeEnhancement>> {
    return this.executeDbOperation(async () => {
      logger.info('Enhancing journey knowledge with context notes', { journeyId });

      // Get existing company knowledge
      const existingKnowledge = await companyKnowledgeService.getCompanyKnowledge(organizationId);
      
      // Get journey analytics for patterns
      const analyticsResponse = await journeyAnalyticsService.generateUserAnalytics(userId, organizationId);
      const analytics = analyticsResponse.success ? analyticsResponse.data : null;

      // Generate context notes from journey responses
      const contextNotes = await this.generateContextNotes(
        organizationId,
        journeyId,
        journeyResponses,
        existingKnowledge,
        analytics
      );

      // Generate knowledge updates
      const knowledgeUpdates = await this.generateKnowledgeUpdates(
        journeyResponses,
        existingKnowledge,
        contextNotes
      );

      // Get Unified Brain insights
      const brainInsights = await this.getBrainInsights(
        journeyResponses,
        existingKnowledge,
        analytics
      );

      // Generate recommendations
      const recommendations = await this.generateRecommendations(
        contextNotes,
        brainInsights,
        analytics
      );

      const enhancement: KnowledgeEnhancement = {
        companyId: organizationId,
        journeyId,
        contextNotes,
        knowledgeUpdates,
        brainInsights,
        recommendations
      };

      // Save enhanced knowledge back to company knowledge service
      if (knowledgeUpdates && Object.keys(knowledgeUpdates).length > 0) {
        const updatedKnowledge = {
          ...existingKnowledge,
          ...knowledgeUpdates
        } as CompanyKnowledgeData;
        
        await companyKnowledgeService.saveCompanyKnowledge(organizationId, updatedKnowledge);
      }

      return this.createResponse(enhancement);
    }, 'enhanceJourneyKnowledge');
  }

  /**
   * Generate context notes from journey responses
   */
  private async generateContextNotes(
    companyId: string,
    journeyId: string,
    responses: JourneyResponse[],
    existingKnowledge: CompanyKnowledgeData | null,
    analytics: any
  ): Promise<JourneyContextNote[]> {
    const contextNotes: JourneyContextNote[] = [];

    for (const response of responses) {
      // Analyze response data for insights
      const insights = await this.analyzeResponseForInsights(response, existingKnowledge);
      
      if (insights.length > 0) {
        contextNotes.push(...insights.map(insight => ({
          id: `${journeyId}_${response.step_id}_${Date.now()}`,
          companyId,
          journeyId,
          stepId: response.step_id,
          noteType: insight.type,
          title: insight.title,
          content: insight.content,
          confidence: insight.confidence,
          metadata: {
            journeyTemplate: 'unknown', // Would come from journey template
            stepType: response.step_id,
            userResponse: response.response_data,
            businessContext: existingKnowledge || {},
            brainAnalysis: insight.brainAnalysis
          },
          created_at: new Date().toISOString()
        })));
      }
    }

    // Generate pattern-based notes from analytics
    if (analytics?.journeyPatterns) {
      for (const pattern of analytics.journeyPatterns) {
        contextNotes.push({
          id: `${journeyId}_pattern_${Date.now()}`,
          companyId,
          journeyId,
          stepId: 'pattern_analysis',
          noteType: 'pattern',
          title: `Journey Pattern: ${pattern.pattern}`,
          content: `User shows ${pattern.pattern} behavior with ${Math.round(pattern.confidence * 100)}% confidence. Examples: ${pattern.examples.join(', ')}`,
          confidence: pattern.confidence,
          metadata: {
            journeyTemplate: 'pattern_analysis',
            stepType: 'pattern',
            userResponse: {},
            businessContext: existingKnowledge || {},
            brainAnalysis: null
          },
          created_at: new Date().toISOString()
        });
      }
    }

    return contextNotes;
  }

  /**
   * Analyze individual response for insights
   */
  private async analyzeResponseForInsights(
    response: JourneyResponse,
    existingKnowledge: CompanyKnowledgeData | null
  ): Promise<Array<{
    type: 'insight' | 'pattern' | 'recommendation' | 'learning';
    title: string;
    content: string;
    confidence: number;
    brainAnalysis?: any;
  }>> {
    const insights = [];

    // Analyze business identity responses
    if (response.step_id.includes('identity') || response.step_id.includes('business')) {
      const responseData = response.response_data;
      
      // Check for mission/vision insights
      if (responseData.mission && responseData.mission !== existingKnowledge?.mission) {
        insights.push({
          type: 'insight',
          title: 'Mission Evolution Detected',
          content: `Business mission has evolved from "${existingKnowledge?.mission || 'undefined'}" to "${responseData.mission}". This suggests strategic direction refinement.`,
          confidence: 0.85
        });
      }

      // Check for industry positioning
      if (responseData.industry && responseData.industry !== existingKnowledge?.industry) {
        insights.push({
          type: 'insight',
          title: 'Industry Positioning Update',
          content: `Industry classification updated to "${responseData.industry}". This may impact competitive analysis and market positioning.`,
          confidence: 0.9
        });
      }

      // Check for value proposition clarity
      if (responseData.uniqueValueProposition) {
        const clarityScore = this.assessValuePropositionClarity(responseData.uniqueValueProposition);
        if (clarityScore > 0.8) {
          insights.push({
            type: 'learning',
            title: 'Strong Value Proposition Identified',
            content: `Value proposition "${responseData.uniqueValueProposition}" shows high clarity (${Math.round(clarityScore * 100)}%). This is a strong foundation for marketing and sales.`,
            confidence: clarityScore
          });
        }
      }
    }

    // Analyze quantum building blocks responses
    if (response.step_id.includes('quantum') || response.step_id.includes('block')) {
      const responseData = response.response_data;
      
      // Check for business health insights
      if (responseData.healthScore) {
        const healthScore = parseFloat(responseData.healthScore);
        if (healthScore < 0.6) {
          insights.push({
            type: 'recommendation',
            title: 'Business Health Alert',
            content: `Business health score is ${Math.round(healthScore * 100)}%, indicating areas need attention. Focus on improving weakest building blocks.`,
            confidence: 0.9
          });
        } else if (healthScore > 0.8) {
          insights.push({
            type: 'learning',
            title: 'Strong Business Foundation',
            content: `Business health score of ${Math.round(healthScore * 100)}% indicates solid foundation. Ready for growth and scaling initiatives.`,
            confidence: 0.85
          });
        }
      }

      // Check for block strength patterns
      if (responseData.blockStrengths) {
        const strengths = responseData.blockStrengths;
        const strongestBlock = Object.keys(strengths).reduce((a, b) => 
          strengths[a] > strengths[b] ? a : b
        );
        
        insights.push({
          type: 'pattern',
          title: 'Core Competency Identified',
          content: `${strongestBlock} is the strongest building block (${Math.round(strengths[strongestBlock] * 100)}%). This represents a core competitive advantage.`,
          confidence: 0.8
        });
      }
    }

    return insights;
  }

  /**
   * Generate knowledge updates from journey responses with intelligent identification
   */
  private async generateKnowledgeUpdates(
    responses: JourneyResponse[],
    existingKnowledge: CompanyKnowledgeData | null,
    contextNotes: JourneyContextNote[]
  ): Promise<Partial<CompanyKnowledgeData>> {
    const updates: Partial<CompanyKnowledgeData> = {};

    // 1. Direct Field Mapping - Extract explicit business information
    const directUpdates = this.extractDirectFieldUpdates(responses, existingKnowledge);
    Object.assign(updates, directUpdates);

    // 2. Derived Knowledge - Generate insights from patterns and analysis
    const derivedUpdates = await this.generateDerivedKnowledge(responses, existingKnowledge, contextNotes);
    Object.assign(updates, derivedUpdates);

    // 3. Context-Aware Updates - Use Unified Brain to identify strategic updates
    const strategicUpdates = await this.generateStrategicUpdates(responses, existingKnowledge, contextNotes);
    Object.assign(updates, strategicUpdates);

    // 4. Validation and Prioritization - Ensure updates are meaningful
    const validatedUpdates = this.validateAndPrioritizeUpdates(updates, existingKnowledge);
    
    return validatedUpdates;
  }

  /**
   * Extract direct field updates from journey responses
   */
  private extractDirectFieldUpdates(
    responses: JourneyResponse[],
    existingKnowledge: CompanyKnowledgeData | null
  ): Partial<CompanyKnowledgeData> {
    const updates: Partial<CompanyKnowledgeData> = {};

    for (const response of responses) {
      const responseData = response.response_data;
      
      // Business Identity Fields
      if (responseData.companyName && this.shouldUpdateField('companyName', responseData.companyName, existingKnowledge?.companyName)) {
        updates.companyName = responseData.companyName;
      }
      if (responseData.industry && this.shouldUpdateField('industry', responseData.industry, existingKnowledge?.industry)) {
        updates.industry = responseData.industry;
      }
      if (responseData.mission && this.shouldUpdateField('mission', responseData.mission, existingKnowledge?.mission)) {
        updates.mission = responseData.mission;
      }
      if (responseData.vision && this.shouldUpdateField('vision', responseData.vision, existingKnowledge?.vision)) {
        updates.vision = responseData.vision;
      }
      if (responseData.uniqueValueProposition && this.shouldUpdateField('uniqueValueProposition', responseData.uniqueValueProposition, existingKnowledge?.uniqueValueProposition)) {
        updates.uniqueValueProposition = responseData.uniqueValueProposition;
      }
      if (responseData.targetAudience && this.shouldUpdateField('targetAudience', responseData.targetAudience, existingKnowledge?.targetAudience)) {
        updates.targetAudience = responseData.targetAudience;
      }
      if (responseData.coreValues && this.shouldUpdateField('coreValues', responseData.coreValues, existingKnowledge?.coreValues)) {
        updates.coreValues = responseData.coreValues;
      }
      
      // Business Model Fields
      if (responseData.revenueModel && this.shouldUpdateField('revenueModel', responseData.revenueModel, existingKnowledge?.revenueModel)) {
        updates.revenueModel = responseData.revenueModel;
      }
      if (responseData.pricingStrategy && this.shouldUpdateField('pricingStrategy', responseData.pricingStrategy, existingKnowledge?.pricingStrategy)) {
        updates.pricingStrategy = responseData.pricingStrategy;
      }
      
      // Goals and Objectives
      if (responseData.shortTermGoals && this.shouldUpdateField('shortTermGoals', responseData.shortTermGoals, existingKnowledge?.shortTermGoals)) {
        updates.shortTermGoals = responseData.shortTermGoals;
      }
      if (responseData.longTermGoals && this.shouldUpdateField('longTermGoals', responseData.longTermGoals, existingKnowledge?.longTermGoals)) {
        updates.longTermGoals = responseData.longTermGoals;
      }
      if (responseData.keyMetrics && this.shouldUpdateField('keyMetrics', responseData.keyMetrics, existingKnowledge?.keyMetrics)) {
        updates.keyMetrics = responseData.keyMetrics;
      }
    }

    return updates;
  }

  /**
   * Generate derived knowledge from patterns and analysis
   */
  private async generateDerivedKnowledge(
    responses: JourneyResponse[],
    existingKnowledge: CompanyKnowledgeData | null,
    contextNotes: JourneyContextNote[]
  ): Promise<Partial<CompanyKnowledgeData>> {
    const updates: Partial<CompanyKnowledgeData> = {};

    // Extract insights from context notes
    const insights = contextNotes
      .filter(note => note.noteType === 'insight')
      .map(note => note.content);

    const learnings = contextNotes
      .filter(note => note.noteType === 'learning')
      .map(note => note.content);

    const patterns = contextNotes
      .filter(note => note.noteType === 'pattern')
      .map(note => note.content);

    // Combine insights into challenges/opportunities
    if (insights.length > 0) {
      updates.challenges = insights.join('; ');
    }

    // Extract strengths from patterns and learnings
    const strengths = this.extractStrengthsFromContext(patterns, learnings);
    if (strengths.length > 0) {
      updates.strengths = strengths.join('; ');
    }

    // Generate opportunities from insights and patterns
    const opportunities = this.extractOpportunitiesFromContext(insights, patterns);
    if (opportunities.length > 0) {
      updates.opportunities = opportunities.join('; ');
    }

    // Analyze business health and generate recommendations
    const healthAnalysis = this.analyzeBusinessHealth(responses);
    if (healthAnalysis.healthScore !== null) {
      updates.healthScore = healthAnalysis.healthScore;
    }
    if (healthAnalysis.healthInsights.length > 0) {
      updates.healthInsights = healthAnalysis.healthInsights.join('; ');
    }

    return updates;
  }

  /**
   * Generate strategic updates using Unified Brain analysis
   */
  private async generateStrategicUpdates(
    responses: JourneyResponse[],
    existingKnowledge: CompanyKnowledgeData | null,
    contextNotes: JourneyContextNote[]
  ): Promise<Partial<CompanyKnowledgeData>> {
    const updates: Partial<CompanyKnowledgeData> = {};

    try {
      // Prepare comprehensive data for brain analysis
      const analysisData = {
        responses,
        existingKnowledge,
        contextNotes,
        timestamp: new Date()
      };

      // Get brain insights for strategic updates
      const brainInsights = await nexusUnifiedBrain.processBusinessData([analysisData]);
      
      if (brainInsights?.strategicInsights) {
        // Update strategic positioning
        if (brainInsights.strategicInsights.marketPosition) {
          updates.marketPosition = brainInsights.strategicInsights.marketPosition;
        }
        if (brainInsights.strategicInsights.competitiveAdvantages) {
          updates.competitiveAdvantages = brainInsights.strategicInsights.competitiveAdvantages;
        }
        if (brainInsights.strategicInsights.growthStrategy) {
          updates.growthStrategy = brainInsights.strategicInsights.growthStrategy;
        }
      }

      // Extract business intelligence from brain analysis
      if (brainInsights?.businessIntelligence) {
        const bi = brainInsights.businessIntelligence;
        
        if (bi.riskFactors) {
          updates.riskFactors = bi.riskFactors.join('; ');
        }
        if (bi.growthIndicators) {
          updates.growthIndicators = bi.growthIndicators.join('; ');
        }
        if (bi.performanceMetrics) {
          updates.performanceMetrics = bi.performanceMetrics.join('; ');
        }
      }

    } catch (error) {
      logger.warn('Failed to generate strategic updates:', error);
    }

    return updates;
  }

  /**
   * Validate and prioritize updates to ensure they're meaningful
   */
  private validateAndPrioritizeUpdates(
    updates: Partial<CompanyKnowledgeData>,
    existingKnowledge: CompanyKnowledgeData | null
  ): Partial<CompanyKnowledgeData> {
    const validatedUpdates: Partial<CompanyKnowledgeData> = {};

    for (const [key, value] of Object.entries(updates)) {
      if (this.isValidUpdate(key, value, existingKnowledge?.[key as keyof CompanyKnowledgeData])) {
        validatedUpdates[key as keyof CompanyKnowledgeData] = value;
      }
    }

    return validatedUpdates;
  }

  /**
   * Determine if a field should be updated based on significance and change
   */
  private shouldUpdateField(fieldName: string, newValue: any, existingValue: any): boolean {
    // Skip if no new value
    if (!newValue || (Array.isArray(newValue) && newValue.length === 0)) {
      return false;
    }

    // Always update if no existing value
    if (!existingValue) {
      return true;
    }

    // Check for significant changes
    if (Array.isArray(newValue) && Array.isArray(existingValue)) {
      return JSON.stringify(newValue.sort()) !== JSON.stringify(existingValue.sort());
    }

    if (typeof newValue === 'string' && typeof existingValue === 'string') {
      // Check for meaningful text changes (more than just whitespace or minor edits)
      const normalizedNew = newValue.trim().toLowerCase();
      const normalizedExisting = existingValue.trim().toLowerCase();
      
      // Update if significantly different (more than 20% change)
      const similarity = this.calculateTextSimilarity(normalizedNew, normalizedExisting);
      return similarity < 0.8;
    }

    // For other types, update if different
    return newValue !== existingValue;
  }

  /**
   * Calculate text similarity between two strings
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    if (text1 === text2) return 1;
    if (text1.length === 0 || text2.length === 0) return 0;

    const longer = text1.length > text2.length ? text1 : text2;
    const shorter = text1.length > text2.length ? text2 : text1;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance for text similarity
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Extract strengths from context notes
   */
  private extractStrengthsFromContext(patterns: string[], learnings: string[]): string[] {
    const strengths: string[] = [];

    // Extract from patterns
    patterns.forEach(pattern => {
      if (pattern.toLowerCase().includes('strong') || pattern.toLowerCase().includes('competency')) {
        strengths.push(pattern);
      }
    });

    // Extract from learnings
    learnings.forEach(learning => {
      if (learning.toLowerCase().includes('strong') || learning.toLowerCase().includes('foundation')) {
        strengths.push(learning);
      }
    });

    return strengths;
  }

  /**
   * Extract opportunities from context notes
   */
  private extractOpportunitiesFromContext(insights: string[], patterns: string[]): string[] {
    const opportunities: string[] = [];

    // Extract from insights
    insights.forEach(insight => {
      if (insight.toLowerCase().includes('opportunity') || insight.toLowerCase().includes('potential')) {
        opportunities.push(insight);
      }
    });

    // Extract from patterns
    patterns.forEach(pattern => {
      if (pattern.toLowerCase().includes('growth') || pattern.toLowerCase().includes('scaling')) {
        opportunities.push(pattern);
      }
    });

    return opportunities;
  }

  /**
   * Analyze business health from responses
   */
  private analyzeBusinessHealth(responses: JourneyResponse[]): { healthScore: number | null; healthInsights: string[] } {
    let healthScore: number | null = null;
    const healthInsights: string[] = [];

    for (const response of responses) {
      const responseData = response.response_data;
      
      if (responseData.healthScore) {
        healthScore = parseFloat(responseData.healthScore);
        
        if (healthScore < 0.6) {
          healthInsights.push('Business health requires attention - focus on improving weakest areas');
        } else if (healthScore > 0.8) {
          healthInsights.push('Strong business foundation - ready for growth initiatives');
        } else {
          healthInsights.push('Solid business health - continue building on strengths');
        }
      }
    }

    return { healthScore, healthInsights };
  }

  /**
   * Validate if an update is meaningful
   */
  private isValidUpdate(fieldName: string, newValue: any, existingValue: any): boolean {
    // Skip empty values
    if (!newValue || (typeof newValue === 'string' && newValue.trim() === '')) {
      return false;
    }

    // Skip if identical to existing value
    if (newValue === existingValue) {
      return false;
    }

    // For arrays, check if they're meaningfully different
    if (Array.isArray(newValue) && Array.isArray(existingValue)) {
      return JSON.stringify(newValue.sort()) !== JSON.stringify(existingValue.sort());
    }

    // For strings, check if they're significantly different
    if (typeof newValue === 'string' && typeof existingValue === 'string') {
      const similarity = this.calculateTextSimilarity(newValue.trim().toLowerCase(), existingValue.trim().toLowerCase());
      return similarity < 0.8; // Update if less than 80% similar
    }

    return true;
  }

  /**
   * Get Unified Brain insights
   */
  private async getBrainInsights(
    responses: JourneyResponse[],
    existingKnowledge: CompanyKnowledgeData | null,
    analytics: any
  ): Promise<any> {
    try {
      // Prepare data for brain analysis
      const businessData = {
        journeyResponses: responses,
        existingKnowledge,
        analytics,
        timestamp: new Date()
      };

      // Process with Unified Brain
      const brainContext = await nexusUnifiedBrain.processBusinessData([businessData]);
      
      return brainContext;
    } catch (error) {
      logger.warn('Failed to get brain insights:', error);
      return null;
    }
  }

  /**
   * Generate recommendations from context notes and brain insights
   */
  private async generateRecommendations(
    contextNotes: JourneyContextNote[],
    brainInsights: any,
    analytics: any
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // Extract recommendations from context notes
    const noteRecommendations = contextNotes
      .filter(note => note.noteType === 'recommendation')
      .map(note => note.content);

    recommendations.push(...noteRecommendations);

    // Add brain-powered recommendations
    if (brainInsights?.recommendations) {
      const brainRecommendations = brainInsights.recommendations
        .map((rec: any) => rec.action);
      recommendations.push(...brainRecommendations);
    }

    // Add analytics-based recommendations
    if (analytics?.nextBestJourney) {
      recommendations.push(
        `Consider starting the "${analytics.nextBestJourney.title}" journey next (${Math.round(analytics.nextBestJourney.confidence * 100)}% confidence)`
      );
    }

    return recommendations.slice(0, 5); // Limit to top 5 recommendations
  }

  /**
   * Assess value proposition clarity
   */
  private assessValuePropositionClarity(valueProp: string): number {
    if (!valueProp) return 0;
    
    let score = 0.5; // Base score
    
    // Length assessment
    if (valueProp.length > 20 && valueProp.length < 100) score += 0.2;
    
    // Specificity assessment
    const specificWords = ['because', 'through', 'by', 'using', 'with', 'for'];
    const hasSpecificWords = specificWords.some(word => valueProp.toLowerCase().includes(word));
    if (hasSpecificWords) score += 0.15;
    
    // Benefit focus assessment
    const benefitWords = ['help', 'enable', 'improve', 'increase', 'reduce', 'solve', 'provide'];
    const hasBenefitWords = benefitWords.some(word => valueProp.toLowerCase().includes(word));
    if (hasBenefitWords) score += 0.15;
    
    return Math.min(1, score);
  }
}

// Export singleton instance
export const journeyKnowledgeEnhancer = new JourneyKnowledgeEnhancer();
