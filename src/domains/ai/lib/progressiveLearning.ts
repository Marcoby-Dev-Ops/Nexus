/**
 * progressiveLearning.ts
 * 
 * Progressive learning system for building comprehensive user and company intelligence
 * through conversation analysis, behavioral patterns, and contextual data collection.
 */

import { supabase } from '@/core/supabase';
import type { Agent } from '@/domains/ai/lib/agentRegistry';

export interface BusinessGoals {
  id: string;
  goal: string;
  category: 'revenue' | 'efficiency' | 'growth' | 'innovation' | 'retention';
  priority: 'high' | 'medium' | 'low';
  targetdate: string;
  successmetrics: string[];
  currentprogress: number; // 0-100
}

export interface CurrentChallenges {
  id: string;
  challenge: string;
  category: 'operational' | 'financial' | 'technical' | 'market' | 'human_resources';
  severity: 'critical' | 'high' | 'medium' | 'low';
  impactareas: string[];
  potentialsolutions: string[];
}

export interface LearningInsight {
  userid: string;
  insighttype: 'preference' | 'pattern' | 'goal' | 'challenge' | 'skill_gap';
  insightdata: Record<string, unknown>;
  confidencescore: number; // 0-1
  source: 'conversation' | 'behavior' | 'feedback' | 'integration';
  createdat: string;
}

export interface CompanyHealthMetric {
  metricname: string;
  currentscore: number; // 0-100
  benchmarkscore: number;
  trend: 'improving' | 'stable' | 'declining';
  lastupdated: string;
  contributingfactors: string[];
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
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
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
        userid: this.userId,
        insighttype: 'preference',
        insightdata: {
          communicationstyle: 'detailed',
          preferscomprehensive_analysis: true
        },
        confidencescore: 0.7,
        source: 'conversation',
        createdat: new Date().toISOString()
      });
    }

    if (messageLower.includes('quick') || messageLower.includes('summary') || messageLower.includes('brief')) {
      insights.push({
        userid: this.userId,
        insighttype: 'preference',
        insightdata: {
          communicationstyle: 'concise',
          prefersquick_summaries: true
        },
        confidencescore: 0.7,
        source: 'conversation',
        createdat: new Date().toISOString()
      });
    }

    // Department/topic preferences
    if (agent.department) {
      insights.push({
        userid: this.userId,
        insighttype: 'preference',
        insightdata: {
          frequentlyaccesseddepartment: agent.department,
          departmentexpertise_level: this.assessExpertiseLevel(message)
        },
        confidencescore: 0.6,
        source: 'conversation',
        createdat: new Date().toISOString()
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
        userid: this.userId,
        insighttype: 'goal',
        insightdata: {
          potentialgoal: message.substring(0, 200),
          goalcategory: this.categorizeGoal(message),
          mentionedin_context: this.extractContext(message)
        },
        confidencescore: 0.6,
        source: 'conversation',
        createdat: new Date().toISOString()
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
        userid: this.userId,
        insighttype: 'challenge',
        insightdata: {
          potentialchallenge: message.substring(0, 200),
          challengecategory: this.categorizeChallenge(message),
          urgencylevel: this.assessUrgency(message)
        },
        confidencescore: 0.6,
        source: 'conversation',
        createdat: new Date().toISOString()
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
      messagelength: message.length,
      questioncount: (message.match(/\?/g) || []).length,
      urgencyindicators: this.detectUrgencyIndicators(message),
      technicallevel: this.assessTechnicalLevel(message),
      decisionmaking_style: this.assessDecisionMakingStyle(message)
    };

    insights.push({
      userid: this.userId,
      insighttype: 'pattern',
      insightdata: {
        communicationpattern: pattern,
        preferredagent_type: agent.type,
        interactioncomplexity: this.calculateComplexity(message)
      },
      confidencescore: 0.8,
      source: 'conversation',
      createdat: new Date().toISOString()
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
      .insert(insights.map(i => ({ ...i, companyid: this.companyId })));

    if (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error storing learning insights: ', error);
      throw error;
    }

    const insertedData = data as LearningInsight[] | null;
    if (insertedData) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
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
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error fetching existing insights: ', error);
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
      metricname: 'Financial Health',
      currentscore: 75,
      benchmarkscore: 70,
      trend: 'improving',
      lastupdated: new Date().toISOString(),
      contributingfactors: ['Positive cash flow', 'Growing revenue', 'Controlled expenses']
    };
  }

  private async calculateOperationalHealth(): Promise<CompanyHealthMetric> {
    // This would analyze project completion rates, support ticket resolution, etc.
    return {
      metricname: 'Operational Efficiency',
      currentscore: 68,
      benchmarkscore: 72,
      trend: 'stable',
      lastupdated: new Date().toISOString(),
      contributingfactors: ['Good project delivery', 'Room for process improvement']
    };
  }

  private async calculateTeamHealth(): Promise<CompanyHealthMetric> {
    // This would analyze user activity, engagement patterns, etc.
    return {
      metricname: 'Team Engagement',
      currentscore: 82,
      benchmarkscore: 75,
      trend: 'improving',
      lastupdated: new Date().toISOString(),
      contributingfactors: ['High platform usage', 'Active collaboration']
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