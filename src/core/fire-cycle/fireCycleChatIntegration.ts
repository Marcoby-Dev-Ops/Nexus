import { FireCycleProcessor, type ProcessedInput } from './fireCycleProcessor';
import { supabase } from '@/lib/supabase';
import type { UserContext } from './fireCycleLogic';
import { thoughtsService } from '@/services/help-center/thoughtsService';

/**
 * FIRE Cycle Chat Integration
 * 
 * Analyzes AI chat messages and automatically triggers FIRE cycle processing
 * when users make statements that indicate ideas, goals, or initiatives.
 */

export interface FireCycleChatTrigger {
  id: string;
  originalMessage: string;
  processedInput: ProcessedInput;
  firePhase: 'focus' | 'insight' | 'roadmap' | 'execute';
  confidence: number;
  suggestedActions: string[];
  thoughtId?: string;
  createdAt: Date;
}

export interface FireCycleChatResponse {
  shouldTrigger: boolean;
  firePhase?: 'focus' | 'insight' | 'roadmap' | 'execute';
  confidence?: number;
  suggestedThought?: {
    content: string;
    category: 'idea' | 'task' | 'reminder' | 'update';
    status: 'concept' | 'in_progress' | 'completed';
    priority: 'low' | 'medium' | 'high';
    estimatedEffort?: string;
  };
  nextSteps?: string[];
  reasoning?: string;
  originalMessage?: string;
}

export class FireCycleChatIntegration {
  private processor: FireCycleProcessor;
  private userContext: UserContext;

  constructor(userContext: UserContext) {
    this.userContext = userContext;
    this.processor = new FireCycleProcessor(userContext);
  }

  /**
   * Analyze a chat message to determine if it should trigger FIRE cycle processing
   */
  async analyzeChatMessage(
    message: string, 
    _userId: string, 
    _companyId?: string
  ): Promise<FireCycleChatResponse> {
    // Enhanced trigger phrases with NLP patterns
    const triggerPhrases = [
      // Focus phase triggers
      /(?:I want|We want|I need|We need|I should|We should)/i,
      /(?:I'm focused on|We're focused on|My priority is|Our priority is)/i,
      /(?:I'm trying to|We're trying to|I'm working on|We're working on)/i,
      
      // Insight phase triggers
      /(?:This is|That is|It is)/i,
      /(?:I think|We think|I believe|We believe)/i,
      /(?:I've learned|We've learned|I discovered|We discovered)/i,
      /(?:I noticed|We noticed|I observed|We observed)/i,
      
      // Roadmap phase triggers
      /(?:I plan|We plan|I'm planning|We're planning)/i,
      /(?:I'm going to|We're going to|I will|We will)/i,
      /(?:I'm going to start|We're going to start|I'm about to|We're about to)/i,
      
      // Execute phase triggers
      /(?:I started|We started|I began|We began)/i,
      /(?:I'm implementing|We're implementing|I'm executing|We're executing)/i,
      /(?:I'm doing|We're doing|I'm working on|We're working on)/i,
      
      // General triggers
      /(?:I'd like to|We'd like to|I would like to|We would like to)/i,
      /(?:I'm considering|We're considering|I'm thinking about|We're thinking about)/i,
      /(?:It would be good to|It would be great to|It would be nice to)/i,
      /(?:We could|I could|We might|I might)/i,
      /(?:Let's|Let us)/i,
      
      // Update triggers (for existing thoughts)
      /(?:I just|We just|I recently|We recently)/i,
      /(?:I finished|We finished|I completed|We completed)/i,
      /(?:I made progress|We made progress|I advanced|We advanced)/i,
      /(?:I moved|We moved|I transitioned|We transitioned)/i
    ];

    const hasTriggerPhrase = triggerPhrases.some(phrase => phrase.test(message));
    
    if (!hasTriggerPhrase) {
      return { shouldTrigger: false };
    }

    // Process through FIRE cycle analysis
    const processedInput = await this.processor.processUserInput(message);
    
    // Determine if this is a new item or update to existing
    const firePhase = processedInput.firePhase;

    // Enhanced confidence calculation with NLP analysis
    const enhancedConfidence = this.calculateEnhancedConfidence(message, processedInput);

    // Only trigger if confidence is above threshold
    if (enhancedConfidence < 0.5) {
      return { 
        shouldTrigger: false,
        reasoning: 'Low confidence in FIRE phase classification'
      };
    }

    // Generate suggested thought based on FIRE phase
    const suggestedThought = this.generateSuggestedThought(message, firePhase, processedInput);

    // Generate next steps based on FIRE phase
    const nextSteps = this.generateNextSteps(firePhase, processedInput);

    return {
      shouldTrigger: true,
      firePhase,
      confidence: enhancedConfidence,
      suggestedThought,
      nextSteps,
      reasoning: processedInput.reasoning,
      originalMessage: message
    };
  }

  /**
   * Enhanced confidence calculation using NLP patterns
   */
  private calculateEnhancedConfidence(message: string, processedInput: ProcessedInput): number {
    let confidence = processedInput.confidence;
    
    // Check for update patterns (indicating progress on existing thoughts)
    const updatePatterns = [
      /(?:just|recently|finally|at last)/i,
      /(?:started|began|implemented|executed)/i,
      /(?:finished|completed|done|achieved)/i,
      /(?:moved|advanced|progressed|transitioned)/i,
      /(?:made progress|got closer|reached milestone)/i
    ];
    
    const hasUpdatePattern = updatePatterns.some(pattern => pattern.test(message));
    if (hasUpdatePattern) {
      confidence += 0.2; // Boost confidence for update patterns
    }
    
    // Check for specific action words
    const actionWords = [
      'start', 'begin', 'implement', 'execute', 'launch', 'initiate',
      'plan', 'design', 'create', 'build', 'develop', 'establish',
      'complete', 'finish', 'achieve', 'accomplish', 'deliver',
      'learn', 'discover', 'analyze', 'research', 'investigate'
    ];
    
    const actionWordCount = actionWords.filter(word => 
      message.toLowerCase().includes(word)
    ).length;
    
    confidence += Math.min(actionWordCount * 0.05, 0.3); // Max 0.3 boost from action words
    
    // Check for time indicators (urgency/priority)
    const timeIndicators = [
      'urgent', 'asap', 'immediate', 'soon', 'quickly', 'fast',
      'deadline', 'timeline', 'schedule', 'milestone', 'target'
    ];
    
    const hasTimeIndicator = timeIndicators.some(indicator => 
      message.toLowerCase().includes(indicator)
    );
    
    if (hasTimeIndicator) {
      confidence += 0.1; // Boost confidence for time-sensitive items
    }
    
    return Math.min(confidence, 1.0); // Cap at 1.0
  }

  /**
   * Create a thought from the chat message
   */
  async createThoughtFromChat(
    message: string,
    userId: string,
    companyId?: string,
    firePhase?: 'focus' | 'insight' | 'roadmap' | 'execute'
  ): Promise<string | null> {
    try {
      const thought = await thoughtsService.createThought({
        content: message,
        category: this.mapFirePhaseToCategory(firePhase || 'focus'),
        status: 'concept',
        interaction_method: 'text',
        company_id: companyId,
        main_sub_categories: this.extractCategories(message),
        personal_or_professional: 'professional',
        priority: this.determinePriority(message, firePhase),
        estimated_effort: this.estimateEffort(message, firePhase),
        impact: this.assessImpact(message, firePhase)
      });

      // Trigger AI processing for the thought
      if (thought?.id) {
        this.triggerAIProcessing(thought.id, message, userId, companyId);
      }

      return thought?.id || null;
    } catch (error) {
      console.error('Error creating thought from chat:', error);
      return null;
    }
  }

  /**
   * Generate suggested thought structure based on FIRE phase
   */
  private generateSuggestedThought(
    message: string,
    firePhase: 'focus' | 'insight' | 'roadmap' | 'execute',
    _processedInput: ProcessedInput
  ) {
    const category = this.mapFirePhaseToCategory(firePhase);
    const priority = this.determinePriority(message, firePhase);
    const estimatedEffort = this.estimateEffort(message, firePhase);

    return {
      content: message,
      category,
      status: 'concept' as const,
      priority,
      estimatedEffort
    };
  }

  /**
   * Generate next steps based on FIRE phase
   */
  private generateNextSteps(
    firePhase: 'focus' | 'insight' | 'roadmap' | 'execute',
    _processedInput: ProcessedInput
  ): string[] {
    const steps: string[] = [];

    switch (firePhase) {
      case 'focus':
        steps.push(
          'Define clear success criteria for this goal',
          'Identify key stakeholders and resources needed',
          'Set timeline and milestones'
        );
        break;
      case 'insight':
        steps.push(
          'Analyze the data and patterns',
          'Identify root causes and opportunities',
          'Document key learnings and insights'
        );
        break;
      case 'roadmap':
        steps.push(
          'Break down the plan into actionable steps',
          'Assign responsibilities and deadlines',
          'Create detailed timeline and milestones'
        );
        break;
      case 'execute':
        steps.push(
          'Start with the highest priority action',
          'Track progress and measure outcomes',
          'Adjust plan based on results'
        );
        break;
    }

    return steps;
  }

  /**
   * Map FIRE phase to thought category
   */
  private mapFirePhaseToCategory(firePhase: 'focus' | 'insight' | 'roadmap' | 'execute'): 'idea' | 'task' | 'reminder' | 'update' {
    switch (firePhase) {
      case 'focus':
        return 'idea';
      case 'insight':
        return 'update';
      case 'roadmap':
        return 'task';
      case 'execute':
        return 'task';
      default:
        return 'idea';
    }
  }

  /**
   * Determine priority based on message content and FIRE phase
   */
  private determinePriority(
    message: string,
    firePhase?: 'focus' | 'insight' | 'roadmap' | 'execute'
  ): 'low' | 'medium' | 'high' {
    const urgentWords = ['urgent', 'critical', 'immediate', 'asap', 'emergency', 'crisis'];
    const highPriorityWords = ['important', 'key', 'essential', 'vital', 'crucial'];
    const lowPriorityWords = ['maybe', 'sometime', 'eventually', 'later', 'low priority'];

    const messageLower = message.toLowerCase();

    if (urgentWords.some(word => messageLower.includes(word))) {
      return 'high';
    }

    if (highPriorityWords.some(word => messageLower.includes(word))) {
      return 'high';
    }

    if (lowPriorityWords.some(word => messageLower.includes(word))) {
      return 'low';
    }

    // Default priority based on FIRE phase
    switch (firePhase) {
      case 'focus':
        return 'high';
      case 'insight':
        return 'medium';
      case 'roadmap':
        return 'high';
      case 'execute':
        return 'high';
      default:
        return 'medium';
    }
  }

  /**
   * Estimate effort based on message content and FIRE phase
   */
  private estimateEffort(
    message: string,
    firePhase?: 'focus' | 'insight' | 'roadmap' | 'execute'
  ): string {
    const messageLower = message.toLowerCase();
    
    // Check for time indicators in the message
    if (messageLower.includes('quick') || messageLower.includes('simple') || messageLower.includes('easy')) {
      return '1-2 hours';
    }
    
    if (messageLower.includes('complex') || messageLower.includes('major') || messageLower.includes('overhaul')) {
      return '1-2 weeks';
    }

    // Default effort based on FIRE phase
    switch (firePhase) {
      case 'focus':
        return '2-4 hours';
      case 'insight':
        return '4-8 hours';
      case 'roadmap':
        return '1-2 days';
      case 'execute':
        return '1-3 days';
      default:
        return '4-8 hours';
    }
  }

  /**
   * Assess impact based on message content and FIRE phase
   */
  private assessImpact(
    message: string,
    firePhase?: 'focus' | 'insight' | 'roadmap' | 'execute'
  ): string {
    const messageLower = message.toLowerCase();
    
    if (messageLower.includes('revenue') || messageLower.includes('sales') || messageLower.includes('growth')) {
      return 'High - Revenue impact';
    }
    
    if (messageLower.includes('efficiency') || messageLower.includes('productivity') || messageLower.includes('cost')) {
      return 'Medium - Operational impact';
    }
    
    if (messageLower.includes('customer') || messageLower.includes('satisfaction') || messageLower.includes('experience')) {
      return 'High - Customer impact';
    }

    // Default impact based on FIRE phase
    switch (firePhase) {
      case 'focus':
        return 'High - Strategic focus';
      case 'insight':
        return 'Medium - Learning and improvement';
      case 'roadmap':
        return 'High - Implementation planning';
      case 'execute':
        return 'High - Action and results';
      default:
        return 'Medium - General improvement';
    }
  }

  /**
   * Extract categories from message content
   */
  private extractCategories(message: string): string[] {
    const categories: string[] = [];
    const messageLower = message.toLowerCase();

    // Business function categories
    if (messageLower.includes('sales') || messageLower.includes('revenue') || messageLower.includes('pipeline')) {
      categories.push('sales');
    }
    
    if (messageLower.includes('marketing') || messageLower.includes('campaign') || messageLower.includes('lead')) {
      categories.push('marketing');
    }
    
    if (messageLower.includes('finance') || messageLower.includes('budget') || messageLower.includes('cost')) {
      categories.push('finance');
    }
    
    if (messageLower.includes('operations') || messageLower.includes('process') || messageLower.includes('efficiency')) {
      categories.push('operations');
    }

    // Project categories
    if (messageLower.includes('website') || messageLower.includes('web') || messageLower.includes('online')) {
      categories.push('digital');
    }
    
    if (messageLower.includes('blog') || messageLower.includes('content') || messageLower.includes('writing')) {
      categories.push('content');
    }
    
    if (messageLower.includes('team') || messageLower.includes('hiring') || messageLower.includes('staff')) {
      categories.push('hr');
    }

    return categories.length > 0 ? categories : ['general'];
  }

  /**
   * Trigger AI processing for the created thought
   */
  private async triggerAIProcessing(
    thoughtId: string,
    content: string,
    userId: string,
    companyId?: string
  ) {
    try {
      // Fire-and-forget AI processing
      supabase.functions.invoke('ai_embed_thought', {
        body: {
          thoughtId,
          content,
        },
      }).catch((err) => {
        console.error('Failed to invoke ai_embed_thought:', err);
      });

      // Trigger intelligent thought processor
      supabase.functions.invoke('trigger-n8n-workflow', {
        body: {
          workflowname: 'intelligent_thought_processor',
          thoughtid: thoughtId,
          userid: userId,
          companyid: companyId,
          triggersource: 'chat_integration',
          context: { source: 'fire_cycle_chat' }
        },
      }).catch((err) => {
        console.error('Failed to trigger intelligent thought processor:', err);
      });

    } catch (error) {
      console.error('Error triggering AI processing:', error);
    }
  }
}

/**
 * Hook for easy FIRE cycle chat integration
 */
export const useFireCycleChatIntegration = (userContext: UserContext) => {
  const integration = new FireCycleChatIntegration(userContext);
  
  return {
    analyzeChatMessage: (message: string, userId: string, companyId?: string) => 
      integration.analyzeChatMessage(message, userId, companyId),
    createThoughtFromChat: (message: string, userId: string, companyId?: string, firePhase?: 'focus' | 'insight' | 'roadmap' | 'execute') =>
      integration.createThoughtFromChat(message, userId, companyId, firePhase)
  };
}; 