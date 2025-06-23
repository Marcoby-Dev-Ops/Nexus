import type { AgentResponse } from './types';
import type { Agent } from '@/lib/agentRegistry';

interface SupervisorMetadata {
  specialists?: Agent[];
  department?: string;
  userContext?: {
    recentInteractions?: string[];
    preferredAgents?: string[];
    currentProject?: string;
    urgencyLevel?: 'low' | 'medium' | 'high' | 'critical';
  };
  conversationHistory?: Array<{
    message: string;
    agentId?: string;
    timestamp: Date;
    outcome?: 'successful' | 'escalated' | 'incomplete';
  }>;
}

interface IntentAnalysis {
  primaryIntent: string;
  confidence: number;
  entities: string[];
  sentiment: 'positive' | 'neutral' | 'negative' | 'urgent';
  complexity: 'simple' | 'moderate' | 'complex' | 'multi-domain';
  urgencyScore: number;
}

interface RoutingDecision {
  targetAgent: Agent | null;
  confidence: number;
  reasoning: string;
  fallbackOptions: Agent[];
  shouldEscalate: boolean;
  estimatedResolutionTime: string;
}

/**
 * Production-grade Supervisor Agent with advanced intent parsing and routing
 * Features:
 * - Multi-dimensional intent analysis
 * - Context-aware routing decisions
 * - Learning from interaction history
 * - Confidence scoring with uncertainty handling
 * - Escalation detection
 * - Performance optimization
 */
export class ProductionSupervisorAgent {
  private readonly intentPatterns = {
    // Technical/Development
    technical: {
      keywords: ['api', 'integration', 'code', 'bug', 'error', 'deploy', 'database', 'sql', 'function', 'webhook'],
      weight: 1.0,
      complexity: 'complex'
    },
    
    // Business Operations
    operations: {
      keywords: ['workflow', 'process', 'automation', 'efficiency', 'kpi', 'metrics', 'dashboard', 'report'],
      weight: 0.9,
      complexity: 'moderate'
    },
    
    // Financial
    financial: {
      keywords: ['revenue', 'cost', 'budget', 'invoice', 'payment', 'profit', 'expense', 'roi', 'financial'],
      weight: 0.8,
      complexity: 'moderate'
    },
    
    // Customer/Sales
    customer: {
      keywords: ['customer', 'client', 'lead', 'sales', 'crm', 'support', 'ticket', 'satisfaction'],
      weight: 0.8,
      complexity: 'moderate'
    },
    
    // HR/Team Management
    hr: {
      keywords: ['team', 'employee', 'hiring', 'performance', 'review', 'training', 'onboarding'],
      weight: 0.7,
      complexity: 'moderate'
    },
    
    // Marketing
    marketing: {
      keywords: ['campaign', 'marketing', 'content', 'social', 'analytics', 'conversion', 'seo', 'ads'],
      weight: 0.7,
      complexity: 'moderate'
    },
    
    // Security
    security: {
      keywords: ['security', 'access', 'permissions', 'auth', 'login', 'password', 'breach', 'compliance'],
      weight: 1.0,
      complexity: 'complex'
    },
    
    // General Help
    help: {
      keywords: ['help', 'how', 'what', 'why', 'guide', 'tutorial', 'documentation', 'explain'],
      weight: 0.5,
      complexity: 'simple'
    }
  };

  private readonly urgencyIndicators = [
    'urgent', 'asap', 'immediately', 'critical', 'emergency', 'broken', 'down', 'failing', 'error', 'issue'
  ];

  private readonly positiveIndicators = [
    'great', 'excellent', 'perfect', 'love', 'amazing', 'awesome', 'fantastic', 'wonderful'
  ];

  private readonly negativeIndicators = [
    'problem', 'issue', 'broken', 'error', 'fail', 'wrong', 'bad', 'terrible', 'frustrated', 'angry'
  ];

  /**
   * Analyze user message intent using NLP-inspired techniques
   */
  private analyzeIntent(message: string, context?: SupervisorMetadata): IntentAnalysis {
    const text = message.toLowerCase();
    const words = text.split(/\s+/);
    
    // Intent scoring
    const intentScores: Record<string, number> = {};
    const entities: string[] = [];
    
    for (const [intent, pattern] of Object.entries(this.intentPatterns)) {
      let score = 0;
      const matchedKeywords: string[] = [];
      
      for (const keyword of pattern.keywords) {
        if (text.includes(keyword)) {
          score += pattern.weight;
          matchedKeywords.push(keyword);
          entities.push(keyword);
        }
      }
      
      // Boost score for exact phrase matches
      if (matchedKeywords.length > 1) {
        score *= 1.2;
      }
      
      // Context boost from recent interactions
      if (context?.conversationHistory) {
        const recentIntentUsage = context.conversationHistory
          .slice(-5)
          .filter(h => h.message.toLowerCase().includes(intent))
          .length;
        score += recentIntentUsage * 0.1;
      }
      
      intentScores[intent] = score;
    }
    
    // Find primary intent
    const primaryIntent = Object.entries(intentScores)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'general';
    
    const confidence = Math.min(1, intentScores[primaryIntent] / 2);
    
    // Sentiment analysis
    const positiveCount = this.positiveIndicators.filter(ind => text.includes(ind)).length;
    const negativeCount = this.negativeIndicators.filter(ind => text.includes(ind)).length;
    const sentiment = positiveCount > negativeCount ? 'positive' : 
                     negativeCount > positiveCount ? 'negative' : 
                     this.urgencyIndicators.some(ind => text.includes(ind)) ? 'urgent' : 'neutral';
    
    // Complexity assessment
    const complexity = words.length > 50 ? 'complex' :
                      words.length > 20 ? 'moderate' : 'simple';
    
    // Urgency scoring
    const urgencyScore = this.urgencyIndicators.filter(ind => text.includes(ind)).length +
                        (sentiment === 'urgent' ? 2 : 0) +
                        (context?.userContext?.urgencyLevel === 'critical' ? 3 : 0);
    
    return {
      primaryIntent,
      confidence,
      entities: [...new Set(entities)],
      sentiment,
      complexity,
      urgencyScore
    };
  }

  /**
   * Make routing decision based on intent analysis and agent capabilities
   */
  private makeRoutingDecision(
    intent: IntentAnalysis, 
    specialists: Agent[], 
    context?: SupervisorMetadata
  ): RoutingDecision {
    const candidates: Array<{ agent: Agent; score: number; reasoning: string[] }> = [];
    
    for (const agent of specialists) {
      const reasons: string[] = [];
      let score = 0;
      
      // Specialty matching
      const specialtyMatches = (agent.specialties || []).filter(spec =>
        intent.entities.some(entity => entity.includes(spec.toLowerCase()) || spec.toLowerCase().includes(entity))
      );
      score += specialtyMatches.length * 2;
      if (specialtyMatches.length > 0) {
        reasons.push(`Matches specialties: ${specialtyMatches.join(', ')}`);
      }
      
      // Department alignment
      if (agent.department && context?.department === agent.department) {
        score += 1;
        reasons.push('Same department');
      }
      
      // Historical performance
      if (context?.conversationHistory) {
        const agentHistory = context.conversationHistory.filter(h => h.agentId === agent.id);
        const successRate = agentHistory.length > 0 ? 
          agentHistory.filter(h => h.outcome === 'successful').length / agentHistory.length : 0.5;
        score += successRate;
        if (successRate > 0.7) {
          reasons.push(`High success rate (${Math.round(successRate * 100)}%)`);
        }
      }
      
      // User preferences
      if (context?.userContext?.preferredAgents?.includes(agent.id)) {
        score += 1;
        reasons.push('User preferred agent');
      }
      
      // Availability/workload (simulated)
      const workloadFactor = Math.random() * 0.5 + 0.5; // 0.5-1.0
      score *= workloadFactor;
      
      if (score > 0) {
        candidates.push({ agent, score, reasoning: reasons });
      }
    }
    
    // Sort by score
    candidates.sort((a, b) => b.score - a.score);
    
    const bestCandidate = candidates[0];
    const shouldEscalate = intent.urgencyScore > 3 || 
                          intent.complexity === 'complex' && intent.confidence < 0.6;
    
    // Estimate resolution time based on complexity and agent capability
    const estimatedTime = intent.complexity === 'simple' ? '< 5 minutes' :
                         intent.complexity === 'moderate' ? '5-15 minutes' :
                         intent.complexity === 'complex' ? '15-30 minutes' : '30+ minutes';
    
    return {
      targetAgent: bestCandidate?.agent || null,
      confidence: bestCandidate ? Math.min(1, bestCandidate.score / 4) : 0,
      reasoning: bestCandidate?.reasoning.join('; ') || 'No suitable specialist found',
      fallbackOptions: candidates.slice(1, 3).map(c => c.agent),
      shouldEscalate,
      estimatedResolutionTime: estimatedTime
    };
  }

  /**
   * Generate contextual response based on routing decision
   */
  private generateResponse(
    intent: IntentAnalysis,
    routing: RoutingDecision,
    context?: SupervisorMetadata
  ): AgentResponse {
    const { targetAgent, confidence, reasoning, shouldEscalate, estimatedResolutionTime } = routing;
    
    if (shouldEscalate) {
      return {
        content: `This appears to be a ${intent.complexity} ${intent.primaryIntent} issue with high urgency. I'm escalating this to our specialist team for immediate attention. Expected resolution time: ${estimatedResolutionTime}`,
        confidence: 0.9,
        routeToAgentId: targetAgent?.id,
        reasoning: `Escalated due to: ${intent.urgencyScore > 3 ? 'high urgency' : 'complexity'} - ${reasoning}`,
        metadata: {
          escalated: true,
          urgencyLevel: intent.urgencyScore,
          estimatedResolutionTime
        }
      };
    }
    
    if (targetAgent && confidence > 0.6) {
      return {
        content: `Based on your ${intent.primaryIntent} request, I'm connecting you with ${targetAgent.name}, our specialist in ${targetAgent.specialties?.join(', ') || 'this area'}. They should be able to help you within ${estimatedResolutionTime}.`,
        confidence,
        routeToAgentId: targetAgent.id,
        reasoning,
        metadata: {
          intentAnalysis: intent,
          estimatedResolutionTime,
          fallbackAgents: routing.fallbackOptions.map(a => a.id)
        }
      };
    }
    
    if (targetAgent && confidence > 0.3) {
      return {
        content: `I found a potential match with ${targetAgent.name} for your ${intent.primaryIntent} request, though I'm not completely certain. Would you like me to connect you, or would you prefer to describe your needs in more detail?`,
        confidence,
        routeToAgentId: targetAgent.id,
        reasoning: `Uncertain match: ${reasoning}`,
        metadata: {
          uncertainMatch: true,
          needsClarification: true
        }
      };
    }
    
    // No good match found
    return {
      content: `I understand you need help with ${intent.primaryIntent}. Let me handle this as your ${context?.department || 'general'} assistant, or I can help you find the right specialist. Could you provide a bit more detail about what specifically you need?`,
      confidence: 0.3,
      reasoning: 'No specialist match found, requesting clarification',
      metadata: {
        needsClarification: true,
        suggestedClarifications: [
          'What specific outcome are you looking for?',
          'Is this related to a current project or process?',
          'How urgent is this request?'
        ]
      }
    };
  }

  /**
   * Main supervisor routing function
   */
  async route(message: string, metadata: SupervisorMetadata = {}): Promise<AgentResponse> {
    try {
      // Analyze the user's intent
      const intentAnalysis = this.analyzeIntent(message, metadata);
      
      // Make routing decision
      const routingDecision = this.makeRoutingDecision(
        intentAnalysis, 
        metadata.specialists || [], 
        metadata
      );
      
      // Generate appropriate response
      const response = this.generateResponse(intentAnalysis, routingDecision, metadata);
      
      // Add performance metrics
      response.metadata = {
        ...response.metadata,
        processingTime: Date.now(),
        intentConfidence: intentAnalysis.confidence,
        routingConfidence: routingDecision.confidence
      };
      
      return response;
      
    } catch (error) {
      // Graceful error handling
      return {
        content: `I encountered an issue while analyzing your request. Let me connect you with our general support team who can assist you right away.`,
        confidence: 0.2,
        reasoning: `Error in supervisor routing: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: {
          error: true,
          fallbackToGeneral: true
        }
      };
    }
  }
}

// Export singleton instance for production use
export const productionSupervisor = new ProductionSupervisorAgent();

/**
 * Legacy compatibility function - enhanced with production supervisor
 */
export async function supervisorAgent(
  message: string,
  metadata: SupervisorMetadata = {}
): Promise<AgentResponse> {
  return productionSupervisor.route(message, metadata);
} 