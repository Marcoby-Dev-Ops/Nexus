import { FireCycleAgent, type AgentResponse } from './fireCycleAgent';
import { FireCyclePlaybooks, type PlaybookRecommendation } from './fireCyclePlaybooks';
import type { UserContext } from './fireCycleLogic';

// Type for FIRE phase IDs
type FireCyclePhaseId = 'focus' | 'insight' | 'roadmap' | 'execute';

export interface ExecutiveAssistantResponse {
  id: string;
  type: 'coaching' | 'analysis' | 'recommendation' | 'action' | 'insight';
  title: string;
  message: string;
  confidence: number;
  firePhase: FireCyclePhaseId;
  context: string;
  suggestions: ExecutiveSuggestion[];
  playbook?: PlaybookRecommendation;
  dataInsights?: DataInsight[];
  nextSteps: NextStep[];
}

export interface ExecutiveSuggestion {
  id: string;
  type: 'question' | 'action' | 'analysis' | 'playbook' | 'automation';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedEffort: number;
  impact: 'low' | 'medium' | 'high' | 'transformational';
  canAutomate: boolean;
}

export interface DataInsight {
  id: string;
  category: 'performance' | 'trend' | 'anomaly' | 'opportunity' | 'risk';
  title: string;
  description: string;
  data: any;
  confidence: number;
  actionable: boolean;
}

export interface NextStep {
  id: string;
  title: string;
  description: string;
  firePhase: FireCyclePhaseId;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedTime: number;
  dependencies: string[];
  resources: string[];
}

export interface CoachingSession {
  id: string;
  timestamp: Date;
  userInput: string;
  assistantResponse: ExecutiveAssistantResponse;
  followUpQuestions: string[];
  sessionNotes: string;
  actionItems: string[];
  nextSessionDate?: Date;
}

export class ExecutiveAssistant {
  private fireCycleAgent: FireCycleAgent;
  private playbooks: FireCyclePlaybooks;
  private userContext: UserContext;
  private sessionHistory: CoachingSession[] = [];

  constructor(userContext: UserContext) {
    this.userContext = userContext;
    this.fireCycleAgent = new FireCycleAgent(userContext);
    this.playbooks = new FireCyclePlaybooks();
  }

  /**
   * Main Executive Assistant function - provides business coaching with FIRE intelligence
   */
  async provideCoaching(input: string): Promise<ExecutiveAssistantResponse> {
    // Process through FIRE cycle analysis
    const fireResponse = await this.fireCycleAgent.processInput(input);
    
    // Get relevant playbooks
    const playbookRecommendations = await this.playbooks.recommendPlaybook(
      this.userContext,
      fireResponse.firePhase as FireCyclePhaseId,
      this.extractProblemFromInput(input)
    );

    // Analyze user data for insights
    const dataInsights = this.analyzeUserData();
    
    // Generate coaching response
    const response = this.generateCoachingResponse(fireResponse, playbookRecommendations, dataInsights);
    
    // Store session
    this.storeCoachingSession(input, response);
    
    return response;
  }

  /**
   * Generate contextual coaching response
   */
  private generateCoachingResponse(
    fireResponse: AgentResponse,
    playbookRecommendations: PlaybookRecommendation[],
    dataInsights: DataInsight[]
  ): ExecutiveAssistantResponse {
    const { firePhase, confidence } = fireResponse;
    
    let type: 'coaching' | 'analysis' | 'recommendation' | 'action' | 'insight';
    let title: string;
    let message: string;

    // Determine response type based on FIRE phase and context
    switch (firePhase) {
      case 'focus':
        type = 'coaching';
        title = 'Goal Clarification & Strategy';
        message = this.generateFocusCoaching(fireResponse, dataInsights);
        break;
      case 'insight':
        type = 'analysis';
        title = 'Data Analysis & Insights';
        message = this.generateInsightAnalysis(fireResponse, dataInsights);
        break;
      case 'roadmap':
        type = 'recommendation';
        title = 'Strategic Planning & Roadmap';
        message = this.generateRoadmapRecommendation(fireResponse, playbookRecommendations);
        break;
      case 'execute':
        type = 'action';
        title = 'Action Planning & Execution';
        message = this.generateExecuteAction(fireResponse, playbookRecommendations);
        break;
      default: type = 'coaching';
        title = 'Business Coaching';
        message = this.generateGeneralCoaching(fireResponse);
    }

    const suggestions = this.generateExecutiveSuggestions(fireResponse, playbookRecommendations);
    const nextSteps = this.generateNextSteps(fireResponse, playbookRecommendations);
    const playbook = playbookRecommendations.length > 0 ? playbookRecommendations[0] : undefined;

    return {
      id: this.generateId(),
      type,
      title,
      message,
      confidence,
      firePhase: fireResponse.firePhase as FireCyclePhaseId,
      context: this.generateContext(fireResponse),
      suggestions,
      playbook,
      dataInsights,
      nextSteps
    };
  }

  /**
   * Generate Focus phase coaching
   */
  private generateFocusCoaching(fireResponse: AgentResponse, dataInsights: DataInsight[]): string {
    const { input } = fireResponse;
    const goals = input.entities.filter(e => e.type === 'goal');
    const challenges = input.entities.filter(e => e.type === 'challenge');

    let message = `🎯 **Executive Coaching: Goal Clarification**\n\n`;

    if (goals.length > 0) {
      message += `I see you're focusing on: **"${goals[0].value}"**\n\n`;
      message += `**Strategic Questions to Consider:**\n`;
      message += `• What's the business impact of achieving this goal?\n`;
      message += `• How does this align with your broader company objectives?\n`;
      message += `• What resources and capabilities do you need?\n`;
      message += `• How will you measure success?\n\n`;
    }

    if (challenges.length > 0) {
      message += `**Challenge Analysis: ** "${challenges[0].value}"\n\n`;
      message += `**Root Cause Questions:**\n`;
      message += `• What's the underlying business issue here?\n`;
      message += `• What patterns have you noticed?\n`;
      message += `• What's the cost of not addressing this?\n\n`;
    }

    // Add data-driven insights
    if (dataInsights.length > 0) {
      message += `**Data-Driven Context: **\n`;
      dataInsights.forEach(insight => {
        message += `• ${insight.title}: ${insight.description}\n`;
      });
      message += `\n`;
    }

    message += `**Next Steps: **\n`;
    message += `• Define clear success metrics\n`;
    message += `• Identify key stakeholders\n`;
    message += `• Assess resource requirements\n`;

    return message;
  }

  /**
   * Generate Insight phase analysis
   */
  private generateInsightAnalysis(fireResponse: AgentResponse, dataInsights: DataInsight[]): string {
    const { input } = fireResponse;
    const metrics = input.entities.filter(e => e.type === 'metric');

    let message = `📊 **Executive Analysis: Data Insights**\n\n`;

    if (metrics.length > 0) {
      message += `**Key Metric: ** ${metrics[0].value}\n\n`;
      message += `**Strategic Implications:**\n`;
      message += `• What does this tell us about market trends?\n`;
      message += `• How does this impact our competitive position?\n`;
      message += `• What opportunities does this reveal?\n\n`;
    }

    if (dataInsights.length > 0) {
      message += `**Executive Insights: **\n`;
      dataInsights.forEach(insight => {
        message += `• **${insight.category.toUpperCase()}**: ${insight.title}\n`;
        message += `  ${insight.description}\n\n`;
      });
    }

    message += `**Strategic Questions: **\n`;
    message += `• What patterns are emerging?\n`;
    message += `• How can we capitalize on these insights?\n`;
    message += `• What risks should we monitor?\n`;

    return message;
  }

  /**
   * Generate Roadmap phase recommendation
   */
  private generateRoadmapRecommendation(
    fireResponse: AgentResponse, 
    playbookRecommendations: PlaybookRecommendation[]
  ): string {
    let message = `🗺️ **Executive Strategy: Roadmap Development**\n\n`;

    if (playbookRecommendations.length > 0) {
      const playbook = playbookRecommendations[0];
      message += `**Recommended Strategic Approach: ** ${playbook.playbook.name}\n\n`;
      message += `**Strategic Framework:**\n`;
      message += `• **Focus**: ${playbook.playbook.focus}\n`;
      message += `• **Insight**: ${playbook.playbook.insight}\n`;
      message += `• **Roadmap**: ${playbook.playbook.roadmap.length} strategic steps\n`;
      message += `• **Execute**: ${playbook.playbook.execute.length} tactical actions\n\n`;
    }

    message += `**Strategic Planning Questions:**\n`;
    message += `• What are the key milestones and timelines?\n`;
    message += `• What resources and capabilities do we need?\n`;
    message += `• How do we measure progress and success?\n`;
    message += `• What are the potential risks and mitigation strategies?\n\n`;

    message += `**Execution Framework:**\n`;
    message += `• Break down into manageable phases\n`;
    message += `• Assign clear ownership and accountability\n`;
    message += `• Establish regular review and adjustment cycles\n`;

    return message;
  }

  /**
   * Generate Execute phase action planning
   */
  private generateExecuteAction(
    fireResponse: AgentResponse, 
    playbookRecommendations: PlaybookRecommendation[]
  ): string {
    let message = `⚡ **Executive Action: Implementation Planning**\n\n`;

    if (playbookRecommendations.length > 0) {
      const playbook = playbookRecommendations[0];
      message += `**Strategic Implementation: ** ${playbook.playbook.name}\n\n`;
      
      message += `**Immediate Actions:**\n`;
      playbook.playbook.execute.forEach((action, index) => {
        message += `${index + 1}. **${action.title}** (${action.estimatedEffort} min)\n`;
        message += `   ${action.description}\n`;
        if (action.canAutomate) {
          message += `   🔄 *Can be automated*\n`;
        }
        message += `\n`;
      });
    }

    message += `**Execution Best Practices: **\n`;
    message += `• Start with high-impact, low-effort actions\n`;
    message += `• Establish clear success metrics\n`;
    message += `• Regular progress reviews and adjustments\n`;
    message += `• Celebrate wins and learn from setbacks\n`;

    return message;
  }

  /**
   * Generate general coaching response
   */
  private generateGeneralCoaching(fireResponse: AgentResponse): string {
    return `🤝 **Executive Coaching Session**\n\n` +
           `I'm here to help you think strategically about your business challenges and opportunities.\n\n` +
           `**How can I support you today?**\n` +
           `• Strategic planning and goal setting\n` +
           `• Data analysis and insights\n` +
           `• Problem-solving and decision-making\n` +
           `• Performance optimization\n` +
           `• Team and process improvement\n`;
  }

  /**
   * Generate executive-level suggestions
   */
  private generateExecutiveSuggestions(
    fireResponse: AgentResponse,
    playbookRecommendations: PlaybookRecommendation[]
  ): ExecutiveSuggestion[] {
    const suggestions: ExecutiveSuggestion[] = [];

    // Add strategic questions
    suggestions.push({
      id: 'strategic-question',
      type: 'question',
      title: 'Strategic Deep Dive',
      description: 'Explore the broader business implications of this challenge',
      priority: 'high',
      estimatedEffort: 30,
      impact: 'high',
      canAutomate: false
    });

    // Add data analysis
    suggestions.push({
      id: 'data-analysis',
      type: 'analysis',
      title: 'Performance Analysis',
      description: 'Analyze key metrics and trends for strategic insights',
      priority: 'medium',
      estimatedEffort: 45,
      impact: 'medium',
      canAutomate: true
    });

    // Add playbook if available
    if (playbookRecommendations.length > 0) {
      const playbook = playbookRecommendations[0];
      suggestions.push({
        id: 'playbook-action',
        type: 'playbook',
        title: `Follow ${playbook.playbook.name}`,
        description: `Execute the recommended strategic approach`,
        priority: 'high',
        estimatedEffort: playbook.playbook.estimatedTime,
        impact: 'high',
        canAutomate: false
      });
    }

    // Add automation opportunities
    suggestions.push({
      id: 'automation',
      type: 'automation',
      title: 'Process Automation',
      description: 'Identify and automate repetitive tasks',
      priority: 'medium',
      estimatedEffort: 60,
      impact: 'medium',
      canAutomate: true
    });

    return suggestions;
  }

  /**
   * Generate strategic next steps
   */
  private generateNextSteps(
    fireResponse: AgentResponse,
    playbookRecommendations: PlaybookRecommendation[]
  ): NextStep[] {
    const nextSteps: NextStep[] = [];

    // Add immediate next step
    nextSteps.push({
      id: 'immediate-action',
      title: 'Define Success Metrics',
      description: 'Establish clear, measurable success criteria',
      firePhase: 'focus' as FireCyclePhaseId,
      priority: 'high',
      estimatedTime: 30,
      dependencies: [],
      resources: ['Success Metrics Template', 'KPI Framework']
    });

    // Add strategic planning step
    nextSteps.push({
      id: 'strategic-planning',
      title: 'Develop Action Plan',
      description: 'Create detailed implementation roadmap',
      firePhase: 'roadmap' as FireCyclePhaseId,
      priority: 'high',
      estimatedTime: 60,
      dependencies: ['immediate-action'],
      resources: ['Strategic Planning Template', 'Project Management Tools']
    });

    // Add execution step
    nextSteps.push({
      id: 'execution',
      title: 'Begin Implementation',
      description: 'Start executing the highest-priority actions',
      firePhase: 'execute' as FireCyclePhaseId,
      priority: 'critical',
      estimatedTime: 120,
      dependencies: ['strategic-planning'],
      resources: ['Implementation Checklist', 'Progress Tracking Tools']
    });

    return nextSteps;
  }

  /**
   * Analyze user data for insights
   */
  private analyzeUserData(): DataInsight[] {
    const insights: DataInsight[] = [];

    // Analyze metrics
    if (this.userContext.metrics.length > 0) {
      const avgMetric = this.userContext.metrics.reduce((sum, m) => sum + m.value, 0) / this.userContext.metrics.length;
      
      insights.push({
        id: 'performance-insight',
        category: 'performance',
        title: 'Performance Overview',
        description: `Average metric performance: ${avgMetric.toLocaleString()}`,
        data: { average: avgMetric, metrics: this.userContext.metrics },
        confidence: 0.8,
        actionable: true
      });
    }

    // Analyze projects
    if (this.userContext.currentProjects.length > 0) {
      const activeProjects = this.userContext.currentProjects.filter(p => p.status === 'active');
      
      insights.push({
        id: 'project-insight',
        category: 'trend',
        title: 'Project Portfolio',
        description: `${activeProjects.length} active projects with average ${activeProjects.reduce((sum, p) => sum + p.progress, 0) / activeProjects.length}% completion`,
        data: { activeProjects, totalProjects: this.userContext.currentProjects.length },
        confidence: 0.7,
        actionable: true
      });
    }

    // Analyze challenges
    if (this.userContext.challenges.length > 0) {
      insights.push({
        id: 'challenge-insight',
        category: 'risk',
        title: 'Challenge Areas',
        description: `${this.userContext.challenges.length} identified challenges requiring attention`,
        data: { challenges: this.userContext.challenges },
        confidence: 0.6,
        actionable: true
      });
    }

    return insights;
  }

  /**
   * Extract problem from input
   */
  private extractProblemFromInput(input: string): string | undefined {
    const problemKeywords = ['problem', 'issue', 'challenge', 'struggling', 'difficulty', 'blocker'];
    const lowerInput = input.toLowerCase();
    
    for (const keyword of problemKeywords) {
      if (lowerInput.includes(keyword)) {
        return input;
      }
    }
    
    return undefined;
  }

  /**
   * Generate context for response
   */
  private generateContext(fireResponse: AgentResponse): string {
    return `Based on your role as ${this.userContext.role} in ${this.userContext.department}, ` +
           `I'm analyzing this in the context of your ${this.userContext.industry} industry ` +
           `and ${this.userContext.companySize} company size.`;
  }

  /**
   * Store coaching session
   */
  private storeCoachingSession(input: string, response: ExecutiveAssistantResponse): void {
    const session: CoachingSession = {
      id: this.generateId(),
      timestamp: new Date(),
      userInput: input,
      assistantResponse: response,
      followUpQuestions: this.generateFollowUpQuestions(response),
      sessionNotes: this.generateSessionNotes(response),
      actionItems: response.nextSteps.map(step => step.title)
    };

    this.sessionHistory.push(session);
  }

  /**
   * Generate follow-up questions
   */
  private generateFollowUpQuestions(response: ExecutiveAssistantResponse): string[] {
    const questions: string[] = [];
    
    switch (response.type) {
      case 'coaching':
        questions.push('What specific outcomes are you looking to achieve?');
        questions.push('What resources or support do you need?');
        break;
      case 'analysis':
        questions.push('How do these insights align with your goals?');
        questions.push('What actions should we prioritize based on this data?');
        break;
      case 'recommendation':
        questions.push('Does this strategic approach align with your vision?');
        questions.push('What adjustments would make this more actionable?');
        break;
      case 'action':
        questions.push('What\'s your timeline for implementing these actions?');
        questions.push('Who else needs to be involved in execution?');
        break;
    }

    return questions;
  }

  /**
   * Generate session notes
   */
  private generateSessionNotes(response: ExecutiveAssistantResponse): string {
    return `Session focused on ${response.type} in ${response.firePhase} phase. ` +
           `Key insights: ${response.dataInsights?.length || 0} data points analyzed. ` +
           `Next steps: ${response.nextSteps.length} actions identified.`;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get coaching history
   */
  getCoachingHistory(): CoachingSession[] {
    return this.sessionHistory;
  }

  /**
   * Get session by ID
   */
  getSession(id: string): CoachingSession | undefined {
    return this.sessionHistory.find(session => session.id === id);
  }

  /**
   * Get executive insights
   */
  getExecutiveInsights(): DataInsight[] {
    return this.analyzeUserData();
  }
}

// Hook for easy executive assistant integration
export const useExecutiveAssistant = (userContext: UserContext) => {
  const assistant = new ExecutiveAssistant(userContext);
  
  return {
    provideCoaching: (input: string) => assistant.provideCoaching(input),
    getCoachingHistory: () => assistant.getCoachingHistory(),
    getSession: (id: string) => assistant.getSession(id),
    getExecutiveInsights: () => assistant.getExecutiveInsights()
  };
}; 
