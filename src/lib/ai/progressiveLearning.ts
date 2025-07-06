/**
 * progressiveLearning.ts
 * 
 * Progressive learning system for building comprehensive user and company intelligence
 * through conversation analysis, behavioral patterns, and contextual data collection.
 */

import { supabase } from '../core/supabase';
import type { Agent } from './agentRegistry';

export interface BusinessGoals {
  id: string;
  goal: string;
  category: 'revenue' | 'efficiency' | 'growth' | 'innovation' | 'retention';
  priority: 'high' | 'medium' | 'low';
  target_date: string;
  success_metrics: string[];
  current_progress: number; // 0-100
}

export interface CurrentChallenges {
  id: string;
  challenge: string;
  category: 'operational' | 'financial' | 'technical' | 'market' | 'human_resources';
  severity: 'critical' | 'high' | 'medium' | 'low';
  impact_areas: string[];
  potential_solutions: string[];
}

export interface LearningInsight {
  user_id: string;
  insight_type: 'preference' | 'pattern' | 'goal' | 'challenge' | 'skill_gap';
  insight_data: Record<string, unknown>;
  confidence_score: number; // 0-1
  source: 'conversation' | 'behavior' | 'feedback' | 'integration';
  created_at: string;
}

export interface CompanyHealthMetric {
  metric_name: string;
  current_score: number; // 0-100
  benchmark_score: number;
  trend: 'improving' | 'stable' | 'declining';
  last_updated: string;
  contributing_factors: string[];
}

export class ProgressiveLearning {
  private userId: string;
  private companyId: string;

  constructor(userId: string, companyId: string) {
    this.userId = userId;
    this.companyId = companyId;
  }

  /**
   * Analyze conversation for learning opportunities
   */
  async analyzeConversation(
    userMessage: string,
    aiResponse: string,
    agent: Agent,
    feedback?: 'helpful' | 'unhelpful' | 'partially_helpful'
  ): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];

    // Analyze user preferences from conversation
    const preferenceInsights = this.extractPreferences(userMessage, agent);
    insights.push(...preferenceInsights);

    // Identify potential goals or challenges mentioned
    const goalChallengeInsights = this.extractGoalsAndChallenges(userMessage);
    insights.push(...goalChallengeInsights);

    // Analyze communication patterns
    const patternInsights = this.analyzeCommunicationPatterns(userMessage, agent);
    insights.push(...patternInsights);

    if (feedback) {
      // In a real scenario, this feedback would be used to adjust agent models or strategies.
      console.log(`Feedback for agent ${agent.name}: ${feedback}`);
    }

    // Store insights for future use
    await this.storeInsights(insights);

    return insights;
  }

  /**
   * Extract user preferences from conversation
   */
  private extractPreferences(message: string, agent: Agent): LearningInsight[] {
    const insights: LearningInsight[] = [];
    const messageLower = message.toLowerCase();

    // Communication style preferences
    if (messageLower.includes('detailed') || messageLower.includes('comprehensive')) {
      insights.push({
        user_id: this.userId,
        insight_type: 'preference',
        insight_data: {
          communication_style: 'detailed',
          prefers_comprehensive_analysis: true
        },
        confidence_score: 0.7,
        source: 'conversation',
        created_at: new Date().toISOString()
      });
    }

    if (messageLower.includes('quick') || messageLower.includes('summary') || messageLower.includes('brief')) {
      insights.push({
        user_id: this.userId,
        insight_type: 'preference',
        insight_data: {
          communication_style: 'concise',
          prefers_quick_summaries: true
        },
        confidence_score: 0.7,
        source: 'conversation',
        created_at: new Date().toISOString()
      });
    }

    // Department/topic preferences
    if (agent.department) {
      insights.push({
        user_id: this.userId,
        insight_type: 'preference',
        insight_data: {
          frequently_accessed_department: agent.department,
          department_expertise_level: this.assessExpertiseLevel(message)
        },
        confidence_score: 0.6,
        source: 'conversation',
        created_at: new Date().toISOString()
      });
    }

    return insights;
  }

  /**
   * Extract goals and challenges from user messages
   */
  private extractGoalsAndChallenges(message: string): LearningInsight[] {
    const insights: LearningInsight[] = [];
    const messageLower = message.toLowerCase();

    // Goal indicators
    const goalKeywords = [
      'goal', 'target', 'objective', 'aim', 'plan to', 'want to achieve',
      'increase', 'improve', 'grow', 'expand', 'optimize'
    ];

    const hasGoalKeywords = goalKeywords.some(keyword => messageLower.includes(keyword));
    if (hasGoalKeywords) {
      insights.push({
        user_id: this.userId,
        insight_type: 'goal',
        insight_data: {
          potential_goal: message.substring(0, 200),
          goal_category: this.categorizeGoal(message),
          mentioned_in_context: this.extractContext(message)
        },
        confidence_score: 0.6,
        source: 'conversation',
        created_at: new Date().toISOString()
      });
    }

    // Challenge indicators
    const challengeKeywords = [
      'problem', 'issue', 'challenge', 'difficulty', 'struggle', 'concern',
      'bottleneck', 'obstacle', 'barrier', 'risk', 'declining', 'falling'
    ];

    const hasChallengeKeywords = challengeKeywords.some(keyword => messageLower.includes(keyword));
    if (hasChallengeKeywords) {
      insights.push({
        user_id: this.userId,
        insight_type: 'challenge',
        insight_data: {
          potential_challenge: message.substring(0, 200),
          challenge_category: this.categorizeChallenge(message),
          urgency_level: this.assessUrgency(message)
        },
        confidence_score: 0.6,
        source: 'conversation',
        created_at: new Date().toISOString()
      });
    }

    return insights;
  }

  /**
   * Analyze communication patterns
   */
  private analyzeCommunicationPatterns(message: string, agent: Agent): LearningInsight[] {
    const insights: LearningInsight[] = [];

    const pattern = {
      message_length: message.length,
      question_count: (message.match(/\?/g) || []).length,
      urgency_indicators: this.detectUrgencyIndicators(message),
      technical_level: this.assessTechnicalLevel(message),
      decision_making_style: this.assessDecisionMakingStyle(message)
    };

    insights.push({
      user_id: this.userId,
      insight_type: 'pattern',
      insight_data: {
        communication_pattern: pattern,
        preferred_agent_type: agent.type,
        interaction_complexity: this.calculateComplexity(message)
      },
      confidence_score: 0.8,
      source: 'conversation',
      created_at: new Date().toISOString()
    });

    return insights;
  }

  /**
   * Progressive profiling through contextual questions
   */
  async generateContextualQuestions(conversationHistory: string[]): Promise<string[]> {
    const questions: string[] = [];
    
    // Get existing insights to avoid redundant questions
    const existingInsights = await this.getExistingInsights();
    
    // Generate questions based on missing baseline data
    if (!this.hasInsightType(existingInsights, 'goal')) {
      questions.push("What are your main business objectives for this quarter?");
    }

    if (!this.hasInsightType(existingInsights, 'challenge')) {
      questions.push("What's the biggest challenge your team is facing right now?");
    }

    // Context-specific questions based on conversation topics
    const recentTopics = this.extractTopicsFromHistory(conversationHistory);
    
    if (recentTopics.includes('sales') && !this.hasSpecificInsight(existingInsights, 'sales_targets')) {
      questions.push("What are your sales targets for this period?");
    }

    if (recentTopics.includes('marketing') && !this.hasSpecificInsight(existingInsights, 'marketing_goals')) {
      questions.push("What metrics do you use to measure marketing success?");
    }

    return questions.slice(0, 2); // Limit to avoid overwhelming
  }

  /**
   * Calculate company health score
   */
  async calculateCompanyHealthScore(): Promise<CompanyHealthMetric[]> {
    const healthMetrics: CompanyHealthMetric[] = [];

    // Financial health (from existing financial data)
    const financialHealth = await this.calculateFinancialHealth();
    healthMetrics.push(financialHealth);

    // Operational efficiency
    const operationalHealth = await this.calculateOperationalHealth();
    healthMetrics.push(operationalHealth);

    // Team engagement (from activity patterns)
    const teamHealth = await this.calculateTeamHealth();
    healthMetrics.push(teamHealth);

    return healthMetrics;
  }

  /**
   * Store learning insights in the database
   */
  private async storeInsights(insights: LearningInsight[]): Promise<void> {
    if (insights.length === 0) return;

    const { data, error } = await supabase
      .from('learning_insights')
      .insert(insights.map(i => ({ ...i, company_id: this.companyId })));

    if (error) {
      console.error('Error storing learning insights:', error);
      throw error;
    }

    const insertedData = data as LearningInsight[] | null;
    if (insertedData) {
      console.log(`Stored ${insertedData.length} new learning insights.`);
    }
  }

  /**
   * Fetch existing insights from the database
   */
  private async getExistingInsights(): Promise<LearningInsight[]> {
    const { data, error } = await supabase
      .from('learning_insights')
      .select('*')
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching existing insights:', error);
      return [];
    }

    return data as LearningInsight[];
  }

  // Helper methods
  private assessExpertiseLevel(message: string): 'beginner' | 'intermediate' | 'advanced' {
    const technicalTerms = ['ROI', 'CAC', 'LTV', 'EBITDA', 'KPI', 'OKR', 'ROAS'];
    const termCount = technicalTerms.filter(term => message.includes(term)).length;
    
    if (termCount >= 3) return 'advanced';
    if (termCount >= 1) return 'intermediate';
    return 'beginner';
  }

  private categorizeGoal(message: string): string {
    const messageLower = message.toLowerCase();
    if (messageLower.includes('revenue') || messageLower.includes('sales') || messageLower.includes('profit')) {
      return 'revenue';
    }
    if (messageLower.includes('efficiency') || messageLower.includes('optimize') || messageLower.includes('streamline')) {
      return 'efficiency';
    }
    if (messageLower.includes('grow') || messageLower.includes('expand') || messageLower.includes('scale')) {
      return 'growth';
    }
    return 'general';
  }

  private categorizeChallenge(message: string): string {
    const messageLower = message.toLowerCase();
    if (messageLower.includes('cost') || messageLower.includes('budget') || messageLower.includes('cash')) {
      return 'financial';
    }
    if (messageLower.includes('process') || messageLower.includes('workflow') || messageLower.includes('efficiency')) {
      return 'operational';
    }
    if (messageLower.includes('staff') || messageLower.includes('hiring') || messageLower.includes('retention')) {
      return 'human_resources';
    }
    return 'general';
  }

  private assessUrgency(message: string): 'high' | 'medium' | 'low' {
    const urgentKeywords = ['urgent', 'immediately', 'asap', 'critical', 'emergency'];
    const hasUrgentKeywords = urgentKeywords.some(keyword => message.toLowerCase().includes(keyword));
    return hasUrgentKeywords ? 'high' : 'medium';
  }

  private detectUrgencyIndicators(message: string): string[] {
    const indicators = [];
    const messageLower = message.toLowerCase();
    
    if (messageLower.includes('urgent') || messageLower.includes('asap')) {
      indicators.push('time_pressure');
    }
    if (messageLower.includes('!')) {
      indicators.push('exclamation_usage');
    }
    if (messageLower.includes('need') && messageLower.includes('now')) {
      indicators.push('immediate_need');
    }
    
    return indicators;
  }

  private assessTechnicalLevel(message: string): 'basic' | 'intermediate' | 'advanced' {
    const expertise = this.assessExpertiseLevel(message);
    return expertise === 'beginner' ? 'basic' : expertise;
  }

  private assessDecisionMakingStyle(message: string): 'analytical' | 'intuitive' | 'collaborative' {
    const messageLower = message.toLowerCase();
    
    if (messageLower.includes('data') || messageLower.includes('analysis') || messageLower.includes('metrics')) {
      return 'analytical';
    }
    if (messageLower.includes('team') || messageLower.includes('discuss') || messageLower.includes('feedback')) {
      return 'collaborative';
    }
    return 'intuitive';
  }

  private calculateComplexity(message: string): 'low' | 'medium' | 'high' {
    const wordCount = message.split(' ').length;
    const questionCount = (message.match(/\?/g) || []).length;
    
    if (wordCount > 100 || questionCount > 3) return 'high';
    if (wordCount > 50 || questionCount > 1) return 'medium';
    return 'low';
  }

  private hasInsightType(insights: LearningInsight[], type: string): boolean {
    if (!insights || insights.length === 0) return false;
    return insights.some(i => i.insight_type === type);
  }

  private hasSpecificInsight(insights: LearningInsight[], specificType: string): boolean {
    if (!insights) return false;
    return insights.some(i => {
      if (i.insight_data && typeof i.insight_data === 'object') {
        return Object.keys(i.insight_data).includes(specificType);
      }
      return false;
    });
  }

  private extractTopicsFromHistory(history: string[]): string[] {
    const topics: Set<string> = new Set();
    const topicKeywords = {
      sales: ['sales', 'revenue', 'deals', 'pipeline', 'quota'],
      marketing: ['marketing', 'campaigns', 'leads', 'conversion', 'brand'],
      finance: ['finance', 'budget', 'cost', 'profit', 'cash'],
      operations: ['operations', 'process', 'workflow', 'efficiency', 'project']
    };

    history.forEach(message => {
      const messageLower = message.toLowerCase();
      Object.entries(topicKeywords).forEach(([topic, keywords]) => {
        if (keywords.some(keyword => messageLower.includes(keyword))) {
          topics.add(topic);
        }
      });
    });

    return Array.from(topics);
  }

  private extractContext(message: string): string {
    // Extract the sentence or phrase that provides context
    const sentences = message.split(/[.!?]+/);
    return sentences[0] || message.substring(0, 100);
  }

  private async calculateFinancialHealth(): Promise<CompanyHealthMetric> {
    // This would integrate with actual financial data
    return {
      metric_name: 'Financial Health',
      current_score: 75,
      benchmark_score: 70,
      trend: 'improving',
      last_updated: new Date().toISOString(),
      contributing_factors: ['Positive cash flow', 'Growing revenue', 'Controlled expenses']
    };
  }

  private async calculateOperationalHealth(): Promise<CompanyHealthMetric> {
    // This would analyze project completion rates, support ticket resolution, etc.
    return {
      metric_name: 'Operational Efficiency',
      current_score: 68,
      benchmark_score: 72,
      trend: 'stable',
      last_updated: new Date().toISOString(),
      contributing_factors: ['Good project delivery', 'Room for process improvement']
    };
  }

  private async calculateTeamHealth(): Promise<CompanyHealthMetric> {
    // This would analyze user activity, engagement patterns, etc.
    return {
      metric_name: 'Team Engagement',
      current_score: 82,
      benchmark_score: 75,
      trend: 'improving',
      last_updated: new Date().toISOString(),
      contributing_factors: ['High platform usage', 'Active collaboration']
    };
  }
}

/**
 * Service for managing progressive learning across the platform
 */
export const progressiveLearningService = {
  /**
   * Initialize learning for a user session
   */
  async initializeLearning(userId: string, companyId: string): Promise<ProgressiveLearning> {
    return new ProgressiveLearning(userId, companyId);
  },

  /**
   * Analyze conversation and extract insights
   */
  async analyzeUserInteraction(
    userId: string,
    companyId: string,
    userMessage: string,
    aiResponse: string,
    agent: Agent,
    feedback?: 'helpful' | 'unhelpful' | 'partially_helpful'
  ): Promise<LearningInsight[]> {
    const learning = new ProgressiveLearning(userId, companyId);
    return learning.analyzeConversation(userMessage, aiResponse, agent, feedback);
  },

  /**
   * Get contextual questions to enhance user profiling
   */
  async getContextualQuestions(
    userId: string,
    companyId: string,
    conversationHistory: string[]
  ): Promise<string[]> {
    const learning = new ProgressiveLearning(userId, companyId);
    return learning.generateContextualQuestions(conversationHistory);
  },

  /**
   * Calculate and update company health scores
   */
  async updateCompanyHealth(companyId: string): Promise<CompanyHealthMetric[]> {
    const learning = new ProgressiveLearning('system', companyId);
    return learning.calculateCompanyHealthScore();
  }
}; 