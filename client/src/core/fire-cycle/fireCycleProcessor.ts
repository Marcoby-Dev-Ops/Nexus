import { FireCycleLogicEngine, type UserContext, type FireAnalysis } from './fireCycleLogic';
import type { FireCyclePhase } from '@/types/business/fire-cycle';

export interface ProcessedInput {
  id: string;
  originalInput: string;
  timestamp: Date;
  entities: Entity[];
  sentiment: SentimentAnalysis;
  firePhase: FireCyclePhase;
  confidence: number;
  reasoning: string;
  contextMatch?: ContextMatch;
  nextAction?: NextAction;
  isNewItem: boolean;
}

export interface Entity {
  type: 'goal' | 'challenge' | 'project' | 'task' | 'metric' | 'person' | 'company' | 'date' | 'amount';
  value: string;
  confidence: number;
  startIndex: number;
  endIndex: number;
}

export interface SentimentAnalysis {
  score: number; // -1 to 1
  label: 'positive' | 'negative' | 'neutral';
  emotions: string[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

export interface ContextMatch {
  type: 'project' | 'task' | 'goal' | 'insight' | 'roadmap';
  id: string;
  name: string;
  relevance: number; // 0-1
  phase: FireCyclePhase;
}

export interface NextAction {
  type: 'create' | 'update' | 'link' | 'complete' | 'prompt';
  title: string;
  description: string;
  firePhase: FireCyclePhase;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedEffort: number; // minutes
}

export class FireCycleProcessor {
  private logicEngine: FireCycleLogicEngine;
  private userContext: UserContext;

  constructor(userContext: UserContext) {
    this.userContext = userContext;
    this.logicEngine = new FireCycleLogicEngine(userContext);
  }

  /**
   * Main processing function - analyzes every user input
   */
  async processUserInput(input: string): Promise<ProcessedInput> {
    // Step 1: Intake & Analysis (NLP + Sentiment)
    const { entities, sentiment, contextMatch } = await this.analyzeInputNLP(input);

    // Step 2: FIRE Classification & Routing
    const firePhase = this.classifyFIREPhase(input, entities, sentiment);
    
    // Step 3: Determine if new or update
    const isNewItem = !contextMatch;
    
    // Step 4: Generate next action
    const nextAction = this.generateNextAction(firePhase, isNewItem, contextMatch);

    return {
      id: this.generateId(),
      originalInput: input,
      timestamp: new Date(),
      entities,
      sentiment,
      firePhase,
      confidence: this.calculateConfidence(entities, sentiment, contextMatch),
      reasoning: this.generateReasoning(firePhase, entities, sentiment, contextMatch),
      contextMatch,
      nextAction,
      isNewItem
    };
  }

  /**
   * Step 1: NLP Analysis with entity extraction and sentiment analysis
   */
  private async analyzeInputNLP(input: string) {
    const entities = this.extractEntities(input);
    const sentiment = this.analyzeSentiment(input);
    const contextMatch = this.findContextMatch(input, entities);

    return { entities, sentiment, contextMatch };
  }

  /**
   * Extract entities from input text
   */
  private extractEntities(input: string): Entity[] {
    const entities: Entity[] = [];
    
    // Goal detection patterns
    const goalPatterns = [
      /(?:want|need|goal|objective|aim|target)\s+(?:to\s+)?(.+?)(?:\s|$|\.)/gi,
      /(?:increase|improve|achieve|reach|hit)\s+(.+?)(?:\s|$|\.)/gi
    ];
    
    goalPatterns.forEach(pattern => {
      const matches = input.matchAll(pattern);
      for (const match of matches) {
        entities.push({
          type: 'goal',
          value: match[1].trim(),
          confidence: 0.8,
          startIndex: match.index!,
          endIndex: match.index! + match[0].length
        });
      }
    });

    // Challenge detection patterns
    const challengePatterns = [
      /(?:problem|issue|challenge|blocker|obstacle|difficulty)\s+(?:with\s+)?(.+?)(?:\s|$|\.)/gi,
      /(?:struggling|having trouble|can't|unable)\s+(?:to\s+)?(.+?)(?:\s|$|\.)/gi
    ];
    
    challengePatterns.forEach(pattern => {
      const matches = input.matchAll(pattern);
      for (const match of matches) {
        entities.push({
          type: 'challenge',
          value: match[1].trim(),
          confidence: 0.7,
          startIndex: match.index!,
          endIndex: match.index! + match[0].length
        });
      }
    });

    // Project detection patterns
    const projectPatterns = [
      /(?:project|initiative|campaign|launch)\s+(?:called\s+)?(.+?)(?:\s|$|\.)/gi,
      /(?:working on|developing|building)\s+(.+?)(?:\s|$|\.)/gi
    ];
    
    projectPatterns.forEach(pattern => {
      const matches = input.matchAll(pattern);
      for (const match of matches) {
        entities.push({
          type: 'project',
          value: match[1].trim(),
          confidence: 0.8,
          startIndex: match.index!,
          endIndex: match.index! + match[0].length
        });
      }
    });

    // Task detection patterns
    const taskPatterns = [
      /(?:task|action|todo|item)\s+(?:to\s+)?(.+?)(?:\s|$|\.)/gi,
      /(?:need to|should|must)\s+(.+?)(?:\s|$|\.)/gi
    ];
    
    taskPatterns.forEach(pattern => {
      const matches = input.matchAll(pattern);
      for (const match of matches) {
        entities.push({
          type: 'task',
          value: match[1].trim(),
          confidence: 0.7,
          startIndex: match.index!,
          endIndex: match.index! + match[0].length
        });
      }
    });

    // Metric detection patterns
    const metricPatterns = [
      /(\d+(?:\.\d+)?)\s*(?:percent|%|users|customers|revenue|sales|leads)/gi,
      /(?:metric|kpi|measure)\s+(?:of\s+)?(.+?)(?:\s|$|\.)/gi
    ];
    
    metricPatterns.forEach(pattern => {
      const matches = input.matchAll(pattern);
      for (const match of matches) {
        entities.push({
          type: 'metric',
          value: match[0].trim(),
          confidence: 0.9,
          startIndex: match.index!,
          endIndex: match.index! + match[0].length
        });
      }
    });

    return entities;
  }

  /**
   * Analyze sentiment of input text
   */
  private analyzeSentiment(input: string): SentimentAnalysis {
    const positiveWords = ['great', 'good', 'excellent', 'amazing', 'success', 'win', 'improve', 'increase', 'achieve'];
    const negativeWords = ['bad', 'terrible', 'problem', 'issue', 'fail', 'struggle', 'difficult', 'challenge', 'blocker'];
    const urgentWords = ['urgent', 'critical', 'immediate', 'asap', 'emergency', 'deadline', 'important'];
    
    const words = input.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;
    let urgentCount = 0;
    
    words.forEach(word => {
      if (positiveWords.some(pw => word.includes(pw))) positiveCount++;
      if (negativeWords.some(nw => word.includes(nw))) negativeCount++;
      if (urgentWords.some(uw => word.includes(uw))) urgentCount++;
    });
    
    const totalWords = words.length;
    const sentimentScore = (positiveCount - negativeCount) / Math.max(totalWords, 1);
    
    let label: 'positive' | 'negative' | 'neutral';
    if (sentimentScore > 0.1) label = 'positive';
    else if (sentimentScore < -0.1) label = 'negative';
    else label = 'neutral';
    
    const urgency: 'low' | 'medium' | 'high' | 'critical' = 
      urgentCount > 2 ? 'critical' :
      urgentCount > 1 ? 'high' :
      urgentCount > 0 ? 'medium' : 'low';
    
    const emotions: string[] = [];
    if (positiveCount > 0) emotions.push('optimistic');
    if (negativeCount > 0) emotions.push('concerned');
    if (urgentCount > 0) emotions.push('urgent');
    
    return {
      score: sentimentScore,
      label,
      emotions,
      urgency
    };
  }

  /**
   * Find if input matches existing context
   */
  private findContextMatch(input: string, entities: Entity[]): ContextMatch | undefined {
    const inputLower = input.toLowerCase();
    
    // Check against existing projects
    for (const project of this.userContext.currentProjects) {
      if (inputLower.includes(project.name.toLowerCase())) {
        return {
          type: 'project',
          id: project.id,
          name: project.name,
          relevance: 0.9,
          phase: this.determineProjectPhase(project)
        };
      }
    }
    
    // Check against existing goals
    for (const goal of this.userContext.goals) {
      if (inputLower.includes(goal.toLowerCase())) {
        return {
          type: 'goal',
          id: goal,
          name: goal,
          relevance: 0.8,
          phase: 'focus'
        };
      }
    }
    
    // Check against existing challenges
    for (const challenge of this.userContext.challenges) {
      if (inputLower.includes(challenge.toLowerCase())) {
        return {
          type: 'challenge',
          id: challenge,
          name: challenge,
          relevance: 0.7,
          phase: 'focus'
        };
      }
    }
    
    return undefined;
  }

  /**
   * Step 2: FIRE Classification & Routing
   */
  private classifyFIREPhase(input: string, entities: Entity[], sentiment: SentimentAnalysis): FireCyclePhase {
    const inputLower = input.toLowerCase();
    
    // Focus detection
    const focusIndicators = [
      /(?:goal|objective|target|aim|focus|priority)/gi,
      /(?:want|need|should|must)\s+(?:to\s+)?/gi,
      /(?:challenge|problem|issue|blocker)/gi
    ];
    
    const focusScore = focusIndicators.reduce((score, pattern) => {
      return score + (inputLower.match(pattern)?.length || 0);
    }, 0);
    
    // Insight detection
    const insightIndicators = [
      /(?:discovered|found|learned|realized|noticed)/gi,
      /(?:trend|pattern|data|analysis|insight)/gi,
      /(?:increase|decrease|change|improve|decline)/gi
    ];
    
    const insightScore = insightIndicators.reduce((score, pattern) => {
      return score + (inputLower.match(pattern)?.length || 0);
    }, 0);
    
    // Roadmap detection
    const roadmapIndicators = [
      /(?:plan|strategy|roadmap|timeline|schedule)/gi,
      /(?:next|step|phase|milestone)/gi,
      /(?:will|going to|planning to)/gi
    ];
    
    const roadmapScore = roadmapIndicators.reduce((score, pattern) => {
      return score + (inputLower.match(pattern)?.length || 0);
    }, 0);
    
    // Execute detection
    const executeIndicators = [
      /(?:completed|finished|done|achieved)/gi,
      /(?:action|task|todo|implement)/gi,
      /(?:started|began|launched)/gi
    ];
    
    const executeScore = executeIndicators.reduce((score, pattern) => {
      return score + (inputLower.match(pattern)?.length || 0);
    }, 0);
    
    // Determine phase based on scores and entities
    const scores = { focus: focusScore, insight: insightScore, roadmap: roadmapScore, execute: executeScore };
    
    // Entity-based adjustments
    if (entities.some(e => e.type === 'goal' || e.type === 'challenge')) {
      scores.focus += 2;
    }
    if (entities.some(e => e.type === 'metric')) {
      scores.insight += 2;
    }
    if (entities.some(e => e.type === 'project')) {
      scores.roadmap += 1;
    }
    if (entities.some(e => e.type === 'task')) {
      scores.execute += 2;
    }
    
    // Return phase with highest score
    return Object.entries(scores).reduce((a, b) => 
      scores[a[0] as FireCyclePhase] > scores[b[0] as FireCyclePhase] ? a: b
    )[0] as FireCyclePhase;
  }

  /**
   * Step 4: Generate next action based on FIRE phase
   */
  private generateNextAction(phase: FireCyclePhase, isNewItem: boolean, contextMatch?: ContextMatch): NextAction {
    if (isNewItem) {
      switch (phase) {
        case 'focus':
          return {
            type: 'create',
            title: 'Set as New Focus',
            description: 'Create a new focus area for this goal or challenge',
            firePhase: 'focus',
            priority: 'high',
            estimatedEffort: 5
          };
        case 'insight':
          return {
            type: 'create',
            title: 'Capture as Insight',
            description: 'Record this as a new insight for analysis',
            firePhase: 'insight',
            priority: 'medium',
            estimatedEffort: 3
          };
        case 'roadmap':
          return {
            type: 'create',
            title: 'Create Roadmap',
            description: 'Develop a plan based on this input',
            firePhase: 'roadmap',
            priority: 'high',
            estimatedEffort: 10
          };
        case 'execute':
          return {
            type: 'create',
            title: 'Start Action',
            description: 'Begin implementing this action',
            firePhase: 'execute',
            priority: 'high',
            estimatedEffort: 15
          };
      }
    } else {
      // Update existing item
      return {
        type: 'update',
        title: `Update ${contextMatch?.name || 'Item'}`,
        description: 'Update the existing item with this new information',
        firePhase: phase,
        priority: 'medium',
        estimatedEffort: 2
      };
    }
  }

  /**
   * Calculate confidence in the analysis
   */
  private calculateConfidence(entities: Entity[], sentiment: SentimentAnalysis, contextMatch?: ContextMatch): number {
    let confidence = 0.5; // Base confidence
    
    // Entity confidence
    if (entities.length > 0) {
      const avgEntityConfidence = entities.reduce((sum, e) => sum + e.confidence, 0) / entities.length;
      confidence += avgEntityConfidence * 0.2;
    }
    
    // Sentiment confidence
    if (sentiment.label !== 'neutral') {
      confidence += 0.1;
    }
    
    // Context match confidence
    if (contextMatch) {
      confidence += contextMatch.relevance * 0.2;
    }
    
    // Urgency confidence
    if (sentiment.urgency === 'critical' || sentiment.urgency === 'high') {
      confidence += 0.1;
    }
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Generate reasoning for the classification
   */
  private generateReasoning(phase: FireCyclePhase, entities: Entity[], sentiment: SentimentAnalysis, contextMatch?: ContextMatch): string {
    const reasons = [];
    
    // Phase-specific reasoning
    switch (phase) {
      case 'focus':
        if (entities.some(e => e.type === 'goal')) reasons.push('Goal identified');
        if (entities.some(e => e.type === 'challenge')) reasons.push('Challenge detected');
        if (sentiment.label === 'negative') reasons.push('Problem-focused input');
        break;
      case 'insight':
        if (entities.some(e => e.type === 'metric')) reasons.push('Metric/trend mentioned');
        if (sentiment.label === 'positive') reasons.push('Positive discovery');
        break;
      case 'roadmap':
        if (entities.some(e => e.type === 'project')) reasons.push('Project planning');
        if (sentiment.label === 'neutral') reasons.push('Strategic planning input');
        break;
      case 'execute':
        if (entities.some(e => e.type === 'task')) reasons.push('Action-oriented input');
        if (sentiment.urgency === 'high') reasons.push('Urgent action needed');
        break;
    }
    
    // Context match reasoning
    if (contextMatch) {
      reasons.push(`Related to existing ${contextMatch.type}: ${contextMatch.name}`);
    } else {
      reasons.push('New item detected');
    }
    
    return reasons.join(', ');
  }

  /**
   * Determine project phase based on project status
   */
  private determineProjectPhase(project: any): FireCyclePhase {
    switch (project.status) {
      case 'planning': return 'roadmap';
      case 'active': return 'execute';
      case 'completed': return 'execute';
      case 'stalled': return 'focus';
      default: return 'focus';
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `fire_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Process multiple inputs in batch
   */
  async processBatch(inputs: string[]): Promise<ProcessedInput[]> {
    const results: ProcessedInput[] = [];
    
    for (const input of inputs) {
      const result = await this.processUserInput(input);
      results.push(result);
    }
    
    return results;
  }

  /**
   * Get processing statistics
   */
  getProcessingStats(): {
    totalProcessed: number;
    phaseDistribution: Record<FireCyclePhase, number>;
    averageConfidence: number;
    contextMatchRate: number;
  } {
    // This would track statistics over time
    return {
      totalProcessed: 0,
      phaseDistribution: { focus: 0, insight: 0, roadmap: 0, execute: 0 },
      averageConfidence: 0,
      contextMatchRate: 0
    };
  }
} 