/**
 * Building Block Playbook Service
 * 
 * Maps business playbooks to the 7 quantum building blocks and provides
 * domain-based browsing, scoring, and executive assistant integration.
 * 
 * This service enables the "See Think Act" paradigm where users can:
 * - Browse playbooks by building block domains (Identity, Revenue, Operations, etc.)
 * - See current state and scores through dashboards and KPIs
 * - Interact with executive assistant chat interface
 * - Collaborate with Nexus on updating data and initiatives
 */

import { businessPlaybooks, type BusinessPlaybook } from '../core/config/businessPlaybooks';
import { QUANTUM_BLOCKS, type QuantumBlock } from '../core/config/quantumBusinessModel';
import { insightFeedbackService } from './ai/InsightFeedbackService';

export interface BuildingBlockDomain {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'nucleus' | 'energy' | 'carriers' | 'memory' | 'connections';
  priority: 'critical' | 'high' | 'medium' | 'low';
  
  // Playbook mappings
  playbooks: PlaybookMapping[];
  
  // Health and scoring
  healthScore: number;
  maturityLevel: 'foundation' | 'established' | 'optimized' | 'advanced';
  completionRate: number;
  
  // KPIs and metrics
  keyMetrics: DomainMetric[];
  
  // AI capabilities
  aiCapabilities: string[];
  
  // Executive assistant context
  assistantContext: {
    currentFocus: string;
    recentActivities: string[];
    pendingActions: string[];
    insights: string[];
  };
}

export interface PlaybookMapping {
  playbook: BusinessPlaybook;
  relevanceScore: number;
  buildingBlockAlignment: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'not_started' | 'in_progress' | 'completed' | 'paused' | 'not_applicable';
  estimatedImpact: string;
  timeToComplete: string;
  prerequisites: string[];
  dependencies: string[];
}

export interface DomainMetric {
  id: string;
  name: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  status: 'healthy' | 'warning' | 'critical';
  lastUpdated: string;
}

export interface BuildingBlockInsight {
  domainId: string;
  insightType: 'health' | 'opportunity' | 'risk' | 'recommendation';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  relatedPlaybooks: string[];
  estimatedImpact: string;
  timeToImplement: string;
}

export interface ExecutiveAssistantContext {
  userId: string;
  companyId: string;
  currentDomain: string | null;
  recentConversations: Array<{
    timestamp: string;
    domain: string;
    topic: string;
    actions: string[];
  }>;
  pendingTasks: Array<{
    id: string;
    domain: string;
    task: string;
    priority: 'high' | 'medium' | 'low';
    dueDate?: string;
  }>;
  insights: BuildingBlockInsight[];
}

export class BuildingBlockPlaybookService {
  private static instance: BuildingBlockPlaybookService;
  
  public static getInstance(): BuildingBlockPlaybookService {
    if (!BuildingBlockPlaybookService.instance) {
      BuildingBlockPlaybookService.instance = new BuildingBlockPlaybookService();
    }
    return BuildingBlockPlaybookService.instance;
  }

  /**
   * Get all building block domains with mapped playbooks
   */
  async getBuildingBlockDomains(userId: string, companyId: string): Promise<BuildingBlockDomain[]> {
    const domains: BuildingBlockDomain[] = [];
    
    for (const block of QUANTUM_BLOCKS) {
      const playbookMappings = await this.mapPlaybooksToBlock(block.id, userId, companyId);
      const healthScore = await this.calculateDomainHealth(block.id, userId, companyId);
      const maturityLevel = this.determineMaturityLevel(healthScore);
      const completionRate = await this.calculateCompletionRate(block.id, userId, companyId);
      const keyMetrics = await this.getDomainMetrics(block.id, userId, companyId);
      const aiCapabilities = block.aiCapabilities.map(cap => cap.name);
      const assistantContext = await this.getAssistantContext(block.id, userId, companyId);
      
      domains.push({
        id: block.id,
        name: block.name,
        description: block.description,
        icon: block.icon,
        category: block.category,
        priority: block.priority,
        playbooks: playbookMappings,
        healthScore,
        maturityLevel,
        completionRate,
        keyMetrics,
        aiCapabilities,
        assistantContext
      });
    }
    
    return domains;
  }

  /**
   * Map playbooks to a specific building block
   */
  private async mapPlaybooksToBlock(blockId: string, userId: string, companyId: string): Promise<PlaybookMapping[]> {
    const mappings: PlaybookMapping[] = [];
    
    // Define playbook to building block mappings
    const playbookMappings = this.getPlaybookBlockMappings();
    const blockPlaybooks = playbookMappings[blockId] || [];
    
    // Get user feedback to filter out excluded playbooks
    const excludedInsightsResponse = await insightFeedbackService.getExcludedInsights(userId, companyId);
    const excludedInsights = excludedInsightsResponse.success ? (excludedInsightsResponse.data || []) : [];
    
    for (const playbookId of blockPlaybooks) {
      const playbook = businessPlaybooks.find(p => p.id === playbookId);
      if (!playbook) continue;
      
      // Check if this playbook should be excluded based on user feedback
      if (this.shouldExcludePlaybook(playbook, excludedInsights)) {
        continue;
      }
      
      const mapping: PlaybookMapping = {
        playbook,
        relevanceScore: this.calculateRelevanceScore(playbook, blockId),
        buildingBlockAlignment: this.calculateBlockAlignment(playbook, blockId),
        priority: this.determinePlaybookPriority(playbook, blockId),
        status: await this.getPlaybookStatus(playbook.id, userId, companyId),
        estimatedImpact: playbook.estimatedValue,
        timeToComplete: playbook.timeframe,
        prerequisites: playbook.executionPlan.prerequisites,
        dependencies: this.getPlaybookDependencies(playbook, blockPlaybooks)
      };
      
      mappings.push(mapping);
    }
    
    // Sort by relevance and priority
    return mappings.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const aScore = a.relevanceScore * priorityOrder[a.priority];
      const bScore = b.relevanceScore * priorityOrder[b.priority];
      return bScore - aScore;
    });
  }

  /**
   * Define mappings between playbooks and building blocks
   */
  private getPlaybookBlockMappings(): Record<string, string[]> {
    return {
      identity: [
        'register-business-entity',
        'develop-business-plan',
        'setup-business-bank-account',
        'business-email-setup',
        'website-development',
        'brand-identity-development',
        'social-media-presence',
        'content-marketing-strategy'
      ],
      revenue: [
        'sales-process-setup',
        'customer-acquisition-strategy',
        'pricing-strategy-development',
        'lead-generation-system',
        'email-marketing-setup',
        'social-media-advertising',
        'content-marketing-strategy',
        'customer-relationship-management',
        'sales-automation',
        'revenue-optimization'
      ],
      cash: [
        'setup-business-bank-account',
        'accounting-system-setup',
        'expense-tracking-system',
        'invoice-management',
        'cash-flow-management',
        'financial-reporting',
        'tax-compliance',
        'budget-planning',
        'financial-forecasting'
      ],
      delivery: [
        'product-development-process',
        'quality-assurance-system',
        'inventory-management',
        'order-fulfillment',
        'customer-service-system',
        'supply-chain-management',
        'operational-efficiency',
        'process-automation',
        'delivery-optimization'
      ],
      people: [
        'team-structure-design',
        'hiring-process-setup',
        'employee-onboarding',
        'performance-management',
        'training-development',
        'culture-development',
        'communication-tools',
        'collaboration-platforms',
        'hr-compliance'
      ],
      knowledge: [
        'data-management-system',
        'document-management',
        'knowledge-base-setup',
        'business-intelligence',
        'analytics-setup',
        'reporting-system',
        'decision-support',
        'learning-management',
        'intellectual-property'
      ],
      systems: [
        'technology-stack-selection',
        'system-integration',
        'automation-setup',
        'security-implementation',
        'compliance-management',
        'backup-disaster-recovery',
        'monitoring-alerting',
        'api-management',
        'cloud-migration'
      ]
    };
  }

  /**
   * Calculate domain health score based on completed playbooks and metrics
   */
  private async calculateDomainHealth(blockId: string, userId: string, companyId: string): Promise<number> {
    const playbookMappings = await this.mapPlaybooksToBlock(blockId, userId, companyId);
    
    if (playbookMappings.length === 0) return 0;
    
    const completedPlaybooks = playbookMappings.filter(p => p.status === 'completed');
    const inProgressPlaybooks = playbookMappings.filter(p => p.status === 'in_progress');
    
    const completionWeight = 0.6;
    const progressWeight = 0.3;
    const criticalWeight = 0.1;
    
    const completionScore = (completedPlaybooks.length / playbookMappings.length) * 100;
    const progressScore = (inProgressPlaybooks.length / playbookMappings.length) * 50;
    const criticalScore = this.calculateCriticalPlaybookScore(playbookMappings);
    
    return Math.round(
      (completionScore * completionWeight) +
      (progressScore * progressWeight) +
      (criticalScore * criticalWeight)
    );
  }

  /**
   * Determine maturity level based on health score
   */
  private determineMaturityLevel(healthScore: number): 'foundation' | 'established' | 'optimized' | 'advanced' {
    if (healthScore < 25) return 'foundation';
    if (healthScore < 50) return 'established';
    if (healthScore < 75) return 'optimized';
    return 'advanced';
  }

  /**
   * Calculate completion rate for a domain
   */
  private async calculateCompletionRate(blockId: string, userId: string, companyId: string): Promise<number> {
    const playbookMappings = await this.mapPlaybooksToBlock(blockId, userId, companyId);
    
    if (playbookMappings.length === 0) return 0;
    
    const completedPlaybooks = playbookMappings.filter(p => p.status === 'completed');
    return Math.round((completedPlaybooks.length / playbookMappings.length) * 100);
  }

  /**
   * Get domain-specific metrics and KPIs
   */
  private async getDomainMetrics(blockId: string, userId: string, companyId: string): Promise<DomainMetric[]> {
    // This would integrate with actual business data
    // For now, return placeholder metrics based on the building block
    const metrics: Record<string, DomainMetric[]> = {
      identity: [
        { id: 'brand_awareness', name: 'Brand Awareness', currentValue: 65, targetValue: 80, unit: '%', trend: 'up', status: 'warning', lastUpdated: new Date().toISOString() },
        { id: 'market_positioning', name: 'Market Positioning', currentValue: 7.2, targetValue: 8.5, unit: '/10', trend: 'stable', status: 'healthy', lastUpdated: new Date().toISOString() }
      ],
      revenue: [
        { id: 'mrr', name: 'Monthly Recurring Revenue', currentValue: 15000, targetValue: 25000, unit: '$', trend: 'up', status: 'warning', lastUpdated: new Date().toISOString() },
        { id: 'cac', name: 'Customer Acquisition Cost', currentValue: 150, targetValue: 100, unit: '$', trend: 'down', status: 'healthy', lastUpdated: new Date().toISOString() },
        { id: 'clv', name: 'Customer Lifetime Value', currentValue: 1200, targetValue: 2000, unit: '$', trend: 'up', status: 'warning', lastUpdated: new Date().toISOString() }
      ],
      cash: [
        { id: 'cash_flow', name: 'Cash Flow', currentValue: 5000, targetValue: 10000, unit: '$', trend: 'up', status: 'warning', lastUpdated: new Date().toISOString() },
        { id: 'burn_rate', name: 'Burn Rate', currentValue: 8000, targetValue: 5000, unit: '$/month', trend: 'down', status: 'healthy', lastUpdated: new Date().toISOString() }
      ],
      delivery: [
        { id: 'delivery_time', name: 'Delivery Time', currentValue: 3.2, targetValue: 2.5, unit: 'days', trend: 'down', status: 'healthy', lastUpdated: new Date().toISOString() },
        { id: 'quality_score', name: 'Quality Score', currentValue: 8.7, targetValue: 9.0, unit: '/10', trend: 'up', status: 'healthy', lastUpdated: new Date().toISOString() }
      ],
      people: [
        { id: 'employee_satisfaction', name: 'Employee Satisfaction', currentValue: 7.8, targetValue: 8.5, unit: '/10', trend: 'up', status: 'warning', lastUpdated: new Date().toISOString() },
        { id: 'productivity', name: 'Productivity', currentValue: 85, targetValue: 90, unit: '%', trend: 'up', status: 'warning', lastUpdated: new Date().toISOString() }
      ],
      knowledge: [
        { id: 'data_quality', name: 'Data Quality', currentValue: 78, targetValue: 90, unit: '%', trend: 'up', status: 'warning', lastUpdated: new Date().toISOString() },
        { id: 'insight_utilization', name: 'Insight Utilization', currentValue: 65, targetValue: 80, unit: '%', trend: 'stable', status: 'warning', lastUpdated: new Date().toISOString() }
      ],
      systems: [
        { id: 'system_uptime', name: 'System Uptime', currentValue: 99.2, targetValue: 99.5, unit: '%', trend: 'up', status: 'healthy', lastUpdated: new Date().toISOString() },
        { id: 'automation_rate', name: 'Automation Rate', currentValue: 45, targetValue: 70, unit: '%', trend: 'up', status: 'warning', lastUpdated: new Date().toISOString() }
      ]
    };
    
    return metrics[blockId] || [];
  }

  /**
   * Get executive assistant context for a domain
   */
  private async getAssistantContext(blockId: string, userId: string, companyId: string): Promise<BuildingBlockDomain['assistantContext']> {
    // This would integrate with actual conversation history and AI insights
    return {
      currentFocus: `Strengthening ${this.getBlockName(blockId)} capabilities`,
      recentActivities: [
        'Completed business entity registration',
        'Started sales process setup',
        'Updated financial reporting'
      ],
      pendingActions: [
        'Review pricing strategy',
        'Set up customer feedback system',
        'Implement automation workflows'
      ],
      insights: [
        'Revenue growth is strong but customer acquisition cost is high',
        'Team productivity has improved 15% with new collaboration tools',
        'Cash flow is positive but could be optimized further'
      ]
    };
  }

  /**
   * Generate insights for a specific building block
   */
  async generateDomainInsights(blockId: string, userId: string, companyId: string): Promise<BuildingBlockInsight[]> {
    const playbookMappings = await this.mapPlaybooksToBlock(blockId, userId, companyId);
    const healthScore = await this.calculateDomainHealth(blockId, userId, companyId);
    const insights: BuildingBlockInsight[] = [];
    
    // Health insights
    if (healthScore < 30) {
      insights.push({
        domainId: blockId,
        insightType: 'risk',
        title: `${this.getBlockName(blockId)} Foundation Needs Attention`,
        description: `Your ${this.getBlockName(blockId).toLowerCase()} foundation is weak. Focus on critical playbooks to establish a solid base.`,
        priority: 'high',
        actionable: true,
        relatedPlaybooks: playbookMappings.filter(p => p.priority === 'critical').map(p => p.playbook.id),
        estimatedImpact: 'High - Foundation for business success',
        timeToImplement: '2-4 weeks'
      });
    }
    
    // Opportunity insights
    const incompletePlaybooks = playbookMappings.filter(p => p.status === 'not_started' && p.priority === 'high');
    if (incompletePlaybooks.length > 0) {
      insights.push({
        domainId: blockId,
        insightType: 'opportunity',
        title: `High-Impact ${this.getBlockName(blockId)} Improvements Available`,
        description: `${incompletePlaybooks.length} high-priority playbooks can significantly improve your ${this.getBlockName(blockId).toLowerCase()} capabilities.`,
        priority: 'high',
        actionable: true,
        relatedPlaybooks: incompletePlaybooks.map(p => p.playbook.id),
        estimatedImpact: 'Medium to High',
        timeToImplement: '1-3 weeks'
      });
    }
    
    // Optimization insights
    if (healthScore > 70) {
      insights.push({
        domainId: blockId,
        insightType: 'recommendation',
        title: `${this.getBlockName(blockId)} Optimization Opportunities`,
        description: `Your ${this.getBlockName(blockId).toLowerCase()} is strong. Consider advanced optimization playbooks for competitive advantage.`,
        priority: 'medium',
        actionable: true,
        relatedPlaybooks: playbookMappings.filter(p => p.priority === 'medium').map(p => p.playbook.id),
        estimatedImpact: 'Medium - Competitive advantage',
        timeToImplement: '2-6 weeks'
      });
    }
    
    return insights;
  }

  /**
   * Get executive assistant context for chat interface
   */
  async getExecutiveAssistantContext(userId: string, companyId: string, currentDomain?: string): Promise<ExecutiveAssistantContext> {
    const insights: BuildingBlockInsight[] = [];
    
    // Generate insights for all domains or specific domain
    if (currentDomain) {
      insights.push(...await this.generateDomainInsights(currentDomain, userId, companyId));
    } else {
      for (const block of QUANTUM_BLOCKS) {
        insights.push(...await this.generateDomainInsights(block.id, userId, companyId));
      }
    }
    
    return {
      userId,
      companyId,
      currentDomain: currentDomain || null,
      recentConversations: [
        {
          timestamp: new Date().toISOString(),
          domain: 'revenue',
          topic: 'Sales process optimization',
          actions: ['Updated lead scoring criteria', 'Implemented new follow-up sequence']
        }
      ],
      pendingTasks: [
        {
          id: '1',
          domain: 'revenue',
          task: 'Review and update pricing strategy based on market analysis',
          priority: 'high',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      insights
    };
  }

  // Helper methods
  private shouldExcludePlaybook(playbook: BusinessPlaybook, excludedInsights: string[]): boolean {
    return excludedInsights.some(excluded => 
      playbook.title.toLowerCase().includes(excluded.toLowerCase()) ||
      playbook.description.toLowerCase().includes(excluded.toLowerCase())
    );
  }

  private calculateRelevanceScore(playbook: BusinessPlaybook, blockId: string): number {
    // Simple relevance scoring based on category alignment
    const categoryAlignment: Record<string, Record<string, number>> = {
      identity: { setup: 0.9, marketing: 0.7, operations: 0.3, finance: 0.2, sales: 0.4, technology: 0.5, growth: 0.6, compliance: 0.8 },
      revenue: { setup: 0.3, marketing: 0.9, operations: 0.4, finance: 0.6, sales: 0.9, technology: 0.5, growth: 0.8, compliance: 0.3 },
      cash: { setup: 0.4, marketing: 0.2, operations: 0.5, finance: 0.9, sales: 0.3, technology: 0.4, growth: 0.5, compliance: 0.7 },
      delivery: { setup: 0.5, marketing: 0.3, operations: 0.9, finance: 0.4, sales: 0.6, technology: 0.7, growth: 0.6, compliance: 0.5 },
      people: { setup: 0.6, marketing: 0.4, operations: 0.7, finance: 0.3, sales: 0.5, technology: 0.6, growth: 0.7, compliance: 0.8 },
      knowledge: { setup: 0.4, marketing: 0.6, operations: 0.5, finance: 0.7, sales: 0.6, technology: 0.8, growth: 0.7, compliance: 0.6 },
      systems: { setup: 0.7, marketing: 0.5, operations: 0.6, finance: 0.5, sales: 0.4, technology: 0.9, growth: 0.6, compliance: 0.8 }
    };
    
    return categoryAlignment[blockId]?.[playbook.category] || 0.5;
  }

  private calculateBlockAlignment(playbook: BusinessPlaybook, blockId: string): number {
    // Calculate how well a playbook aligns with a specific building block
    return this.calculateRelevanceScore(playbook, blockId) * 100;
  }

  private determinePlaybookPriority(playbook: BusinessPlaybook, blockId: string): 'critical' | 'high' | 'medium' | 'low' {
    const relevanceScore = this.calculateRelevanceScore(playbook, blockId);
    const difficulty = playbook.difficulty;
    
    if (relevanceScore > 0.8 && difficulty === 'beginner') return 'critical';
    if (relevanceScore > 0.7 && difficulty === 'beginner') return 'high';
    if (relevanceScore > 0.6) return 'medium';
    return 'low';
  }

  private async getPlaybookStatus(playbookId: string, userId: string, companyId: string): Promise<PlaybookMapping['status']> {
    // This would check actual execution status from database
    // For now, return random status for demonstration
    const statuses: PlaybookMapping['status'][] = ['not_started', 'in_progress', 'completed', 'paused'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  }

  private getPlaybookDependencies(playbook: BusinessPlaybook, blockPlaybooks: string[]): string[] {
    // Extract dependencies from playbook prerequisites
    return playbook.executionPlan.prerequisites
      .filter(prereq => blockPlaybooks.includes(prereq))
      .map(prereq => prereq);
  }

  private calculateCriticalPlaybookScore(playbookMappings: PlaybookMapping[]): number {
    const criticalPlaybooks = playbookMappings.filter(p => p.priority === 'critical');
    const completedCritical = criticalPlaybooks.filter(p => p.status === 'completed');
    
    if (criticalPlaybooks.length === 0) return 100;
    return (completedCritical.length / criticalPlaybooks.length) * 100;
  }

  private getBlockName(blockId: string): string {
    const block = QUANTUM_BLOCKS.find(b => b.id === blockId);
    return block?.name || blockId;
  }
}

export const buildingBlockPlaybookService = BuildingBlockPlaybookService.getInstance();
