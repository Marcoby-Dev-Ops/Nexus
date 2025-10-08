import { useState, useCallback, useEffect } from 'react';
import { UnifiedFrameworkService } from '@/services/playbook/UnifiedFrameworkService';
import type { UnifiedResponse, UserContext } from '@/services/types';
import { MentalModelsService } from '@/services/ai/MentalModelsService';
import { BuildingBlocksService } from '@/services/playbook/BuildingBlocksService';

// Mock FireCycleService for now - would be replaced with actual implementation
class MockFireCycleService {
  async analyzeInput(input: string) {
    // Simple phase detection based on keywords
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('want') || lowerInput.includes('need') || lowerInput.includes('goal')) {
      return {
        phase: 'focus' as const,
        confidence: 0.85,
        entities: ['goal', 'objective'],
        sentiment: 'positive' as const,
        context: 'goal-setting',
        reasoning: 'User is expressing a goal or objective'
      };
    }
    
    if (lowerInput.includes('think') || lowerInput.includes('believe') || lowerInput.includes('should')) {
      return {
        phase: 'insight' as const,
        confidence: 0.78,
        entities: ['insight', 'understanding'],
        sentiment: 'neutral' as const,
        context: 'insight-generation',
        reasoning: 'User is sharing insights or understanding'
      };
    }
    
    if (lowerInput.includes('plan') || lowerInput.includes('going to') || lowerInput.includes('will')) {
      return {
        phase: 'roadmap' as const,
        confidence: 0.82,
        entities: ['plan', 'strategy'],
        sentiment: 'positive' as const,
        context: 'planning',
        reasoning: 'User is planning or strategizing'
      };
    }
    
    if (lowerInput.includes('start') || lowerInput.includes('begin') || lowerInput.includes('implement')) {
      return {
        phase: 'execute' as const,
        confidence: 0.90,
        entities: ['action', 'implementation'],
        sentiment: 'positive' as const,
        context: 'execution',
        reasoning: 'User is taking action or implementing'
      };
    }
    
    // Default to focus
    return {
      phase: 'focus' as const,
      confidence: 0.60,
      entities: [],
      sentiment: 'neutral' as const,
      context: 'general',
      reasoning: 'Default phase assignment'
    };
  }

  async getCurrentStatus(userContext: UserContext) {
    return {
      currentPhase: 'focus',
      recentActivity: [],
      progress: 0.25
    };
  }
}

interface UseUnifiedFrameworkOptions {
  userContext: UserContext;
  autoProcess?: boolean;
  onPhaseChange?: (phase: string) => void;
  onInsightGenerated?: (insights: any) => void;
}

interface UseUnifiedFrameworkReturn {
  // State
  currentResponse: UnifiedResponse | null;
  isLoading: boolean;
  error: string | null;
  messages: Array<{
    id: string;
    type: 'user' | 'ai';
    content: string;
    timestamp: Date;
    metadata?: any;
  }>;
  
  // Actions
  processInput: (input: string) => Promise<void>;
  clearMessages: () => void;
  getUnifiedInsights: () => Promise<any>;
  trackProgress: (action: string, outcome: 'success' | 'failure' | 'partial', metrics: Record<string, number>) => Promise<void>;
  
  // Utilities
  formatResponse: (response: UnifiedResponse) => string;
  getPhaseIcon: (phase: string) => string;
  getPhaseColor: (phase: string) => string;
  getPhaseProgress: (phase: string) => number;
}

export const useUnifiedFramework = (options: UseUnifiedFrameworkOptions): UseUnifiedFrameworkReturn => {
  const { userContext, autoProcess = false, onPhaseChange, onInsightGenerated } = options;
  
  const [currentResponse, setCurrentResponse] = useState<UnifiedResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{
    id: string;
    type: 'user' | 'ai';
    content: string;
    timestamp: Date;
    metadata?: any;
  }>>([]);

  // Initialize services
  const [unifiedFramework] = useState(() => {
    const mentalModels = new MentalModelsService();
    const fireCycle = new MockFireCycleService();
    const buildingBlocks = new BuildingBlocksService();
    
    return new UnifiedFrameworkService(mentalModels, fireCycle, buildingBlocks);
  });

  const processInput = useCallback(async (input: string) => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      content: input,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await unifiedFramework.processUserInput(input, userContext);
      
      if (response.success && response.data) {
        // Add AI response
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai' as const,
          content: formatResponse(response.data),
          timestamp: new Date(),
          metadata: {
            firePhase: response.data.firePhase,
            mentalModels: response.data.mentalModelInsights,
            buildingBlocks: response.data.recommendedBlocks,
            nextActions: response.data.nextActions,
            confidence: response.data.confidence
          }
        };
        
        setMessages(prev => [...prev, aiMessage]);
        setCurrentResponse(response.data);
        
        // Notify callbacks
        onPhaseChange?.(response.data.firePhase);
        onInsightGenerated?.(response.data.mentalModelInsights);
      } else {
        throw new Error(response.error || 'Failed to process input');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      
      // Add error message
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        type: 'ai' as const,
        content: `Sorry, I encountered an error: ${errorMessage}. Please try again.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [unifiedFramework, userContext, isLoading, onPhaseChange, onInsightGenerated]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentResponse(null);
    setError(null);
  }, []);

  const getUnifiedInsights = useCallback(async () => {
    try {
      const response = await unifiedFramework.getUnifiedInsights(userContext);
      return response.success ? response.data : null;
    } catch (err) {
      // Error logging removed for production
      return null;
    }
  }, [unifiedFramework, userContext]);

  const trackProgress = useCallback(async (
    action: string,
    outcome: 'success' | 'failure' | 'partial',
    metrics: Record<string, number>
  ) => {
    try {
      await unifiedFramework.trackProgress(userContext.userId, action, outcome, metrics);
    } catch (err) {
      // Error logging removed for production
    }
  }, [unifiedFramework, userContext.userId]);

  const formatResponse = useCallback((response: UnifiedResponse): string => {
    let formatted = `🧠 **${response.firePhase.toUpperCase()} Phase Analysis**\n\n`;
    
    formatted += `**Confidence:** ${Math.round(response.confidence * 100)}%\n\n`;
    
    if (response.mentalModelInsights && Object.keys(response.mentalModelInsights).length > 0) {
      formatted += `**Mental Model Insights:**\n`;
      Object.entries(response.mentalModelInsights).forEach(([model, insights]) => {
        const insightText = typeof insights === 'object' 
          ? JSON.stringify(insights).substring(0, 100) + '...'
          : String(insights);
        formatted += `• ${model.replace(/([A-Z])/g, ' $1').trim()}: ${insightText}\n`;
      });
      formatted += '\n';
    }

    if (response.recommendedBlocks && response.recommendedBlocks.length > 0) {
      formatted += `**Recommended Building Blocks:**\n`;
      response.recommendedBlocks.forEach(block => {
        formatted += `• ${block.name} (${block.complexity}, ${block.expectedImpact} impact)\n`;
      });
      formatted += '\n';
    }

    if (response.nextActions) {
      formatted += `**Next Actions:**\n`;
      if (response.nextActions.immediate.length > 0) {
        formatted += `**Immediate:** ${response.nextActions.immediate.join(', ')}\n`;
      }
      if (response.nextActions.shortTerm.length > 0) {
        formatted += `**Short Term:** ${response.nextActions.shortTerm.join(', ')}\n`;
      }
    }

    return formatted;
  }, []);

  const getPhaseIcon = useCallback((phase: string): string => {
    switch (phase) {
      case 'focus': return '🎯';
      case 'insight': return '💡';
      case 'roadmap': return '🗺️';
      case 'execute': return '▶️';
      default: return '🧠';
    }
  }, []);

  const getPhaseColor = useCallback((phase: string): string => {
    switch (phase) {
      case 'focus': return 'bg-blue-100 text-blue-800';
      case 'insight': return 'bg-yellow-100 text-yellow-800';
      case 'roadmap': return 'bg-green-100 text-green-800';
      case 'execute': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const getPhaseProgress = useCallback((phase: string): number => {
    switch (phase) {
      case 'focus': return 25;
      case 'insight': return 50;
      case 'roadmap': return 75;
      case 'execute': return 100;
      default: return 0;
    }
  }, []);

  // Auto-process example inputs if enabled
  useEffect(() => {
    if (autoProcess && messages.length === 0) {
      const exampleInputs = [
        "I want to improve our sales process",
        "I think we should focus on customer retention",
        "I plan to implement a new marketing strategy",
        "I'm starting to automate our lead follow-up"
      ];
      
      // Process first example after a short delay
      setTimeout(() => {
        processInput(exampleInputs[0]);
      }, 1000);
    }
  }, [autoProcess, messages.length, processInput]);

  return {
    // State
    currentResponse,
    isLoading,
    error,
    messages,
    
    // Actions
    processInput,
    clearMessages,
    getUnifiedInsights,
    trackProgress,
    
    // Utilities
    formatResponse,
    getPhaseIcon,
    getPhaseColor,
    getPhaseProgress
  };
};
