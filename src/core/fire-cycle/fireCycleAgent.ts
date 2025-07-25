import { FireCycleProcessor, type ProcessedInput, type NextAction } from './fireCycleProcessor';
import type { UserContext } from './fireCycleLogic';
import type { FireCyclePhase } from '@/types/business/fire-cycle';

export interface AgentResponse {
  id: string;
  input: ProcessedInput;
  response: string;
  suggestions: AgentSuggestion[];
  firePhase: FireCyclePhase;
  confidence: number;
  reasoning: string;
}

export interface AgentSuggestion {
  id: string;
  type: 'action' | 'question' | 'insight' | 'recommendation';
  title: string;
  description: string;
  firePhase: FireCyclePhase;
  priority: 'low' | 'medium' | 'high' | 'critical';
  action?: () => void;
}

export class FireCycleAgent {
  private processor: FireCycleProcessor;
  private userContext: UserContext;

  constructor(userContext: UserContext) {
    this.userContext = userContext;
    this.processor = new FireCycleProcessor(userContext);
  }

  /**
   * Main agent function - processes user input and provides intelligent response
   */
  async processInput(input: string): Promise<AgentResponse> {
    // Process the input through FIRE cycle analysis
    const processedInput = await this.processor.processUserInput(input);
    
    // Generate intelligent response
    const response = this.generateResponse(processedInput);
    
    // Generate contextual suggestions
    const suggestions = this.generateSuggestions(processedInput);
    
    return {
      id: this.generateId(),
      input: processedInput,
      response,
      suggestions,
      firePhase: processedInput.firePhase,
      confidence: processedInput.confidence,
      reasoning: processedInput.reasoning
    };
  }

  /**
   * Generate intelligent response based on processed input
   */
  private generateResponse(processedInput: ProcessedInput): string {
    const { firePhase, isNewItem, contextMatch, entities, sentiment } = processedInput;
    
    let response = '';
    
    // Phase-specific responses
    switch (firePhase.id) {
      case 'focus':
        if (isNewItem) {
          response = this.generateFocusResponse(entities, sentiment);
        } else {
          response = this.generateFocusUpdateResponse(contextMatch!);
        }
        break;
        
      case 'insight':
        if (isNewItem) {
          response = this.generateInsightResponse(entities, sentiment);
        } else {
          response = this.generateInsightUpdateResponse(contextMatch!);
        }
        break;
        
      case 'roadmap':
        if (isNewItem) {
          response = this.generateRoadmapResponse(entities, sentiment);
        } else {
          response = this.generateRoadmapUpdateResponse(contextMatch!);
        }
        break;
        
      case 'execute':
        if (isNewItem) {
          response = this.generateExecuteResponse(entities, sentiment);
        } else {
          response = this.generateExecuteUpdateResponse(contextMatch!);
        }
        break;
    }
    
    // Add confidence indicator
    if (processedInput.confidence < 0.7) {
      response += `\n\n*Note: I'm ${Math.round(processedInput.confidence * 100)}% confident in this analysis. You may want to clarify or provide more context.*`;
    }
    
    return response;
  }

  /**
   * Generate Focus phase responses
   */
  private generateFocusResponse(entities: any[], sentiment: any): string {
    const goals = entities.filter(e => e.type === 'goal');
    const challenges = entities.filter(e => e.type === 'challenge');
    
    if (goals.length > 0) {
      return `🎯 **New Focus Detected**: "${goals[0].value}"\n\nThis looks like a new goal or objective. Would you like to: \n• Set this as your primary focus?\n• Break it down into smaller objectives?\n• Link it to existing projects?`;
    }
    
    if (challenges.length > 0) {
      return `⚠️ **Challenge Identified**: "${challenges[0].value}"\n\nI've detected a challenge or blocker. Let's address this by: \n• Understanding the root cause\n• Exploring potential solutions\n• Creating an action plan`;
    }
    
    return `🎯 **Focus Area Detected**\n\nI've identified this as a focus area. Let's clarify:\n• What's your main objective here?\n• What's the most important outcome you want?\n• What's blocking your progress?`;
  }

  /**
   * Generate Insight phase responses
   */
  private generateInsightResponse(entities: any[], sentiment: any): string {
    const metrics = entities.filter(e => e.type === 'metric');
    
    if (metrics.length > 0) {
      return `📊 **Data Insight**: "${metrics[0].value}"\n\nThis looks like a new data point or trend. Let's analyze: \n• What does this metric tell us?\n• What patterns are you seeing?\n• How does this impact your goals?`;
    }
    
    if (sentiment.label === 'positive') {
      return `💡 **Positive Insight Detected**\n\nYou've discovered something valuable! Let's capture this insight: \n• What did you learn?\n• How can we apply this knowledge?\n• What opportunities does this create?`;
    }
    
    return `💡 **New Insight Captured**\n\nI've identified this as a learning or discovery. Let's explore:\n• What patterns are you noticing?\n• What does this tell us about your situation?\n• How can we use this information?`;
  }

  /**
   * Generate Roadmap phase responses
   */
  private generateRoadmapResponse(entities: any[], sentiment: any): string {
    const projects = entities.filter(e => e.type === 'project');
    
    if (projects.length > 0) {
      return `🗺️ **New Project Plan**: "${projects[0].value}"\n\nThis looks like a new project or initiative. Let's create a roadmap: \n• What are the key milestones?\n• What resources do you need?\n• What's the timeline?`;
    }
    
    return `🗺️ **Planning Mode Detected**\n\nI see you're in planning mode. Let's build a roadmap:\n• What's the end goal?\n• What are the key steps?\n• What's the timeline and priority?`;
  }

  /**
   * Generate Execute phase responses
   */
  private generateExecuteResponse(entities: any[], sentiment: any): string {
    const tasks = entities.filter(e => e.type === 'task');
    
    if (tasks.length > 0) {
      return `⚡ **Action Item**: "${tasks[0].value}"\n\nThis looks like an action or task. Let's execute: \n• What's the first step?\n• What resources do you need?\n• How will you track progress?`;
    }
    
    return `⚡ **Execution Mode Detected**\n\nI see you're ready to take action. Let's get started:\n• What's the immediate next step?\n• What's your timeline?\n• How will you measure success?`;
  }

  /**
   * Generate update responses for existing items
   */
  private generateFocusUpdateResponse(contextMatch: any): string {
    return `🎯 **Updating Focus**: "${contextMatch.name}"\n\nI've linked this to your existing focus area. This update helps us: \n• Refine your priorities\n• Track progress better\n• Stay aligned with your goals`;
  }

  private generateInsightUpdateResponse(contextMatch: any): string {
    return `💡 **Enhancing Insight**: "${contextMatch.name}"\n\nThis adds valuable context to your existing insights. This helps us: \n• Deepen our understanding\n• Identify new patterns\n• Make better decisions`;
  }

  private generateRoadmapUpdateResponse(contextMatch: any): string {
    return `🗺️ **Updating Roadmap**: "${contextMatch.name}"\n\nThis improves your existing plan. This helps us: \n• Refine the strategy\n• Adjust timelines\n• Optimize resources`;
  }

  private generateExecuteUpdateResponse(contextMatch: any): string {
    return `⚡ **Progress Update**: "${contextMatch.name}"\n\nThis shows progress on your existing action. This helps us: \n• Track completion\n• Identify blockers\n• Plan next steps`;
  }

  /**
   * Generate contextual suggestions based on processed input
   */
  private generateSuggestions(processedInput: ProcessedInput): AgentSuggestion[] {
    const suggestions: AgentSuggestion[] = [];
    const { firePhase, nextAction, entities } = processedInput;
    
    // Add the next action as primary suggestion
    if (nextAction) {
      suggestions.push({
        id: `action-${nextAction.firePhase}`,
        type: 'action',
        title: nextAction.title,
        description: nextAction.description,
        firePhase: nextAction.firePhase,
        priority: nextAction.priority,
        action: () => this.executeAction(nextAction)
      });
    }
    
    // Add phase-specific suggestions
    switch (firePhase.id) {
      case 'focus':
        suggestions.push(
          {
            id: 'focus-question-1',
            type: 'question',
            title: 'What\'s your main priority?',
            description: 'Help clarify your primary focus area',
            firePhase: firePhase,
            priority: 'high'
          },
          {
            id: 'focus-question-2',
            type: 'question',
            title: 'What\'s blocking you?',
            description: 'Identify challenges and obstacles',
            firePhase: firePhase,
            priority: 'medium'
          }
        );
        break;
        
      case 'insight':
        suggestions.push(
          {
            id: 'insight-question-1',
            type: 'question',
            title: 'What patterns do you see?',
            description: 'Analyze trends and patterns',
            firePhase: firePhase,
            priority: 'high'
          },
          {
            id: 'insight-action-1',
            type: 'action',
            title: 'Create Dashboard',
            description: 'Visualize this data for better insights',
            firePhase: firePhase,
            priority: 'medium'
          }
        );
        break;
        
      case 'roadmap':
        suggestions.push(
          {
            id: 'roadmap-question-1',
            type: 'question',
            title: 'What are the key milestones?',
            description: 'Break down the plan into steps',
            firePhase: firePhase,
            priority: 'high'
          },
          {
            id: 'roadmap-action-1',
            type: 'action',
            title: 'Create Timeline',
            description: 'Set deadlines and track progress',
            firePhase: firePhase,
            priority: 'medium'
          }
        );
        break;
        
      case 'execute':
        suggestions.push(
          {
            id: 'execute-question-1',
            type: 'question',
            title: 'What\'s the next step?',
            description: 'Identify immediate actions',
            firePhase: firePhase,
            priority: 'high'
          },
          {
            id: 'execute-action-1',
            type: 'action',
            title: 'Track Progress',
            description: 'Monitor completion and outcomes',
            firePhase: firePhase,
            priority: 'medium'
          }
        );
        break;
    }
    
    // Add general suggestions based on entities
    if (entities.some(e => e.type === 'metric')) {
      suggestions.push({
        id: 'metric-insight',
        type: 'insight',
        title: 'Analyze Trends',
        description: 'Look for patterns in your metrics',
        firePhase: firePhase,
        priority: 'medium'
      });
    }
    
    if (entities.some(e => e.type === 'project')) {
      suggestions.push({
        id: 'project-roadmap',
        type: 'recommendation',
        title: 'Create Project Plan',
        description: 'Develop a detailed roadmap',
        firePhase: firePhase,
        priority: 'high'
      });
    }
    
    return suggestions;
  }

  /**
   * Execute an action (placeholder for real implementation)
   */
  private executeAction(action: NextAction): void {
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log(`Executing action: ${action.title}`);
    // This would integrate with your actual action system
    // For example, creating tasks, updating projects, etc.
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Process multiple inputs and provide batch response
   */
  async processBatch(inputs: string[]): Promise<AgentResponse[]> {
    const responses: AgentResponse[] = [];
    
    for (const input of inputs) {
      const response = await this.processInput(input);
      responses.push(response);
    }
    
    return responses;
  }

  /**
   * Get agent statistics
   */
  getAgentStats(): {
    totalProcessed: number;
    phaseDistribution: Record<string, number>;
    averageConfidence: number;
    responseTypes: Record<string, number>;
  } {
    // This would track agent performance over time
    return {
      totalProcessed: 0,
      phaseDistribution: { focus: 0, insight: 0, roadmap: 0, execute: 0 },
      averageConfidence: 0,
      responseTypes: { action: 0, question: 0, insight: 0, recommendation: 0 }
    };
  }
}

// Hook for easy agent integration
export const useFireCycleAgent = (userContext: UserContext) => {
  const agent = new FireCycleAgent(userContext);
  
  return {
    processInput: (input: string) => agent.processInput(input),
    processBatch: (inputs: string[]) => agent.processBatch(inputs),
    getStats: () => agent.getAgentStats()
  };
}; 