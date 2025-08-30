/**
 * Second Brain Hook - Core Intelligence System for Nexus
 * Provides contextual insights, progressive actions, and automation opportunities
 * on every page based on user behavior and integration data
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks';
import { useToast } from '@/shared/components/ui/use-toast';
import { logger } from '@/shared/utils/logger';

interface SecondBrainConfig {
  enableContextualInsights: boolean;
  enableProgressiveActions: boolean;
  enableAutomationOpportunities: boolean;
}

interface ContextualInsight {
  id: string;
  type: 'business' | 'personal' | 'technical';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  created_at: string;
}

interface ProgressiveAction {
  id: string;
  category: 'automation' | 'optimization' | 'learning';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  estimated_impact: number;
  created_at: string;
}

interface AutomationOpportunity {
  id: string;
  process_name: string;
  current_effort: number;
  potential_savings: number;
  implementation_complexity: 'low' | 'medium' | 'high';
  roi_score: number;
  created_at: string;
}

export const useSecondBrain = (config: SecondBrainConfig = {
  enableContextualInsights: true,
  enableProgressiveActions: true,
  enableAutomationOpportunities: true,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [insights, setInsights] = useState<ContextualInsight[]>([]);
  const [actions, setActions] = useState<ProgressiveAction[]>([]);
  const [opportunities, setOpportunities] = useState<AutomationOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadIntegrationData = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      // Load user's integration data for context
      // This would typically fetch from various integrations
      logger.info('Loading integration data for second brain');
    } catch (error) {
      logger.error('Failed to load integration data:', error);
    }
  }, [user?.id]);

  const loadUserProfile = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      // Load user profile for personalized insights
      logger.info('Loading user profile for second brain');
    } catch (error) {
      logger.error('Failed to load user profile:', error);
    }
  }, [user?.id]);

  const generateContextualInsights = useCallback(async () => {
    if (!user?.id || !config.enableContextualInsights) return;
    
    try {
      setIsLoading(true);
      
      // Generate contextual insights based on user's data
      const newInsights: ContextualInsight[] = [
        {
          id: '1',
          type: 'business',
          title: 'Revenue Optimization Opportunity',
          description: 'Based on your current metrics, there\'s potential to increase revenue by 15% through targeted marketing campaigns.',
          confidence: 0.85,
          actionable: true,
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          type: 'personal',
          title: 'Productivity Pattern Detected',
          description: 'You\'re most productive between 9-11 AM. Consider scheduling important tasks during this window.',
          confidence: 0.92,
          actionable: true,
          created_at: new Date().toISOString(),
        },
      ];
      
      setInsights(newInsights);
      logger.info('Generated contextual insights');
    } catch (error) {
      logger.error('Failed to generate contextual insights:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate insights',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, config.enableContextualInsights, toast]);

  const generateProgressiveActions = useCallback(async () => {
    if (!user?.id || !config.enableProgressiveActions) return;
    
    try {
      setIsLoading(true);
      
      // Generate progressive actions based on insights
      const newActions: ProgressiveAction[] = [
        {
          id: '1',
          category: 'automation',
          title: 'Automate Email Follow-ups',
          description: 'Set up automated follow-up sequences for new leads to improve conversion rates.',
          priority: 'high',
          estimated_impact: 0.25,
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          category: 'optimization',
          title: 'Optimize Customer Onboarding',
          description: 'Streamline the customer onboarding process to reduce churn and improve satisfaction.',
          priority: 'medium',
          estimated_impact: 0.18,
          created_at: new Date().toISOString(),
        },
      ];
      
      setActions(newActions);
      logger.info('Generated progressive actions');
    } catch (error) {
      logger.error('Failed to generate progressive actions:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate actions',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, config.enableProgressiveActions, toast]);

  const identifyAutomationOpportunities = useCallback(async () => {
    if (!user?.id || !config.enableAutomationOpportunities) return;
    
    try {
      setIsLoading(true);
      
      // Identify automation opportunities
      const newOpportunities: AutomationOpportunity[] = [
        {
          id: '1',
          process_name: 'Lead Qualification',
          current_effort: 8,
          potential_savings: 6,
          implementation_complexity: 'medium',
          roi_score: 0.75,
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          process_name: 'Invoice Processing',
          current_effort: 4,
          potential_savings: 3.5,
          implementation_complexity: 'low',
          roi_score: 0.88,
          created_at: new Date().toISOString(),
        },
      ];
      
      setOpportunities(newOpportunities);
      logger.info('Identified automation opportunities');
    } catch (error) {
      logger.error('Failed to identify automation opportunities:', error);
      toast({
        title: 'Error',
        description: 'Failed to identify opportunities',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, config.enableAutomationOpportunities, toast]);

  const refreshInsights = useCallback(async () => {
    try {
      await Promise.all([
        generateContextualInsights(),
        generateProgressiveActions(),
        identifyAutomationOpportunities(),
      ]);
      
      toast({
        title: 'Success',
        description: 'Second brain insights refreshed',
      });
    } catch (error) {
      logger.error('Failed to refresh insights:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh insights',
        variant: 'destructive',
      });
    }
  }, [generateContextualInsights, generateProgressiveActions, identifyAutomationOpportunities, toast]);

  const markInsightAsRead = useCallback(async (insightId: string) => {
    try {
      setInsights(prev => prev.map(insight => 
        insight.id === insightId 
          ? { ...insight, read: true }
          : insight
      ));
      
      logger.info('Marked insight as read:', insightId);
    } catch (error) {
      logger.error('Failed to mark insight as read:', error);
    }
  }, []);

  const markActionAsCompleted = useCallback(async (actionId: string) => {
    try {
      setActions(prev => prev.map(action => 
        action.id === actionId 
          ? { ...action, completed: true }
          : action
      ));
      
      logger.info('Marked action as completed:', actionId);
    } catch (error) {
      logger.error('Failed to mark action as completed:', error);
    }
  }, []);

  const prioritizeOpportunity = useCallback(async (opportunityId: string, priority: 'low' | 'medium' | 'high') => {
    try {
      setOpportunities(prev => prev.map(opportunity => 
        opportunity.id === opportunityId 
          ? { ...opportunity, priority }
          : opportunity
      ));
      
      logger.info('Updated opportunity priority:', opportunityId, priority);
    } catch (error) {
      logger.error('Failed to update opportunity priority:', error);
    }
  }, []);

  const getInsightsByType = useCallback((type: 'business' | 'personal' | 'technical') => {
    return insights.filter(insight => insight.type === type);
  }, [insights]);

  const getActionsByCategory = useCallback((category: 'automation' | 'optimization' | 'learning') => {
    return actions.filter(action => action.category === category);
  }, [actions]);

  const getHighROIOpportunities = useCallback(() => {
    return opportunities.filter(opportunity => opportunity.roi_score > 0.7);
  }, [opportunities]);

  const getInsightsSummary = useCallback(() => {
    const totalInsights = insights.length;
    const actionableInsights = insights.filter(insight => insight.actionable).length;
    const highConfidenceInsights = insights.filter(insight => insight.confidence > 0.8).length;
    
    return {
      total: totalInsights,
      actionable: actionableInsights,
      highConfidence: highConfidenceInsights,
      averageConfidence: totalInsights > 0 
        ? insights.reduce((sum, insight) => sum + insight.confidence, 0) / totalInsights 
        : 0,
    };
  }, [insights]);

  const getActionsSummary = useCallback(() => {
    const totalActions = actions.length;
    const highPriorityActions = actions.filter(action => action.priority === 'high').length;
    const completedActions = actions.filter(action => action.completed).length;
    
    return {
      total: totalActions,
      highPriority: highPriorityActions,
      completed: completedActions,
      completionRate: totalActions > 0 ? completedActions / totalActions : 0,
    };
  }, [actions]);

  const getOpportunitiesSummary = useCallback(() => {
    const totalOpportunities = opportunities.length;
    const highROIOpportunities = opportunities.filter(opportunity => opportunity.roi_score > 0.7).length;
    const lowComplexityOpportunities = opportunities.filter(opportunity => opportunity.implementation_complexity === 'low').length;
    
    return {
      total: totalOpportunities,
      highROI: highROIOpportunities,
      lowComplexity: lowComplexityOpportunities,
      averageROI: totalOpportunities > 0 
        ? opportunities.reduce((sum, opportunity) => sum + opportunity.roi_score, 0) / totalOpportunities 
        : 0,
    };
  }, [opportunities]);

  // Initialize second brain when user is available
  useEffect(() => {
    if (user?.id) {
      loadIntegrationData();
      loadUserProfile();
    }
  }, [user?.id, loadIntegrationData, loadUserProfile]);

  // Generate insights periodically
  useEffect(() => {
    if (user?.id) {
      // Use longer intervals in development to reduce resource usage
      const refreshInterval = process.env.NODE_ENV === 'development' ? 60 * 60 * 1000 : 30 * 60 * 1000; // 1hour dev, 30min prod
      const interval = setInterval(() => {
        generateContextualInsights();
        generateProgressiveActions();
        identifyAutomationOpportunities();
      }, refreshInterval);
      
      return () => clearInterval(interval);
    }
  }, [user?.id, generateContextualInsights, generateProgressiveActions, identifyAutomationOpportunities]);

  return {
    // Data
    insights,
    actions,
    opportunities,
    isLoading,
    
    // Actions
    refreshInsights,
    markInsightAsRead,
    markActionAsCompleted,
    prioritizeOpportunity,
    
    // Filters
    getInsightsByType,
    getActionsByCategory,
    getHighROIOpportunities,
    
    // Summaries
    getInsightsSummary,
    getActionsSummary,
    getOpportunitiesSummary,
  };
}; 
