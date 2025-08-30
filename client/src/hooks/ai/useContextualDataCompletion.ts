import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/index';
import { contextualDataCompletionService } from '@/services/ai/contextualDataCompletionService';
import type { 
  ContextCompletionSuggestion, 
  ContextGap, 
  ConversationContextAnalysis 
} from '@/services/ai/contextualDataCompletionService';

export interface UseContextualDataCompletionOptions {
  autoAnalyze?: boolean;
  proactiveSuggestions?: boolean;
  trackInteractions?: boolean;
}

export interface ContextualDataCompletionState {
  suggestions: ContextCompletionSuggestion[];
  conversationAnalysis: ConversationContextAnalysis | null;
  loading: boolean;
  error: string | null;
  totalGaps: number;
  completedGaps: number;
  completionPercentage: number;
}

export const useContextualDataCompletion = (
  options: UseContextualDataCompletionOptions = {}
) => {
  const { user } = useAuth();
  
  
  const [state, setState] = useState<ContextualDataCompletionState>({
    suggestions: [],
    conversationAnalysis: null,
    loading: false,
    error: null,
    totalGaps: 0,
    completedGaps: 0,
    completionPercentage: 0
  });
  
  const [completedGapIds, setCompletedGapIds] = useState<Set<string>>(new Set());
  const analysisCache = useRef<Map<string, ConversationContextAnalysis>>(new Map());

  // Load proactive suggestions on mount
  useEffect(() => {
    if (proactiveSuggestions && user?.id) {
      loadProactiveSuggestions();
    }
  }, [proactiveSuggestions, user?.id]);

  // Calculate completion metrics whenever suggestions or completed gaps change
  useEffect(() => {
    const totalGaps = state.suggestions.reduce((sum, s) => sum + s.gaps.length, 0);
    const completedGaps = state.suggestions.reduce((sum, s) => 
      sum + s.gaps.filter(g => completedGapIds.has(g.id)).length, 0
    );
    const completionPercentage = totalGaps > 0 ? (completedGaps / totalGaps) * 100: 0;

    setState(prev => ({
      ...prev,
      totalGaps,
      completedGaps,
      completionPercentage
    }));
  }, [state.suggestions, completedGapIds]);

  /**
   * Load proactive suggestions based on user profile
   */
  const loadProactiveSuggestions = useCallback(async () => {
    if (!user?.id) return;

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const suggestions = await contextualDataCompletionService.getProactiveContextSuggestions(user.id);
      setState(prev => ({ 
        ...prev, 
        suggestions, 
        loading: false 
      }));
    } catch (error) {
       
     
    // eslint-disable-next-line no-console
    console.error('Error loading proactive suggestions: ', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to load context suggestions', 
        loading: false 
      }));
    }
  }, [user?.id]);

  /**
   * Analyze a conversation for missing context
   */
  const analyzeConversation = useCallback(async (
    query: string,
    aiResponse: string,
    department?: string
  ): Promise<ConversationContextAnalysis | null> => {
    if (!user?.id) return null;

    // Check cache first
    const cacheKey = `${query}:${aiResponse}:${department || ''}`;
    if (analysisCache.current.has(cacheKey)) {
      const cachedAnalysis = analysisCache.current.get(cacheKey)!;
      setState(prev => ({ ...prev, conversationAnalysis: cachedAnalysis }));
      return cachedAnalysis;
    }

    setState(prev => ({ ...prev, loading: true }));
    
    try {
      const analysis = await contextualDataCompletionService.analyzeConversationForMissingContext(
        user.id,
        query,
        aiResponse,
        department
      );
      
      // Cache the result
      analysisCache.current.set(cacheKey, analysis);
      
      setState(prev => ({ 
        ...prev, 
        conversationAnalysis: analysis,
        suggestions: analysis.suggestedCompletions,
        loading: false 
      }));
      
      return analysis;
    } catch (error) {
       
     
    // eslint-disable-next-line no-console
    console.error('Error analyzing conversation: ', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to analyze conversation context', 
        loading: false 
      }));
      return null;
    }
  }, [user?.id]);

  /**
   * Generate contextual suggestions based on query intent
   */
  const generateContextualSuggestions = useCallback(async (
    query: string,
    department?: string
  ): Promise<ContextCompletionSuggestion[]> => {
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      const suggestions = await contextualDataCompletionService.generateContextualSuggestions(
        query,
        department,
        user?.id
      );
      
      setState(prev => ({ 
        ...prev, 
        suggestions,
        loading: false 
      }));
      
      return suggestions;
    } catch (error) {
       
     
    // eslint-disable-next-line no-console
    console.error('Error generating contextual suggestions: ', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to generate suggestions', 
        loading: false 
      }));
      return [];
    }
  }, [user?.id]);

  /**
   * Complete a context gap
   */
  const completeGap = useCallback(async (gap: ContextGap, value: any): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const success = await contextualDataCompletionService.applyContextSuggestion(
        user.id,
        gap.field,
        value
      );
      
      if (success) {
        setCompletedGapIds(prev => new Set(prev).add(gap.id));
        
        // Track the completion if enabled
        if (trackInteractions) {
          await contextualDataCompletionService.trackContextCompletion(
            user.id,
            `gap-${gap.id}`,
            [gap],
            'accepted'
          );
        }
      }
      
      return success;
    } catch (error) {
       
     
    // eslint-disable-next-line no-console
    console.error('Error completing gap: ', error);
      return false;
    }
  }, [user?.id, trackInteractions]);

  /**
   * Complete multiple gaps at once
   */
  const completeGaps = useCallback(async (gaps: ContextGap[], values: Record<string, any>): Promise<ContextGap[]> => {
    if (!user?.id) return [];

    const completedGaps: ContextGap[] = [];
    
    for (const gap of gaps) {
      const value = values[gap.field];
      if (value) {
        const success = await completeGap(gap, value);
        if (success) {
          completedGaps.push(gap);
        }
      }
    }
    
    return completedGaps;
  }, [completeGap]);

  /**
   * Complete an entire suggestion
   */
  const completeSuggestion = useCallback(async (suggestion: ContextCompletionSuggestion): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      // If it has a one-click fill action, use that
      if (suggestion.oneClickFill && suggestion.fillAction) {
        await suggestion.fillAction();
        
        // Mark all gaps as completed
        suggestion.gaps.forEach(gap => {
          setCompletedGapIds(prev => new Set(prev).add(gap.id));
        });
        
        // Track the completion
        if (trackInteractions) {
          await contextualDataCompletionService.trackContextCompletion(
            user.id,
            suggestion.id,
            suggestion.gaps,
            'accepted'
          );
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
       
     
    // eslint-disable-next-line no-console
    console.error('Error completing suggestion: ', error);
      return false;
    }
  }, [user?.id, trackInteractions]);

  /**
   * Dismiss a suggestion
   */
  const dismissSuggestion = useCallback(async (suggestion: ContextCompletionSuggestion): Promise<void> => {
    if (!user?.id) return;

    // Remove from current suggestions
    setState(prev => ({
      ...prev,
      suggestions: prev.suggestions.filter(s => s.id !== suggestion.id)
    }));
    
    // Track the dismissal
    if (trackInteractions) {
      try {
        await contextualDataCompletionService.trackContextCompletion(
          user.id,
          suggestion.id,
          suggestion.gaps,
          'rejected'
        );
      } catch (error) {
         
     
    // eslint-disable-next-line no-console
    console.error('Error tracking suggestion dismissal: ', error);
      }
    }
  }, [user?.id, trackInteractions]);

  /**
   * Defer a suggestion for later
   */
  const deferSuggestion = useCallback(async (suggestion: ContextCompletionSuggestion): Promise<void> => {
    if (!user?.id) return;

    // Remove from current suggestions (they'll come back on next load)
    setState(prev => ({
      ...prev,
      suggestions: prev.suggestions.filter(s => s.id !== suggestion.id)
    }));
    
    // Track the deferral
    if (trackInteractions) {
      try {
        await contextualDataCompletionService.trackContextCompletion(
          user.id,
          suggestion.id,
          suggestion.gaps,
          'deferred'
        );
      } catch (error) {
         
     
    // eslint-disable-next-line no-console
    console.error('Error tracking suggestion deferral: ', error);
      }
    }
  }, [user?.id, trackInteractions]);

  /**
   * Clear all current suggestions
   */
  const clearSuggestions = useCallback(() => {
    setState(prev => ({
      ...prev,
      suggestions: [],
      conversationAnalysis: null
    }));
  }, []);

  /**
   * Reset completion state
   */
  const resetCompletion = useCallback(() => {
    setCompletedGapIds(new Set());
    setState(prev => ({
      ...prev,
      suggestions: [],
      conversationAnalysis: null,
      loading: false,
      error: null,
      totalGaps: 0,
      completedGaps: 0,
      completionPercentage: 0
    }));
    analysisCache.current.clear();
  }, []);

  /**
   * Get completion status for a specific gap
   */
  const isGapCompleted = useCallback((gapId: string): boolean => {
    return completedGapIds.has(gapId);
  }, [completedGapIds]);

  /**
   * Get completion status for a suggestion
   */
  const getSuggestionStatus = useCallback((suggestion: ContextCompletionSuggestion) => {
    const completed = suggestion.gaps.filter(g => completedGapIds.has(g.id)).length;
    const total = suggestion.gaps.length;
    const isFullyCompleted = completed === total;
    const isPartiallyCompleted = completed > 0 && completed < total;
    
    return {
      completed,
      total,
      percentage: total > 0 ? (completed / total) * 100: 0,
      isFullyCompleted,
      isPartiallyCompleted,
      isNotStarted: completed === 0
    };
  }, [completedGapIds]);

  /**
   * Auto-analyze conversation when chat messages are received
   */
  const autoAnalyzeMessage = useCallback(async (
    userMessage: string,
    aiResponse: string,
    department?: string
  ) => {
    if (autoAnalyze && user?.id) {
      await analyzeConversation(userMessage, aiResponse, department);
    }
  }, [autoAnalyze, analyzeConversation, user?.id]);

  return {
    // State
    ...state,
    isGapCompleted,
    getSuggestionStatus,
    
    // Actions
    loadProactiveSuggestions,
    analyzeConversation,
    generateContextualSuggestions,
    completeGap,
    completeGaps,
    completeSuggestion,
    dismissSuggestion,
    deferSuggestion,
    clearSuggestions,
    resetCompletion,
    autoAnalyzeMessage,
    
    // Utilities
    hasHighPrioritySuggestions: state.suggestions.some(s => s.priority === 'high'),
    hasCriticalGaps: state.suggestions.some(s => s.gaps.some(g => g.severity === 'critical')),
    needsAttention: state.suggestions.length > 0 && state.completionPercentage < 50
  };
};

export default useContextualDataCompletion; 
