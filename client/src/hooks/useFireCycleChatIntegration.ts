import { useState, useCallback, useEffect } from 'react';
import { FireCycleChatIntegration } from '@/core/fire-cycle/fireCycleChatIntegration';
import type { FireCycleChatResponse } from '@/core/fire-cycle/fireCycleChatIntegration';
import type { UserContext } from '@/core/fire-cycle/fireCycleLogic';
import { useAuth } from '@/hooks/index';

export interface UseFireCycleChatIntegrationProps {
  onThoughtCreated?: (thought: any) => void;
  onPhaseChange?: (phase: 'focus' | 'insight' | 'roadmap' | 'execute') => void;
  autoProcess?: boolean;
}

export interface UseFireCycleChatIntegrationReturn {
  fireCycleIntegration: FireCycleChatIntegration | null;
  isProcessing: boolean;
  lastResponse: FireCycleChatResponse | null;
  processMessage: (message: string, companyId?: string) => Promise<FireCycleChatResponse | null>;
  clearResponse: () => void;
  userContext: UserContext | null;
}

export function useFireCycleChatIntegration(props: UseFireCycleChatIntegrationProps = {}): UseFireCycleChatIntegrationReturn {
  const { user } = useAuth();
  const [fireCycleIntegration, setFireCycleIntegration] = useState<FireCycleChatIntegration | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState<FireCycleChatResponse | null>(null);
  const [userContext, setUserContext] = useState<UserContext | null>(null);

  // Initialize user context when user is available
  useEffect(() => {
    if (user) {
      const context: UserContext = {
        userId: user.id,
        email: user.email || '',
        name: user.user_metadata?.full_name || user.email || '',
        companyId: user.user_metadata?.company_id,
        role: user.user_metadata?.role || 'user',
        preferences: user.user_metadata?.preferences || {}
      };
      setUserContext(context);
      
      const integration = new FireCycleChatIntegration(context);
      setFireCycleIntegration(integration);
    }
  }, [user]);

  const processMessage = useCallback(async (
    message: string, 
    companyId?: string
  ): Promise<FireCycleChatResponse | null> => {
    if (!fireCycleIntegration || !userContext) {
      console.warn('FireCycle integration not initialized');
      return null;
    }

    setIsProcessing(true);
    try {
      const response = await fireCycleIntegration.analyzeChatMessage(message, userContext.userId, companyId);
      setLastResponse(response);
      
      if (response.shouldTrigger && response.suggestedThought) {
        props.onThoughtCreated?.(response.suggestedThought);
      }
      
      if (response.firePhase) {
        props.onPhaseChange?.(response.firePhase);
      }
      
      return response;
    } catch (error) {
      console.error('Error processing message through FIRE cycle:', error);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [fireCycleIntegration, userContext, props]);

  const clearResponse = useCallback(() => {
    setLastResponse(null);
  }, []);

  return {
    fireCycleIntegration,
    isProcessing,
    lastResponse,
    processMessage,
    clearResponse,
    userContext
  };
} 