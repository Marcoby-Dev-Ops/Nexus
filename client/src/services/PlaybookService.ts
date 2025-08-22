/**
 * Playbook Service
 * Manages business playbook database and provides intelligent matching
 * 
 * Features:
 * - Intelligent playbook matching based on business context
 * - AI-enhanced recommendations
 * - Playbook execution tracking
 * - Performance analytics
 */

import { businessPlaybooks, getBestMatchingPlaybooks, scorePlaybookFit, type BusinessPlaybook } from '../core/config/businessPlaybooks';
import { NexusAIGatewayService } from '../ai/services/NexusAIGatewayService';
import { insightFeedbackService } from './ai/InsightFeedbackService';

export interface PlaybookRecommendation {
  playbook: BusinessPlaybook;
  confidenceScore: number;
  priority: 'high' | 'medium' | 'low';
  reasoning: string;
  estimatedImpact: string;
  contextualFit: {
    relevance: string;
    prerequisites: string[];
    missingRequirements: string[];
    marcobyServices: Array<{
      serviceId: string;
      serviceName: string;
      required: boolean;
      cost: string;
      description: string;
    }>;
  };
  executionPlan: {
    overview: string;
    steps: Array<{
      step: number;
      title: string;
      description: string;
      agentExecutable: boolean;
      validationMethod: 'manual' | 'automated' | 'api_check' | 'document_upload';
      marcobyIntegration?: {
        serviceId: string;
        integrationType: 'direct' | 'recommendation' | 'upsell';
      };
    }>;
    timeline: string;
    successMetrics: Array<{
      metric: string;
      target: string;
      validationMethod: 'manual' | 'automated' | 'api_check' | 'document_upload';
    }>;
  };
}

export interface PlaybookExecution {
  playbookId: string;
  userId: string;
  organizationId: string;
  startDate: Date;
  status: 'not_started' | 'in_progress' | 'completed' | 'paused' | 'failed';
  currentStep: number;
  completedSteps: number[];
  validationResults: Array<{
    step: number;
    metric: string;
    status: 'pending' | 'passed' | 'failed';
    value?: string;
    notes?: string;
    validatedAt?: Date;
  }>;
  marcobyServices: Array<{
    serviceId: string;
    status: 'not_required' | 'recommended' | 'purchased' | 'integrated';
    purchasedAt?: Date;
    cost?: string;
  }>;
  performanceMetrics: {
    timeToComplete?: number;
    costSavings?: number;
    efficiencyGains?: number;
    userSatisfaction?: number;
  };
}

export interface BusinessContext {
  userProfile: {
    firstName: string;
    lastName: string;
    role: string;
    experience: string;
    skills: string[];
    userId?: string;
  };
  companyProfile: {
    name: string;
    industry: string;
    size: string;
    stage: string;
    location: string;
    companyId?: string;
  };
  foundationalKnowledge: {
    priorities: string[];
    challenges: string[];
    goals: string[];
    tools: string[];
  };
  currentCapabilities: {
    existingTools: string[];
    teamSize: number;
    budget: string;
    technicalExpertise: string;
  };
  marcobyServices: Array<{
    serviceId: string;
    status: 'active' | 'inactive' | 'not_subscribed';
    subscriptionDate?: Date;
  }>;
}

export interface AgentExecutionRequest {
  playbookId: string;
  userId: string;
  organizationId: string;
  executionMode: 'full_automation' | 'assisted' | 'manual_guidance';
  permissions: string[];
  marcobyIntegration: boolean;
}

export interface ExecutionValidation {
  step: number;
  metric: string;
  validationMethod: 'manual' | 'automated' | 'api_check' | 'document_upload';
  status: 'pending' | 'passed' | 'failed';
  value?: string;
  notes?: string;
  validatedAt?: Date;
  marcobyServiceId?: string;
}

export interface MarcobyServiceRecommendation {
  serviceId: string;
  serviceName: string;
  category: string;
  required: boolean;
  cost: string;
  description: string;
  integrationType: 'direct' | 'recommendation' | 'upsell';
  prerequisites: string[];
  confidenceScore: number;
  reasoning: string;
}

class PlaybookService {
  private aiGateway: NexusAIGatewayService;
  private executionStore: Map<string, PlaybookExecution> = new Map();

  constructor() {
    this.aiGateway = new NexusAIGatewayService();
  }

  // Core Playbook Management
  getAllPlaybooks(): BusinessPlaybook[] {
    return businessPlaybooks;
  }

  getPlaybooksByCategory(category: string): BusinessPlaybook[] {
    return businessPlaybooks.filter(playbook => playbook.category === category);
  }

  getPlaybooksByDifficulty(difficulty: string): BusinessPlaybook[] {
    return businessPlaybooks.filter(playbook => playbook.difficulty === difficulty);
  }

  // AI-Indexed Retrieval for Agents
  async getAgentRecommendations(context: BusinessContext, agentType?: string): Promise<PlaybookRecommendation[]> {
    // Convert BusinessContext to the format expected by helper functions
    const legacyContext = {
      industry: context.companyProfile.industry,
      companySize: context.companyProfile.size,
      role: context.userProfile.role,
      priorities: context.foundationalKnowledge.priorities,
      challenges: context.foundationalKnowledge.challenges,
      growthStage: context.companyProfile.stage,
      tools: context.currentCapabilities.existingTools
    };
    
    const matchingPlaybooks = getBestMatchingPlaybooks(legacyContext);
    
    const recommendations: PlaybookRecommendation[] = [];
    
    for (const playbook of matchingPlaybooks) {
      const score = scorePlaybookFit(playbook, context);
      
      // Filter by agent type if specified
      if (agentType && playbook.agentExecution.agentType !== agentType) {
        continue;
      }
      
      // Only include executable playbooks for agents
      if (!playbook.agentExecution.executable) {
        continue;
      }
      
      const reasoning = await this.generatePlaybookReasoning(playbook, context, score);
      const priority = this.determinePriority(score);
      const estimatedImpact = this.calculateEstimatedImpact(playbook, context);
      const contextualFit = this.analyzeContextualFit(playbook, context);
      
      recommendations.push({
        playbook,
        confidenceScore: score,
        priority,
        reasoning,
        estimatedImpact,
        contextualFit,
        executionPlan: await this.getEnhancedExecutionPlan(playbook.id, context)
      });
    }
    
    // Sort by confidence score and return top recommendations
    return recommendations
      .sort((a, b) => b.confidenceScore - a.confidenceScore)
      .slice(0, 10);
  }

  // Intelligent Recommendations (Enhanced)
  async getIntelligentRecommendations(context: BusinessContext): Promise<PlaybookRecommendation[]> {
    console.log('🔍 PlaybookService: Starting getIntelligentRecommendations');
    console.log('🔍 PlaybookService: Input context:', context);
    
    // Get excluded insights to avoid recommending already implemented or low-value insights
    let excludedInsights: string[] = [];
    try {
      const excludedResult = await insightFeedbackService.getExcludedInsights(
        context.userProfile.userId || 'unknown',
        context.companyProfile.companyId
      );
      if (excludedResult.success && excludedResult.data) {
        excludedInsights = excludedResult.data;
        console.log('🔍 PlaybookService: Excluded insights count:', excludedInsights.length);
      }
    } catch (error) {
      console.warn('🔍 PlaybookService: Could not fetch excluded insights:', error);
    }
    
    // Convert BusinessContext to the format expected by helper functions
    const legacyContext = {
      industry: context.companyProfile.industry,
      companySize: context.companyProfile.size,
      role: context.userProfile.role,
      priorities: context.foundationalKnowledge.priorities,
      challenges: context.foundationalKnowledge.challenges,
      growthStage: context.companyProfile.stage,
      tools: context.currentCapabilities.existingTools
    };
    
    console.log('🔍 PlaybookService: Legacy context for matching:', legacyContext);
    
    const matchingPlaybooks = getBestMatchingPlaybooks(legacyContext);
    console.log('🔍 PlaybookService: Matching playbooks found:', matchingPlaybooks.length);
    console.log('🔍 PlaybookService: Matching playbook IDs:', matchingPlaybooks.map(p => p.id));
    
    const recommendations: PlaybookRecommendation[] = [];
    
    for (const playbook of matchingPlaybooks) {
      // Check if this playbook should be excluded based on user feedback
      const shouldExclude = this.shouldExcludePlaybook(playbook, excludedInsights);
      if (shouldExclude) {
        console.log(`🔍 PlaybookService: Excluding playbook ${playbook.id} based on user feedback`);
        continue;
      }
      
      const score = scorePlaybookFit(playbook, context); // Score is already 0-100 scale
      console.log(`🔍 PlaybookService: Score for ${playbook.id}:`, score);
      
      const reasoning = await this.generatePlaybookReasoning(playbook, context, score);
      const priority = this.determinePriority(score);
      const estimatedImpact = this.calculateEstimatedImpact(playbook, context);
      const contextualFit = this.analyzeContextualFit(playbook, context);
      
      recommendations.push({
        playbook,
        confidenceScore: score,
        priority,
        reasoning,
        estimatedImpact,
        contextualFit,
        executionPlan: await this.getEnhancedExecutionPlan(playbook.id, context)
      });
    }
    
    console.log('🔍 PlaybookService: Final recommendations count:', recommendations.length);
    
    return recommendations
      .sort((a, b) => b.confidenceScore - a.confidenceScore)
      .slice(0, 8);
  }

  /**
   * Check if a playbook should be excluded based on user feedback
   */
  private shouldExcludePlaybook(playbook: BusinessPlaybook, excludedInsights: string[]): boolean {
    if (excludedInsights.length === 0) {
      return false;
    }

    // Check if any of the excluded insights are similar to this playbook
    const playbookText = `${playbook.title} ${playbook.description} ${playbook.category}`.toLowerCase();
    
    return excludedInsights.some(excludedId => {
      // For now, we'll do a simple text similarity check
      // In a more sophisticated implementation, you could use embeddings
      const excludedText = excludedId.toLowerCase();
      return playbookText.includes(excludedText) || excludedText.includes(playbookText);
    });
  }

  // AI Agent Execution Management
  async initiateAgentExecution(request: AgentExecutionRequest): Promise<PlaybookExecution> {
    const playbook = businessPlaybooks.find(p => p.id === request.playbookId);
    if (!playbook) {
      throw new Error(`Playbook ${request.playbookId} not found`);
    }

    const execution: PlaybookExecution = {
      playbookId: request.playbookId,
      userId: request.userId,
      organizationId: request.organizationId,
      startDate: new Date(),
      status: 'not_started',
      currentStep: 1,
      completedSteps: [],
      validationResults: [],
      marcobyServices: playbook.marcobyServices.map(service => ({
        serviceId: service.serviceId,
        status: 'not_required'
      })),
      performanceMetrics: {}
    };

    this.executionStore.set(`${request.userId}-${request.playbookId}`, execution);
    return execution;
  }

  async executePlaybookStep(executionId: string, step: number): Promise<ExecutionValidation[]> {
    const execution = this.executionStore.get(executionId);
    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }

    const playbook = businessPlaybooks.find(p => p.id === execution.playbookId);
    if (!playbook) {
      throw new Error(`Playbook ${execution.playbookId} not found`);
    }

    const stepData = playbook.executionPlan.steps.find(s => s.step === step);
    if (!stepData) {
      throw new Error(`Step ${step} not found in playbook ${execution.playbookId}`);
    }

    // Execute the step based on validation method
    const validations: ExecutionValidation[] = [];
    
    for (const metric of playbook.missionObjectives.validationMetrics) {
      const validation: ExecutionValidation = {
        step,
        metric: metric.metric,
        validationMethod: metric.validationMethod,
        status: 'pending',
        validatedAt: new Date()
      };

      // Simulate validation based on method
      switch (metric.validationMethod) {
        case 'automated':
          validation.status = 'passed';
          validation.value = 'Automated validation completed';
          break;
        case 'api_check':
          validation.status = 'passed';
          validation.value = 'API check successful';
          break;
        case 'document_upload':
          validation.status = 'pending';
          validation.notes = 'Awaiting document upload';
          break;
        case 'manual':
          validation.status = 'pending';
          validation.notes = 'Requires manual verification';
          break;
      }

      validations.push(validation);
    }

    // Update execution status
    execution.currentStep = step + 1;
    execution.completedSteps.push(step);
    execution.validationResults.push(...validations);
    
    if (execution.currentStep > playbook.executionPlan.steps.length) {
      execution.status = 'completed';
    } else {
      execution.status = 'in_progress';
    }

    return validations;
  }

  // Marcoby Service Integration
  async getMarcobyRecommendations(context: BusinessContext, playbookId?: string): Promise<MarcobyServiceRecommendation[]> {
    const recommendations: MarcobyServiceRecommendation[] = [];
    
    const playbooks = playbookId 
      ? [businessPlaybooks.find(p => p.id === playbookId)].filter(Boolean) as BusinessPlaybook[]
      : businessPlaybooks;

    for (const playbook of playbooks) {
      for (const service of playbook.marcobyServices) {
        const confidenceScore = this.calculateMarcobyServiceFit(service, context);
        const reasoning = await this.generateMarcobyReasoning(service, context, playbook);
        
        recommendations.push({
          ...service,
          confidenceScore,
          reasoning
        });
      }
    }

    return recommendations
      .sort((a, b) => b.confidenceScore - a.confidenceScore)
      .slice(0, 10);
  }

  async validatePlaybookPrerequisites(playbookId: string, context: BusinessContext): Promise<{
    met: string[];
    missing: string[];
    marcobyServices: MarcobyServiceRecommendation[];
  }> {
    const playbook = businessPlaybooks.find(p => p.id === playbookId);
    if (!playbook) {
      throw new Error(`Playbook ${playbookId} not found`);
    }

    const met: string[] = [];
    const missing: string[] = [];
    const marcobyServices: MarcobyServiceRecommendation[] = [];

    // Check playbook prerequisites
    for (const prerequisite of playbook.aiIndex.prerequisites) {
      if (this.checkPrerequisiteMet(prerequisite, context)) {
        met.push(prerequisite);
      } else {
        missing.push(prerequisite);
      }
    }

    // Check Marcoby service prerequisites
    for (const service of playbook.marcobyServices) {
      const confidenceScore = this.calculateMarcobyServiceFit(service, context);
      const reasoning = await this.generateMarcobyReasoning(service, context, playbook);
      
      marcobyServices.push({
        ...service,
        confidenceScore,
        reasoning
      });
    }

    return { met, missing, marcobyServices };
  }

  // Enhanced Execution Plan with AI
  async getEnhancedExecutionPlan(playbookId: string, context: BusinessContext): Promise<any> {
    const playbook = businessPlaybooks.find(p => p.id === playbookId);
    if (!playbook) {
      throw new Error(`Playbook ${playbookId} not found`);
    }

    const enhancedPlan = await this.enhanceExecutionPlan(playbook, context);
    const contextualTips = this.generateContextualTips(playbook, context);
    const customTools = this.suggestCustomTools(playbook, context);

    return {
      ...enhancedPlan,
      contextualTips,
      customTools,
      marcobyIntegrations: playbook.marcobyServices.map(service => ({
        serviceId: service.serviceId,
        serviceName: service.serviceName,
        integrationType: service.integrationType,
        required: service.required,
        cost: service.cost
      }))
    };
  }

  // Execution Tracking and Analytics
  trackExecution(execution: PlaybookExecution): void {
    this.executionStore.set(`${execution.userId}-${execution.playbookId}`, execution);
  }

  getExecutionAnalytics(playbookId: string): any {
    const executions = Array.from(this.executionStore.values())
      .filter(e => e.playbookId === playbookId);

    if (executions.length === 0) {
      return { totalExecutions: 0, successRate: 0, averageTime: 0 };
    }

    const completed = executions.filter(e => e.status === 'completed');
    const successRate = (completed.length / executions.length) * 100;
    
    const totalTime = executions.reduce((sum, e) => {
      if (e.performanceMetrics.timeToComplete) {
        return sum + e.performanceMetrics.timeToComplete;
      }
      return sum;
    }, 0);
    
    const averageTime = totalTime / executions.length;

    return {
      totalExecutions: executions.length,
      successRate,
      averageTime,
      statusDistribution: {
        completed: completed.length,
        inProgress: executions.filter(e => e.status === 'in_progress').length,
        failed: executions.filter(e => e.status === 'failed').length
      }
    };
  }

  // Search and Discovery
  searchPlaybooks(query: string): BusinessPlaybook[] {
    const searchTerms = query.toLowerCase().split(' ');
    
    return businessPlaybooks.filter(playbook => {
      const searchableText = [
        playbook.title,
        playbook.description,
        ...playbook.tags,
        ...playbook.aiIndex.keywords,
        ...playbook.aiIndex.semanticTags
      ].join(' ').toLowerCase();
      
      return searchTerms.every(term => searchableText.includes(term));
    });
  }

  getPlaybookCategories(): Array<{ category: string; count: number }> {
    const categories = businessPlaybooks.reduce((acc, playbook) => {
      acc[playbook.category] = (acc[playbook.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(categories).map(([category, count]) => ({ category, count }));
  }

  getDifficultyDistribution(): Array<{ difficulty: string; count: number }> {
    const difficulties = businessPlaybooks.reduce((acc, playbook) => {
      acc[playbook.difficulty] = (acc[playbook.difficulty] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(difficulties).map(([difficulty, count]) => ({ difficulty, count }));
  }

  // Private Helper Methods
  private async generatePlaybookReasoning(playbook: BusinessPlaybook, context: BusinessContext, score: number): Promise<string> {
    const prompt = `Analyze why this playbook "${playbook.title}" is recommended for this business context:
    
Business Context:
- Company: ${context.companyProfile.name} (${context.companyProfile.industry})
- Size: ${context.companyProfile.size}, Stage: ${context.companyProfile.stage}
- User Role: ${context.userProfile.role}
- Priorities: ${context.foundationalKnowledge.priorities.join(', ')}
- Challenges: ${context.foundationalKnowledge.challenges.join(', ')}

Playbook Details:
- Category: ${playbook.category}
- Difficulty: ${playbook.difficulty}
- Estimated Value: ${playbook.estimatedValue}
- Mission: ${playbook.missionObjectives.primary}

Confidence Score: ${score}

Provide a concise, compelling explanation (2-3 sentences) for why this playbook is a good fit for this business.`;

    try {
      const response = await this.aiGateway.chat({
        messages: [{ role: 'user', content: prompt }],
        tenantId: 'default'
      });
      return response.success && response.data ? response.data.message : `This ${playbook.category} playbook aligns with your ${context.foundationalKnowledge.priorities[0]} priority and addresses your ${context.foundationalKnowledge.challenges[0]} challenge.`;
    } catch (error) {
      return `This ${playbook.category} playbook aligns with your ${context.foundationalKnowledge.priorities[0]} priority and addresses your ${context.foundationalKnowledge.challenges[0]} challenge.`;
    }
  }

  private async generateMarcobyReasoning(service: any, context: BusinessContext, playbook: BusinessPlaybook): Promise<string> {
    const prompt = `Explain why this Marcoby service "${service.serviceName}" is recommended for this business context:
    
Business Context:
- Company: ${context.companyProfile.name} (${context.companyProfile.industry})
- Size: ${context.companyProfile.size}
- Budget: ${context.currentCapabilities.budget}

Service Details:
- Category: ${service.category}
- Cost: ${service.cost}
- Required: ${service.required}
- Description: ${service.description}

Playbook: ${playbook.title}

Provide a brief explanation (1-2 sentences) for why this service would benefit this business.`;

    try {
      const response = await this.aiGateway.chat({
        messages: [{ role: 'user', content: prompt }],
        tenantId: 'default'
      });
      return response.success && response.data ? response.data.message : `This ${service.category} service will help you complete the ${playbook.title} playbook more efficiently.`;
    } catch (error) {
      return `This ${service.category} service will help you complete the ${playbook.title} playbook more efficiently.`;
    }
  }

  private determinePriority(score: number): 'high' | 'medium' | 'low' {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  }

  private calculateEstimatedImpact(playbook: BusinessPlaybook, context: BusinessContext): string {
    // Simple impact calculation based on playbook value and business context
    const baseValue = parseFloat(playbook.estimatedValue.replace(/[^0-9]/g, ''));
    const multiplier = context.companyProfile.size === 'small' ? 0.5 : 
                      context.companyProfile.size === 'medium' ? 1.0 : 1.5;
    
    return `$${Math.round(baseValue * multiplier).toLocaleString()}+/year`;
  }

  private analyzeContextualFit(playbook: BusinessPlaybook, context: BusinessContext): any {
    const relevance = this.calculateRelevance(playbook, context);
    const prerequisites = this.identifyPrerequisites(playbook, context);
    const missingRequirements = this.identifyMissingRequirements(playbook, context);
    const marcobyServices = playbook.marcobyServices.map(service => ({
      serviceId: service.serviceId,
      serviceName: service.serviceName,
      required: service.required,
      cost: service.cost,
      description: service.description
    }));

    return {
      relevance,
      prerequisites,
      missingRequirements,
      marcobyServices
    };
  }

  private calculateRelevance(playbook: BusinessPlaybook, context: BusinessContext): string {
    const priorityMatch = context.foundationalKnowledge.priorities.some(priority =>
      playbook.contextualFactors.priorityMatch.includes(priority.toLowerCase())
    );
    
    const challengeMatch = context.foundationalKnowledge.challenges.some(challenge =>
      playbook.contextualFactors.challengeAddress.includes(challenge.toLowerCase())
    );

    if (priorityMatch && challengeMatch) return 'High relevance - addresses key priorities and challenges';
    if (priorityMatch || challengeMatch) return 'Medium relevance - addresses important business needs';
    return 'Lower relevance - may not align with current priorities';
  }

  private identifyPrerequisites(playbook: BusinessPlaybook, context: BusinessContext): string[] {
    return playbook.aiIndex.prerequisites.filter(prerequisite =>
      this.checkPrerequisiteMet(prerequisite, context)
    );
  }

  private identifyMissingRequirements(playbook: BusinessPlaybook, context: BusinessContext): string[] {
    return playbook.aiIndex.prerequisites.filter(prerequisite =>
      !this.checkPrerequisiteMet(prerequisite, context)
    );
  }

  private checkPrerequisiteMet(prerequisite: string, context: BusinessContext): boolean {
    const prerequisiteLower = prerequisite.toLowerCase();
    
    // Check if prerequisite is met based on context
    if (prerequisiteLower.includes('domain')) {
      return context.currentCapabilities.existingTools.some(tool => 
        tool.toLowerCase().includes('domain')
      );
    }
    
    if (prerequisiteLower.includes('budget')) {
      return context.currentCapabilities.budget !== 'limited';
    }
    
    if (prerequisiteLower.includes('team')) {
      return context.currentCapabilities.teamSize > 1;
    }
    
    // Default to false for unknown prerequisites
    return false;
  }

  private calculateMarcobyServiceFit(service: any, context: BusinessContext): number {
    let score = 0.5; // Base score
    
    // Adjust based on business size and service category
    if (service.category === 'domain' && context.companyProfile.size === 'small') {
      score += 0.3;
    }
    
    if (service.category === 'email' && context.currentCapabilities.teamSize > 1) {
      score += 0.3;
    }
    
    if (service.required) {
      score += 0.2;
    }
    
    return Math.min(score, 1.0);
  }

  private async enhanceExecutionPlan(playbook: BusinessPlaybook, context: BusinessContext): Promise<any> {
    const prompt = `Enhance this execution plan for the business context:
    
Business Context:
- Company: ${context.companyProfile.name} (${context.companyProfile.industry})
- Size: ${context.companyProfile.size}, Stage: ${context.companyProfile.stage}
- User Role: ${context.userProfile.role}
- Technical Expertise: ${context.currentCapabilities.technicalExpertise}

Playbook: ${playbook.title}
Current Plan: ${JSON.stringify(playbook.executionPlan, null, 2)}

Provide specific enhancements and customizations for this business context.`;

    try {
      const response = await this.aiGateway.chat({
        messages: [{ role: 'user', content: prompt }],
        tenantId: 'default'
      });
      return {
        ...playbook.executionPlan,
        enhancedOverview: response.success && response.data ? response.data.message : playbook.executionPlan.overview,
        contextualCustomizations: this.generateContextualCustomizations(playbook, context)
      };
    } catch (error) {
      return playbook.executionPlan;
    }
  }

  private generateContextualTips(playbook: BusinessPlaybook, context: BusinessContext): string[] {
    const tips: string[] = [];
    
    if (context.companyProfile.size === 'small') {
      tips.push('Start with the most impactful steps first to maximize limited resources');
    }
    
    if (context.currentCapabilities.technicalExpertise === 'beginner') {
      tips.push('Consider seeking technical assistance for complex steps');
    }
    
    if (context.currentCapabilities.budget === 'limited') {
      tips.push('Focus on free or low-cost alternatives where possible');
    }
    
    return tips;
  }

  private suggestCustomTools(playbook: BusinessPlaybook, context: BusinessContext): any[] {
    const tools: any[] = [];
    
    // Suggest tools based on business context
    if (context.companyProfile.industry === 'technology') {
      tools.push({
        name: 'GitHub',
        purpose: 'Version control and collaboration',
        cost: 'Free-$44/month'
      });
    }
    
    if (context.currentCapabilities.teamSize > 5) {
      tools.push({
        name: 'Slack',
        purpose: 'Team communication',
        cost: 'Free-$15/month'
      });
    }
    
    return tools;
  }

  private generateContextualCustomizations(playbook: BusinessPlaybook, context: BusinessContext): any {
    return {
      timelineAdjustment: context.companyProfile.size === 'small' ? 'Accelerated timeline for faster results' : 'Standard timeline',
      resourceAllocation: context.currentCapabilities.budget === 'limited' ? 'Focus on cost-effective solutions' : 'Full resource utilization',
      teamInvolvement: context.currentCapabilities.teamSize > 1 ? 'Distribute tasks across team members' : 'Solo execution with external support'
    };
  }
}

export const playbookService = new PlaybookService();
export default playbookService;
