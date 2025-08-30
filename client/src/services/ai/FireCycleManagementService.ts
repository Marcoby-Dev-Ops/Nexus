import { BaseService, type ServiceResponse } from '@/core/services/BaseService';
import type { OnboardingInsight } from './OnboardingInsightsService';

export interface FireInitiative {
  id: string;
  title: string;
  description: string;
  action: string;
  reasoning: string;
  impact: 'Low' | 'Medium' | 'High' | 'Critical';
  confidence: number;
  category: string;
  estimatedValue?: string;
  timeframe?: string;
  implementationDifficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  status: 'concept' | 'planning' | 'implementation' | 'review' | 'complete' | 'paused' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  progress: number; // 0-100
  actualImpact?: string;
  actualROI?: number;
  dependencies: string[]; // IDs of dependent initiatives
  resources: {
    time: number; // hours
    cost: number; // dollars
    people: number; // team members needed
  };
  tags: string[];
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface FireCycleContext {
  userId: string;
  companyId?: string;
  businessContext: {
    industry: string;
    companySize: string;
    maturity: number;
    priorities: string[];
    constraints: string[];
  };
  currentInitiatives: FireInitiative[];
  availableResources: {
    budget: number;
    teamCapacity: number;
    timeHorizon: number; // days
  };
}

export interface DeduplicationResult {
  isDuplicate: boolean;
  similarityScore: number;
  existingInitiative?: FireInitiative;
  expansionOpportunities: string[];
  recommendedAction: 'skip' | 'expand' | 'combine' | 'proceed';
}

export interface FireCycleRecommendation {
  initiative: FireInitiative;
  priority: number; // 0-100
  reasoning: string;
  expectedROI: number;
  implementationPath: string[];
  riskFactors: string[];
  successMetrics: string[];
}

export class FireCycleManagementService extends BaseService {
  private readonly SIMILARITY_THRESHOLD = 0.7;
  private readonly MAX_INITIATIVES_PER_CYCLE = 5;

  constructor() {
    super();
  }

  /**
   * Smart deduplication with semantic analysis
   */
  async checkForDuplicates(
    newInitiative: Partial<FireInitiative>, 
    context: FireCycleContext
  ): Promise<DeduplicationResult> {
    try {
      // Get existing initiatives
      const existingInitiatives = await this.getExistingInitiatives(context.userId);
      
      let bestMatch: FireInitiative | undefined;
      let highestSimilarity = 0;

      for (const existing of existingInitiatives) {
        const similarity = this.calculateSimilarity(newInitiative, existing);
        if (similarity > highestSimilarity) {
          highestSimilarity = similarity;
          bestMatch = existing;
        }
      }

      const isDuplicate = highestSimilarity > this.SIMILARITY_THRESHOLD;
      
      if (isDuplicate && bestMatch) {
        const expansionOpportunities = this.identifyExpansionOpportunities(newInitiative, bestMatch);
        const recommendedAction = this.determineRecommendedAction(newInitiative, bestMatch, expansionOpportunities);
        
        return {
          isDuplicate: true,
          similarityScore: highestSimilarity,
          existingInitiative: bestMatch,
          expansionOpportunities,
          recommendedAction
        };
      }

      return {
        isDuplicate: false,
        similarityScore: highestSimilarity,
        expansionOpportunities: [],
        recommendedAction: 'proceed'
      };
    } catch (error) {
      this.logger.error('Error checking for duplicates', { error });
      return {
        isDuplicate: false,
        similarityScore: 0,
        expansionOpportunities: [],
        recommendedAction: 'proceed'
      };
    }
  }

  /**
   * Calculate similarity between two initiatives
   */
  private calculateSimilarity(initiative1: Partial<FireInitiative>, initiative2: FireInitiative): number {
    let score = 0;
    let totalWeight = 0;

    // Title similarity (weight: 0.4)
    if (initiative1.title && initiative2.title) {
      const titleSimilarity = this.calculateTextSimilarity(initiative1.title, initiative2.title);
      score += titleSimilarity * 0.4;
      totalWeight += 0.4;
    }

    // Category similarity (weight: 0.2)
    if (initiative1.category && initiative2.category) {
      const categorySimilarity = initiative1.category.toLowerCase() === initiative2.category.toLowerCase() ? 1 : 0;
      score += categorySimilarity * 0.2;
      totalWeight += 0.2;
    }

    // Impact similarity (weight: 0.15)
    if (initiative1.impact && initiative2.impact) {
      const impactSimilarity = initiative1.impact === initiative2.impact ? 1 : 0.5;
      score += impactSimilarity * 0.15;
      totalWeight += 0.15;
    }

    // Description similarity (weight: 0.25)
    if (initiative1.description && initiative2.description) {
      const descSimilarity = this.calculateTextSimilarity(initiative1.description, initiative2.description);
      score += descSimilarity * 0.25;
      totalWeight += 0.25;
    }

    return totalWeight > 0 ? score / totalWeight : 0;
  }

  /**
   * Calculate text similarity using simple algorithms
   * In production, this would use embeddings or more sophisticated NLP
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Identify opportunities to expand existing initiatives
   */
  private identifyExpansionOpportunities(
    newInitiative: Partial<FireInitiative>, 
    existing: FireInitiative
  ): string[] {
    const opportunities: string[] = [];

    // Check for complementary aspects
    if (newInitiative.category && newInitiative.category !== existing.category) {
      opportunities.push(`Combine with ${existing.category} focus to create comprehensive ${newInitiative.category} strategy`);
    }

    if (newInitiative.estimatedValue && !existing.estimatedValue) {
      opportunities.push(`Add value estimation: ${newInitiative.estimatedValue}`);
    }

    if (newInitiative.timeframe && newInitiative.timeframe !== existing.timeframe) {
      opportunities.push(`Update timeline to ${newInitiative.timeframe} for faster implementation`);
    }

    if (newInitiative.implementationDifficulty && newInitiative.implementationDifficulty !== existing.implementationDifficulty) {
      opportunities.push(`Adjust complexity level to ${newInitiative.implementationDifficulty}`);
    }

    return opportunities;
  }

  /**
   * Determine the best action for handling similar initiatives
   */
  private determineRecommendedAction(
    newInitiative: Partial<FireInitiative>,
    existing: FireInitiative,
    expansionOpportunities: string[]
  ): 'skip' | 'expand' | 'combine' | 'proceed' {
    // If existing initiative is complete, allow new one
    if (existing.status === 'complete') {
      return 'proceed';
    }

    // If expansion opportunities exist, suggest expansion
    if (expansionOpportunities.length > 0) {
      return 'expand';
    }

    // If existing is in early stages, suggest combination
    if (existing.status === 'concept' || existing.status === 'planning') {
      return 'combine';
    }

    // Otherwise, skip to avoid duplication
    return 'skip';
  }

  /**
   * Get intelligent recommendations for FIRE initiatives
   */
  async getIntelligentRecommendations(context: FireCycleContext): Promise<FireCycleRecommendation[]> {
    try {
      const allInitiatives = await this.getExistingInitiatives(context.userId);
      const activeInitiatives = allInitiatives.filter(i => 
        ['concept', 'planning', 'implementation'].includes(i.status)
      );

      // Calculate priority scores
      const recommendations: FireCycleRecommendation[] = activeInitiatives.map(initiative => {
        const priority = this.calculatePriorityScore(initiative, context);
        const expectedROI = this.calculateExpectedROI(initiative, context);
        const implementationPath = this.generateImplementationPath(initiative, context);
        const riskFactors = this.identifyRiskFactors(initiative, context);
        const successMetrics = this.defineSuccessMetrics(initiative);

        return {
          initiative,
          priority,
          reasoning: this.generatePriorityReasoning(initiative, priority, context),
          expectedROI,
          implementationPath,
          riskFactors,
          successMetrics
        };
      });

      // Sort by priority and return top recommendations
      return recommendations
        .sort((a, b) => b.priority - a.priority)
        .slice(0, this.MAX_INITIATIVES_PER_CYCLE);
    } catch (error) {
      this.logger.error('Error getting intelligent recommendations', { error });
      return [];
    }
  }

  /**
   * Calculate priority score for an initiative
   */
  private calculatePriorityScore(initiative: FireInitiative, context: FireCycleContext): number {
    let score = 0;

    // Impact score (0-40 points)
    const impactScores = { Low: 10, Medium: 20, High: 30, Critical: 40 };
    score += impactScores[initiative.impact] || 20;

    // Confidence score (0-20 points)
    score += (initiative.confidence / 100) * 20;

    // Resource availability (0-20 points)
    const resourceScore = this.calculateResourceAvailability(initiative, context);
    score += resourceScore * 20;

    // Business alignment (0-20 points)
    const alignmentScore = this.calculateBusinessAlignment(initiative, context);
    score += alignmentScore * 20;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate resource availability score
   */
  private calculateResourceAvailability(initiative: FireInitiative, context: FireCycleContext): number {
    const { availableResources } = context;
    
    // Check if we have enough budget
    const budgetScore = availableResources.budget >= initiative.resources.cost ? 1 : 0.3;
    
    // Check if we have enough team capacity
    const capacityScore = availableResources.teamCapacity >= initiative.resources.people ? 1 : 0.5;
    
    // Check if timeline fits
    const timelineScore = availableResources.timeHorizon >= this.parseTimeframe(initiative.timeframe) ? 1 : 0.7;
    
    return (budgetScore + capacityScore + timelineScore) / 3;
  }

  /**
   * Calculate business alignment score
   */
  private calculateBusinessAlignment(initiative: FireInitiative, context: FireCycleContext): number {
    const { businessContext } = context;
    let score = 0.5; // Base score

    // Check if initiative aligns with stated priorities
    const priorityAlignment = businessContext.priorities.some(priority =>
      initiative.title.toLowerCase().includes(priority.toLowerCase()) ||
      initiative.description.toLowerCase().includes(priority.toLowerCase())
    );
    if (priorityAlignment) score += 0.3;

    // Check if initiative fits company size
    const sizeAlignment = this.checkSizeAlignment(initiative, businessContext.companySize);
    if (sizeAlignment) score += 0.2;

    return Math.min(1, score);
  }

  /**
   * Parse timeframe string to days
   */
  private parseTimeframe(timeframe?: string): number {
    if (!timeframe) return 30;
    
    const match = timeframe.match(/(\d+)-(\d+)\s*(day|week|month)s?/i);
    if (match) {
      const [, min, max, unit] = match;
      const avg = (parseInt(min) + parseInt(max)) / 2;
      
      switch (unit.toLowerCase()) {
        case 'day': return avg;
        case 'week': return avg * 7;
        case 'month': return avg * 30;
        default: return avg * 7;
      }
    }
    
    return 30; // Default to 30 days
  }

  /**
   * Check if initiative aligns with company size
   */
  private checkSizeAlignment(initiative: FireInitiative, companySize: string): boolean {
    const size = companySize.toLowerCase();
    
    if (size.includes('startup') || size.includes('small')) {
      return initiative.implementationDifficulty === 'Beginner' || initiative.implementationDifficulty === 'Intermediate';
    }
    
    if (size.includes('medium')) {
      return initiative.implementationDifficulty === 'Intermediate';
    }
    
    if (size.includes('large') || size.includes('enterprise')) {
      return true; // Large companies can handle any complexity
    }
    
    return true; // Default to true
  }

  /**
   * Calculate expected ROI
   */
  private calculateExpectedROI(initiative: FireInitiative, context: FireCycleContext): number {
    // This is a simplified calculation - in production, this would be more sophisticated
    const impactMultiplier = { Low: 1.1, Medium: 1.25, High: 1.5, Critical: 2.0 };
    const confidenceMultiplier = initiative.confidence / 100;
    const cost = initiative.resources.cost || 1000;
    
    const baseROI = (impactMultiplier[initiative.impact] - 1) * cost;
    return baseROI * confidenceMultiplier;
  }

  /**
   * Generate implementation path
   */
  private generateImplementationPath(initiative: FireInitiative, context: FireCycleContext): string[] {
    const path = [];
    
    switch (initiative.implementationDifficulty) {
      case 'Beginner':
        path.push('1. Research best practices', '2. Create simple implementation plan', '3. Start with pilot program', '4. Scale based on results');
        break;
      case 'Intermediate':
        path.push('1. Detailed planning and resource allocation', '2. Team training and preparation', '3. Phased implementation', '4. Regular progress reviews', '5. Optimization and scaling');
        break;
      case 'Advanced':
        path.push('1. Comprehensive strategy development', '2. Stakeholder alignment and buy-in', '3. Detailed project planning', '4. Implementation with change management', '5. Continuous monitoring and optimization', '6. Knowledge transfer and documentation');
        break;
    }
    
    return path;
  }

  /**
   * Identify risk factors
   */
  private identifyRiskFactors(initiative: FireInitiative, context: FireCycleContext): string[] {
    const risks: string[] = [];
    
    if (initiative.implementationDifficulty === 'Advanced' && context.businessContext.companySize.includes('small')) {
      risks.push('Complex implementation may exceed team capacity');
    }
    
    if (initiative.resources.cost > context.availableResources.budget * 0.3) {
      risks.push('High cost relative to available budget');
    }
    
    if (initiative.dependencies.length > 0) {
      risks.push('Dependencies on other initiatives may cause delays');
    }
    
    if (initiative.confidence < 70) {
      risks.push('Low confidence score indicates uncertainty in outcomes');
    }
    
    return risks;
  }

  /**
   * Define success metrics
   */
  private defineSuccessMetrics(initiative: FireInitiative): string[] {
    const metrics: string[] = [];
    
    // Add category-specific metrics
    switch (initiative.category.toLowerCase()) {
      case 'revenue':
        metrics.push('Revenue growth percentage', 'Customer acquisition cost reduction', 'Sales cycle length improvement');
        break;
      case 'efficiency':
        metrics.push('Time savings per process', 'Cost reduction per unit', 'Productivity improvement percentage');
        break;
      case 'customer':
        metrics.push('Customer satisfaction score', 'Customer retention rate', 'Net promoter score');
        break;
      default:
        metrics.push('Implementation completion rate', 'Adoption rate', 'Business impact measurement');
    }
    
    return metrics;
  }

  /**
   * Generate priority reasoning
   */
  private generatePriorityReasoning(
    initiative: FireInitiative, 
    priority: number, 
    context: FireCycleContext
  ): string {
    const reasons: string[] = [];
    
    if (priority > 80) {
      reasons.push('High priority due to critical business impact');
    } else if (priority > 60) {
      reasons.push('Good alignment with business priorities');
    } else {
      reasons.push('Moderate priority - consider resource constraints');
    }
    
    if (initiative.impact === 'Critical') {
      reasons.push('Addresses critical business need');
    }
    
    if (initiative.confidence > 85) {
      reasons.push('High confidence in successful implementation');
    }
    
    return reasons.join('. ');
  }

  /**
   * Get existing initiatives from database
   */
  private async getExistingInitiatives(userId: string): Promise<FireInitiative[]> {
    try {
      const { data: thoughts } = await this.supabase
        .from('thoughts')
        .select('*')
        .eq('category', 'fire_initiative')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!thoughts) return [];

      return thoughts.map((thought: any) => this.transformThoughtToInitiative(thought));
    } catch (error) {
      this.logger.error('Error getting existing initiatives', { error });
      return [];
    }
  }

  /**
   * Transform database thought to FireInitiative
   */
  private transformThoughtToInitiative(thought: any): FireInitiative {
    const metadata = thought.metadata || {};
    
    return {
      id: thought.id,
      title: thought.title || 'Untitled Initiative',
      description: thought.content || '',
      action: metadata.action || 'Review and implement',
      reasoning: metadata.reasoning || 'Based on business analysis',
      impact: metadata.impact_level || 'Medium',
      confidence: metadata.confidence_score || 75,
      category: metadata.category || 'Business Intelligence',
      estimatedValue: metadata.estimated_value,
      timeframe: metadata.timeframe || '30-90 days',
      implementationDifficulty: metadata.implementation_difficulty || 'Beginner',
      status: metadata.status || 'concept',
      priority: metadata.priority || 'medium',
      progress: metadata.progress || 0,
      actualImpact: metadata.actual_impact,
      actualROI: metadata.actual_roi,
      dependencies: metadata.dependencies || [],
      resources: metadata.resources || { time: 40, cost: 1000, people: 1 },
      tags: thought.tags || [],
      metadata: metadata,
      createdAt: thought.created_at,
      updatedAt: thought.updated_at,
      completedAt: metadata.completed_at
    };
  }
}

// Export singleton instance
export const fireCycleManagementService = new FireCycleManagementService();
