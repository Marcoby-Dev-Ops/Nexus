import { useState, useCallback } from 'react';
import type { UserContext } from '../types/types';
import { defaultAgentService } from '../services/defaultAgentService';
import { agentRegistry } from '../core/agentRegistry';

export interface UseDefaultAgentReturn {
  // Agent state
  currentAgent: any;
  isProcessing: boolean;
  
  // User context
  userContext: UserContext | null;
  setUserContext: (context: UserContext) => void;
  
  // Message processing
  processMessage: (message: string) => Promise<{
    shouldRoute: boolean;
    suggestedAgent?: any;
    reasoning?: string;
    confidence?: number;
    enhancedPrompt?: string;
  }>;
  
  // Agent switching
  switchAgent: (agentId: string) => void;
  getRoutingSuggestions: (message: string) => Array<{agentId: string, confidence: number, reasoning: string}>;
  
  // Conversation management
  conversationContext: any;
  resetConversation: () => void;
  
  // Available agents
  availableAgents: any[];
  departmentAgents: any[];
}

export const useDefaultAgent = (): UseDefaultAgentReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [userContext, setUserContextState] = useState<UserContext | null>(null);

  const setUserContext = useCallback((context: UserContext) => {
    setUserContextState(context);
    defaultAgentService.initialize(context);
  }, []);

  const processMessage = useCallback(async (message: string) => {
    setIsProcessing(true);
    try {
      const result = await defaultAgentService.processMessage(message);
      return result;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const switchAgent = useCallback((agentId: string) => {
    defaultAgentService.switchAgent(agentId);
  }, []);

  const getRoutingSuggestions = useCallback((message: string) => {
    return defaultAgentService.getRoutingSuggestions(message);
  }, []);

  const resetConversation = useCallback(() => {
    defaultAgentService.resetConversation();
  }, []);

  return {
    // Agent state
    currentAgent: defaultAgentService.getDefaultAgent(),
    isProcessing,
    
    // User context
    userContext,
    setUserContext,
    
    // Message processing
    processMessage,
    
    // Agent switching
    switchAgent,
    getRoutingSuggestions,
    
    // Conversation management
    conversationContext: defaultAgentService.getConversationContext(),
    resetConversation,
    
    // Available agents
    availableAgents: agentRegistry.getAllAgents(),
    departmentAgents: agentRegistry.getAllDepartmentAgents(),
  };
};
