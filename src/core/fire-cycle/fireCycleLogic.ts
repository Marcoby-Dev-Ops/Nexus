import type { FireCyclePhase } from '@/domains/business/fire-cycle/types';

export interface UserContext {
  // User profile and preferences
  role: string;
  department: string;
  experienceLevel: 'beginner' | 'intermediate' | 'expert';
  goals: string[];
  challenges: string[];
  
  // Current work context
  currentProjects: Project[];
  recentActivities: Activity[];
  metrics: Metric[];
  integrations: Integration[];
  
  // Business context
  companySize: string;
  industry: string;
  stage: 'startup' | 'growth' | 'mature';
}

export interface Project {
  id: string;
  name: string;
  status: 'planning' | 'active' | 'completed' | 'stalled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  progress: number;
  deadline?: Date;
  team: string[];
  metrics: Metric[];
}

export interface Activity {
  id: string;
  type: 'task' | 'meeting' | 'analysis' | 'decision' | 'integration';
  title: string;
  description: string;
  timestamp: Date;
  duration?: number;
  outcome?: string;
  relatedMetrics?: string[];
}

export interface Metric {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  category: 'revenue' | 'growth' | 'efficiency' | 'health';
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
  lastUpdated: Date;
}

export interface Integration {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'error';
  dataPoints: number;
  lastSync: Date;
  category: string;
}

export interface FireAnalysis {
  phase: FireCyclePhase;
  insights: Insight[];
  recommendations: Recommendation[];
  actions: Action[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1
  reasoning: string;
}

export interface Insight {
  id: string;
  type: 'pattern' | 'anomaly' | 'trend' | 'opportunity' | 'risk';
  title: string;
  description: string;
  evidence: string[];
  impact: 'low' | 'medium' | 'high';
  confidence: number;
}

export interface Recommendation {
  id: string;
  type: 'action' | 'strategy' | 'integration' | 'optimization';
  title: string;
  description: string;
  rationale: string;
  expectedOutcome: string;
  effort: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface Action {
  id: string;
  title: string;
  description: string;
  type: 'immediate' | 'short-term' | 'long-term';
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  dependencies?: string[];
  estimatedDuration?: number;
}

export class FireCycleLogicEngine {
  private userContext: UserContext;

  constructor(userContext: UserContext) {
    this.userContext = userContext;
  }

  /**
   * Analyze user context and determine the most appropriate FIRE phase
   */
  analyzeCurrentPhase(): FireAnalysis {
    const analysis = this.performComprehensiveAnalysis();
    const phase = this.determineOptimalPhase(analysis);
    
    return {
      phase,
      insights: this.generateInsights(analysis),
      recommendations: this.generateRecommendations(analysis, phase),
      actions: this.generateActions(analysis, phase),
      priority: this.calculatePriority(analysis),
      confidence: this.calculateConfidence(analysis),
      reasoning: this.generateReasoning(analysis, phase)
    };
  }

  /**
   * Perform comprehensive analysis of user data
   */
  private performComprehensiveAnalysis() {
    const analysis = {
      // Focus analysis
      focusClarity: this.analyzeFocusClarity(),
      priorityAlignment: this.analyzePriorityAlignment(),
      goalProgress: this.analyzeGoalProgress(),
      
      // Insight analysis
      dataPatterns: this.analyzeDataPatterns(),
      trendAnalysis: this.analyzeTrends(),
      anomalyDetection: this.detectAnomalies(),
      
      // Roadmap analysis
      planningMaturity: this.analyzePlanningMaturity(),
      strategyAlignment: this.analyzeStrategyAlignment(),
      resourceReadiness: this.analyzeResourceReadiness(),
      
      // Execute analysis
      executionEfficiency: this.analyzeExecutionEfficiency(),
      progressTracking: this.analyzeProgressTracking(),
      outcomeMeasurement: this.analyzeOutcomeMeasurement()
    };

    return analysis;
  }

  /**
   * Determine the optimal FIRE phase based on analysis
   */
  private determineOptimalPhase(analysis: any): FireCyclePhase {
    const scores = {
      focus: this.calculateFocusScore(analysis),
      insight: this.calculateInsightScore(analysis),
      roadmap: this.calculateRoadmapScore(analysis),
      execute: this.calculateExecuteScore(analysis)
    };

    // Return the phase with the highest score
    return Object.entries(scores).reduce((a, b) => 
      scores[a[0] as FireCyclePhase] > scores[b[0] as FireCyclePhase] ? a: b
    )[0] as FireCyclePhase;
  }

  /**
   * Calculate focus phase score
   */
  private calculateFocusScore(analysis: any): number {
    let score = 0;
    
    // Low focus clarity indicates need for focus phase
    if (analysis.focusClarity < 0.7) score += 0.4;
    if (analysis.priorityAlignment < 0.6) score += 0.3;
    if (analysis.goalProgress < 0.5) score += 0.3;
    
    return score;
  }

  /**
   * Calculate insight phase score
   */
  private calculateInsightScore(analysis: any): number {
    let score = 0;
    
    // High data availability but low insight generation
    if (this.userContext.metrics.length > 5 && analysis.dataPatterns < 0.6) score += 0.4;
    if (analysis.trendAnalysis < 0.7) score += 0.3;
    if (analysis.anomalyDetection.length > 0) score += 0.3;
    
    return score;
  }

  /**
   * Calculate roadmap phase score
   */
  private calculateRoadmapScore(analysis: any): number {
    let score = 0;
    
    // Good insights but poor planning
    if (analysis.dataPatterns > 0.7 && analysis.planningMaturity < 0.6) score += 0.4;
    if (analysis.strategyAlignment < 0.5) score += 0.3;
    if (analysis.resourceReadiness < 0.6) score += 0.3;
    
    return score;
  }

  /**
   * Calculate execute phase score
   */
  private calculateExecuteScore(analysis: any): number {
    let score = 0;
    
    // Good planning but poor execution
    if (analysis.planningMaturity > 0.7 && analysis.executionEfficiency < 0.6) score += 0.4;
    if (analysis.progressTracking < 0.5) score += 0.3;
    if (analysis.outcomeMeasurement < 0.6) score += 0.3;
    
    return score;
  }

  /**
   * Analyze focus clarity based on user goals and current activities
   */
  private analyzeFocusClarity(): number {
    const { goals, currentProjects, recentActivities } = this.userContext;
    
    if (goals.length === 0) return 0.2;
    if (currentProjects.length === 0) return 0.3;
    
    // Check if activities align with stated goals
    const goalAlignment = this.calculateGoalAlignment(goals, recentActivities);
    const projectAlignment = this.calculateProjectAlignment(currentProjects, goals);
    
    return (goalAlignment + projectAlignment) / 2;
  }

  /**
   * Analyze priority alignment across projects and activities
   */
  private analyzePriorityAlignment(): number {
    const { currentProjects } = this.userContext;
    
    if (currentProjects.length === 0) return 0.5;
    
    const criticalProjects = currentProjects.filter(p => p.priority === 'critical');
    const highPriorityProjects = currentProjects.filter(p => p.priority === 'high');
    
    // Good alignment if critical projects are being worked on
    const criticalProgress = criticalProjects.length > 0 ? 
      criticalProjects.reduce((sum, p) => sum + p.progress, 0) / criticalProjects.length: 0;
    
    return Math.min(1, (criticalProgress + highPriorityProjects.length / currentProjects.length) / 2);
  }

  /**
   * Analyze goal progress
   */
  private analyzeGoalProgress(): number {
    const { goals, currentProjects, metrics } = this.userContext;
    
    if (goals.length === 0) return 0.3;
    
    // Calculate progress based on project completion and metric performance
    const projectProgress = currentProjects.length > 0 ? 
      currentProjects.reduce((sum, p) => sum + p.progress, 0) / currentProjects.length: 0;
    
    const metricProgress = metrics.length > 0 ? 
      metrics.filter(m => m.value >= m.target).length / metrics.length: 0;
    
    return (projectProgress + metricProgress) / 2;
  }

  /**
   * Analyze data patterns from metrics and activities
   */
  private analyzeDataPatterns(): number {
    const { metrics, recentActivities } = this.userContext;
    
    if (metrics.length < 3) return 0.3;
    
    // Look for patterns in metric trends
    const trendingMetrics = metrics.filter(m => m.trend !== 'stable');
    const patternStrength = trendingMetrics.length / metrics.length;
    
    // Check for activity patterns
    const activityPatterns = this.identifyActivityPatterns(recentActivities);
    
    return (patternStrength + activityPatterns) / 2;
  }

  /**
   * Analyze trends in metrics and activities
   */
  private analyzeTrends(): number {
    const { metrics } = this.userContext;
    
    if (metrics.length === 0) return 0.2;
    
    const positiveTrends = metrics.filter(m => m.trend === 'up' && m.changePercent > 0);
    const negativeTrends = metrics.filter(m => m.trend === 'down' && m.changePercent < 0);
    
    // Calculate trend strength
    const trendStrength = (positiveTrends.length - negativeTrends.length) / metrics.length;
    
    return Math.max(0, (trendStrength + 1) / 2);
  }

  /**
   * Detect anomalies in data
   */
  private detectAnomalies(): any[] {
    const { metrics, recentActivities } = this.userContext;
    const anomalies = [];
    
    // Detect metric anomalies (significant deviations)
    metrics.forEach(metric => {
      if (Math.abs(metric.changePercent) > 20) {
        anomalies.push({
          type: 'metric_anomaly',
          metric: metric.name,
          value: metric.value,
          change: metric.changePercent,
          severity: Math.abs(metric.changePercent) > 50 ? 'high' : 'medium'
        });
      }
    });
    
    // Detect activity anomalies (unusual patterns)
    const activityAnomalies = this.detectActivityAnomalies(recentActivities);
    anomalies.push(...activityAnomalies);
    
    return anomalies;
  }

  /**
   * Analyze planning maturity
   */
  private analyzePlanningMaturity(): number {
    const { currentProjects, goals } = this.userContext;
    
    if (currentProjects.length === 0) return 0.2;
    
    // Check if projects have clear deadlines and milestones
    const projectsWithDeadlines = currentProjects.filter(p => p.deadline);
    const deadlineRatio = projectsWithDeadlines.length / currentProjects.length;
    
    // Check if projects align with goals
    const goalAlignment = this.calculateProjectGoalAlignment(currentProjects, goals);
    
    return (deadlineRatio + goalAlignment) / 2;
  }

  /**
   * Analyze strategy alignment
   */
  private analyzeStrategyAlignment(): number {
    const { currentProjects, goals, challenges } = this.userContext;
    
    if (goals.length === 0) return 0.3;
    
    // Check if projects address stated challenges
    const challengeAddressal = this.calculateChallengeAddressal(currentProjects, challenges);
    
    // Check if activities support strategic goals
    const strategicAlignment = this.calculateStrategicAlignment(currentProjects, goals);
    
    return (challengeAddressal + strategicAlignment) / 2;
  }

  /**
   * Analyze resource readiness
   */
  private analyzeResourceReadiness(): number {
    const { integrations, currentProjects } = this.userContext;
    
    // Check if necessary integrations are active
    const activeIntegrations = integrations.filter(i => i.status === 'active');
    const integrationReadiness = activeIntegrations.length / Math.max(integrations.length, 1);
    
    // Check if projects have necessary resources
    const resourceReadiness = this.calculateProjectResourceReadiness(currentProjects);
    
    return (integrationReadiness + resourceReadiness) / 2;
  }

  /**
   * Analyze execution efficiency
   */
  private analyzeExecutionEfficiency(): number {
    const { currentProjects, recentActivities } = this.userContext;
    
    if (currentProjects.length === 0) return 0.3;
    
    // Calculate average project progress
    const avgProgress = currentProjects.reduce((sum, p) => sum + p.progress, 0) / currentProjects.length;
    
    // Analyze activity efficiency
    const activityEfficiency = this.calculateActivityEfficiency(recentActivities);
    
    return (avgProgress + activityEfficiency) / 2;
  }

  /**
   * Analyze progress tracking
   */
  private analyzeProgressTracking(): number {
    const { currentProjects, metrics } = this.userContext;
    
    // Check if projects have progress tracking
    const projectsWithProgress = currentProjects.filter(p => p.progress > 0);
    const progressTrackingRatio = projectsWithProgress.length / Math.max(currentProjects.length, 1);
    
    // Check if metrics are being tracked
    const metricsTrackingRatio = metrics.length > 0 ? 1: 0;
    
    return (progressTrackingRatio + metricsTrackingRatio) / 2;
  }

  /**
   * Analyze outcome measurement
   */
  private analyzeOutcomeMeasurement(): number {
    const { metrics, currentProjects } = this.userContext;
    
    // Check if metrics are being measured against targets
    const metricsWithTargets = metrics.filter(m => m.target > 0);
    const targetMeasurementRatio = metricsWithTargets.length / Math.max(metrics.length, 1);
    
    // Check if projects have outcome metrics
    const projectsWithMetrics = currentProjects.filter(p => p.metrics.length > 0);
    const projectMeasurementRatio = projectsWithMetrics.length / Math.max(currentProjects.length, 1);
    
    return (targetMeasurementRatio + projectMeasurementRatio) / 2;
  }

  /**
   * Generate insights based on analysis
   */
  private generateInsights(analysis: any): Insight[] {
    const insights: Insight[] = [];
    
    // Focus insights
    if (analysis.focusClarity < 0.5) {
      insights.push({
        id: 'focus-clarity',
        type: 'opportunity',
        title: 'Focus Clarity Opportunity',
        description: 'Your goals and activities could be better aligned. Consider reviewing your priorities.',
        evidence: ['Multiple projects without clear priority', 'Activities not aligned with stated goals'],
        impact: 'high',
        confidence: 0.8
      });
    }
    
    // Insight phase insights
    if (analysis.dataPatterns > 0.6) {
      insights.push({
        id: 'data-patterns',
        type: 'pattern',
        title: 'Data Patterns Detected',
        description: 'Strong patterns detected in your metrics. Consider analyzing these trends.',
        evidence: ['Consistent metric trends', 'Activity patterns identified'],
        impact: 'medium',
        confidence: 0.7
      });
    }
    
    // Anomaly insights
    const anomalies = this.detectAnomalies();
    anomalies.forEach((anomaly, index) => {
      insights.push({
        id: `anomaly-${index}`,
        type: 'anomaly',
        title: `${anomaly.metric || 'Activity'} Anomaly`,
        description: `Unusual pattern detected: ${anomaly.value} (${anomaly.change}% change)`,
        evidence: [`Significant deviation from normal patterns`, `Requires immediate attention`],
        impact: anomaly.severity === 'high' ? 'high' : 'medium',
        confidence: 0.9
      });
    });
    
    return insights;
  }

  /**
   * Generate recommendations based on analysis and phase
   */
  private generateRecommendations(analysis: any, phase: FireCyclePhase): Recommendation[] {
    const recommendations: Recommendation[] = [];
    
    switch (phase) {
      case 'focus':
        if (analysis.focusClarity < 0.5) {
          recommendations.push({
            id: 'improve-focus',
            type: 'strategy',
            title: 'Improve Focus Clarity',
            description: 'Define clear priorities and align activities with goals',
            rationale: 'Low focus clarity indicates scattered priorities',
            expectedOutcome: 'Better alignment between goals and activities',
            effort: 'medium',
            priority: 'high'
          });
        }
        break;
        
      case 'insight':
        if (analysis.dataPatterns < 0.6) {
          recommendations.push({
            id: 'enhance-analysis',
            type: 'action',
            title: 'Enhance Data Analysis',
            description: 'Implement deeper analytics to uncover patterns and trends',
            rationale: 'Limited pattern detection suggests missed opportunities',
            expectedOutcome: 'Better understanding of performance drivers',
            effort: 'high',
            priority: 'medium'
          });
        }
        break;
        
      case 'roadmap':
        if (analysis.planningMaturity < 0.6) {
          recommendations.push({
            id: 'improve-planning',
            type: 'strategy',
            title: 'Improve Planning Maturity',
            description: 'Develop more structured planning processes with clear milestones',
            rationale: 'Low planning maturity indicates reactive rather than proactive approach',
            expectedOutcome: 'More predictable and successful project outcomes',
            effort: 'medium',
            priority: 'high'
          });
        }
        break;
        
      case 'execute':
        if (analysis.executionEfficiency < 0.6) {
          recommendations.push({
            id: 'optimize-execution',
            type: 'optimization',
            title: 'Optimize Execution Process',
            description: 'Streamline workflows and improve execution efficiency',
            rationale: 'Low execution efficiency suggests process bottlenecks',
            expectedOutcome: 'Faster project completion and better resource utilization',
            effort: 'medium',
            priority: 'high'
          });
        }
        break;
    }
    
    return recommendations;
  }

  /**
   * Generate actionable items based on analysis and phase
   */
  private generateActions(analysis: any, phase: FireCyclePhase): Action[] {
    const actions: Action[] = [];
    
    switch (phase) {
      case 'focus':
        actions.push({
          id: 'review-goals',
          title: 'Review and Prioritize Goals',
          description: 'Spend 30 minutes reviewing your current goals and priorities',
          type: 'immediate',
          effort: 'low',
          impact: 'high',
          estimatedDuration: 30
        });
        break;
        
      case 'insight':
        actions.push({
          id: 'analyze-trends',
          title: 'Analyze Recent Trends',
          description: 'Review your metrics and identify key patterns and insights',
          type: 'short-term',
          effort: 'medium',
          impact: 'medium',
          estimatedDuration: 60
        });
        break;
        
      case 'roadmap':
        actions.push({
          id: 'create-action-plan',
          title: 'Create Action Plan',
          description: 'Develop a structured plan based on your insights',
          type: 'short-term',
          effort: 'medium',
          impact: 'high',
          estimatedDuration: 90
        });
        break;
        
      case 'execute':
        actions.push({
          id: 'track-progress',
          title: 'Track Progress and Adjust',
          description: 'Monitor your action plan progress and make necessary adjustments',
          type: 'immediate',
          effort: 'low',
          impact: 'medium',
          estimatedDuration: 15
        });
        break;
    }
    
    return actions;
  }

  /**
   * Calculate overall priority based on analysis
   */
  private calculatePriority(analysis: any): 'low' | 'medium' | 'high' | 'critical' {
    const criticalIssues = this.detectAnomalies().filter(a => a.severity === 'high');
    
    if (criticalIssues.length > 0) return 'critical';
    if (analysis.focusClarity < 0.3) return 'high';
    if (analysis.executionEfficiency < 0.4) return 'high';
    if (analysis.planningMaturity < 0.4) return 'medium';
    
    return 'low';
  }

  /**
   * Calculate confidence in the analysis
   */
  private calculateConfidence(analysis: any): number {
    const dataQuality = this.userContext.metrics.length > 5 ? 0.8: 0.4;
    const activityQuality = this.userContext.recentActivities.length > 10 ? 0.7 : 0.5;
    const projectQuality = this.userContext.currentProjects.length > 0 ? 0.6 : 0.3;
    
    return (dataQuality + activityQuality + projectQuality) / 3;
  }

  /**
   * Generate reasoning for the phase recommendation
   */
  private generateReasoning(analysis: any, phase: FireCyclePhase): string {
    const reasons = [];
    
    switch (phase) {
      case 'focus':
        if (analysis.focusClarity < 0.5) reasons.push('Low focus clarity');
        if (analysis.priorityAlignment < 0.6) reasons.push('Misaligned priorities');
        if (analysis.goalProgress < 0.5) reasons.push('Limited goal progress');
        break;
        
      case 'insight':
        if (analysis.dataPatterns < 0.6) reasons.push('Limited pattern detection');
        if (analysis.trendAnalysis < 0.7) reasons.push('Insufficient trend analysis');
        if (this.detectAnomalies().length > 0) reasons.push('Anomalies detected');
        break;
        
      case 'roadmap':
        if (analysis.planningMaturity < 0.6) reasons.push('Low planning maturity');
        if (analysis.strategyAlignment < 0.5) reasons.push('Poor strategy alignment');
        if (analysis.resourceReadiness < 0.6) reasons.push('Resource gaps identified');
        break;
        
      case 'execute':
        if (analysis.executionEfficiency < 0.6) reasons.push('Low execution efficiency');
        if (analysis.progressTracking < 0.5) reasons.push('Insufficient progress tracking');
        if (analysis.outcomeMeasurement < 0.6) reasons.push('Limited outcome measurement');
        break;
    }
    
    return `Recommended ${phase} phase based on: ${reasons.join(', ')}`;
  }

  // Helper methods
  private calculateGoalAlignment(goals: string[], activities: Activity[]): number {
    // Implementation would analyze activity descriptions against goal keywords
    return 0.6; // Placeholder
  }

  private calculateProjectAlignment(projects: Project[], goals: string[]): number {
    // Implementation would analyze project descriptions against goal keywords
    return 0.7; // Placeholder
  }

  private identifyActivityPatterns(activities: Activity[]): number {
    // Implementation would identify patterns in activity types, timing, etc.
    return 0.5; // Placeholder
  }

  private detectActivityAnomalies(activities: Activity[]): any[] {
    // Implementation would detect unusual activity patterns
    return []; // Placeholder
  }

  private calculateChallengeAddressal(projects: Project[], challenges: string[]): number {
    // Implementation would analyze if projects address stated challenges
    return 0.6; // Placeholder
  }

  private calculateStrategicAlignment(projects: Project[], goals: string[]): number {
    // Implementation would analyze project-goal alignment
    return 0.7; // Placeholder
  }

  private calculateProjectResourceReadiness(projects: Project[]): number {
    // Implementation would analyze resource availability for projects
    return 0.6; // Placeholder
  }

  private calculateActivityEfficiency(activities: Activity[]): number {
    // Implementation would analyze activity efficiency patterns
    return 0.6; // Placeholder
  }

  private calculateProjectGoalAlignment(projects: Project[], goals: string[]): number {
    // Implementation would analyze project-goal alignment
    return 0.7; // Placeholder
  }
} 