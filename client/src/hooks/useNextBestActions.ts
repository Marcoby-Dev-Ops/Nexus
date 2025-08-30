import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/index';
import { useUserProfile } from '@/shared/contexts/UserContext';
import { nextBestActionService, type NextBestAction, type DelegationTarget } from '@/services/ai/NextBestActionService';
import { logger } from '@/shared/utils/logger';

export interface UseNextBestActionsReturn {
  actions: NextBestAction[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  executeAction: (actionId: string, executionData?: any) => Promise<any>;
  delegateAction: (actionId: string, targetId: string) => Promise<any>;
  getDelegationTargets: (actionId: string) => Promise<DelegationTarget[]>;
  dismissAction: (actionId: string) => Promise<void>;
}

export function useNextBestActions(): UseNextBestActionsReturn {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [actions, setActions] = useState<NextBestAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generateActions = useCallback(async () => {
    if (!user?.id || !profile?.company_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await nextBestActionService.generateNextBestActions(
        user.id,
        profile.company_id
      );

      if (result.success && result.data) {
        setActions(result.data);
      } else {
        setError(result.error || 'Failed to generate actions');
        // Fallback to mock data for demo purposes
        setActions(getMockActions());
      }
    } catch (err) {
      logger.error('Error generating next best actions:', err);
      setError('Failed to load actions');
      // Fallback to mock data
      setActions(getMockActions());
    } finally {
      setLoading(false);
    }
  }, [user?.id, profile?.company_id]);

  const refresh = useCallback(async () => {
    await generateActions();
  }, [generateActions]);

  const executeAction = useCallback(async (actionId: string, executionData?: any) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const result = await nextBestActionService.executeAction(actionId, user.id, executionData);
      
      if (result.success) {
        // Update the action status in local state
        setActions(prev => prev.map(action => 
          action.id === actionId 
            ? { ...action, status: 'completed' as const }
            : action
        ));
        
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to execute action');
      }
    } catch (err) {
      logger.error('Error executing action:', err);
      throw err;
    }
  }, [user?.id]);

  const delegateAction = useCallback(async (actionId: string, targetId: string) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const result = await nextBestActionService.delegateAction(actionId, targetId, user.id);
      
      if (result.success) {
        // Update the action status in local state
        setActions(prev => prev.map(action => 
          action.id === actionId 
            ? { ...action, status: 'delegated' as const }
            : action
        ));
        
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to delegate action');
      }
    } catch (err) {
      logger.error('Error delegating action:', err);
      throw err;
    }
  }, [user?.id]);

  const getDelegationTargets = useCallback(async (actionId: string) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const result = await nextBestActionService.getDelegationTargets(user.id, actionId);
      
      if (result.success && result.data) {
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to get delegation targets');
      }
    } catch (err) {
      logger.error('Error getting delegation targets:', err);
      throw err;
    }
  }, [user?.id]);

  const dismissAction = useCallback(async (actionId: string) => {
    // Update local state immediately for better UX
    setActions(prev => prev.map(action => 
      action.id === actionId 
        ? { ...action, status: 'dismissed' as const }
        : action
    ));

    // TODO: Implement actual dismissal in the service
    logger.info('Action dismissed:', actionId);
  }, []);

  // Load actions on mount and when dependencies change
  useEffect(() => {
    generateActions();
  }, [generateActions]);

  return {
    actions,
    loading,
    error,
    refresh,
    executeAction,
    delegateAction,
    getDelegationTargets,
    dismissAction
  };
}

// Mock data for fallback and demo purposes
function getMockActions(): NextBestAction[] {
  return [
    {
      id: '1',
      title: 'Review Q4 Sales Pipeline',
      description: '3 high-value deals need attention - potential $45K revenue',
      priority: 'critical',
      category: 'sales',
      estimatedTime: '15 min',
      impact: 'High revenue impact',
      effort: 'medium',
      canDelegate: true,
      aiAssisted: true,
      requiresExpertise: ['sales', 'pipeline_management'],
      businessValue: 8,
      confidence: 0.85,
      dataSources: ['sales_pipeline', 'crm_data'],
      suggestedActions: [
        'Review deal progression',
        'Identify blockers',
        'Update deal values',
        'Schedule follow-ups'
      ],
      automationPotential: true,
      context: { deals: 3, value: 45000 },
      createdAt: new Date().toISOString(),
      status: 'active'
    },
    {
      id: '2',
      title: 'Optimize Marketing Campaign',
      description: 'Email campaign underperforming - 23% below target',
      priority: 'high',
      category: 'marketing',
      estimatedTime: '30 min',
      impact: 'Lead generation boost',
      effort: 'medium',
      canDelegate: true,
      aiAssisted: true,
      requiresExpertise: ['marketing', 'email_campaigns'],
      businessValue: 7,
      confidence: 0.8,
      dataSources: ['email_analytics', 'conversion_data'],
      suggestedActions: [
        'Analyze open rates',
        'Test subject lines',
        'Optimize send times',
        'Segment audience'
      ],
      automationPotential: true,
      context: { performance: -23, target: 0 },
      createdAt: new Date().toISOString(),
      status: 'active'
    },
    {
      id: '3',
      title: 'Process Outstanding Invoices',
      description: '12 invoices pending - $18K in receivables',
      priority: 'medium',
      category: 'finance',
      estimatedTime: '20 min',
      impact: 'Cash flow improvement',
      effort: 'low',
      canDelegate: false,
      aiAssisted: false,
      requiresExpertise: ['accounts_receivable'],
      businessValue: 6,
      confidence: 0.9,
      dataSources: ['accounting_system'],
      suggestedActions: [
        'Send payment reminders',
        'Update payment terms',
        'Review aging report',
        'Contact overdue accounts'
      ],
      automationPotential: true,
      context: { invoices: 12, amount: 18000 },
      createdAt: new Date().toISOString(),
      status: 'active'
    },
    {
      id: '4',
      title: 'Review Business Processes',
      description: 'Identify automation opportunities in daily workflows',
      priority: 'low',
      category: 'ops',
      estimatedTime: '45 min',
      impact: 'Efficiency gains',
      effort: 'high',
      canDelegate: true,
      aiAssisted: true,
      requiresExpertise: ['process_optimization', 'automation'],
      businessValue: 5,
      confidence: 0.7,
      dataSources: ['workflow_data', 'time_tracking'],
      suggestedActions: [
        'Map current processes',
        'Identify bottlenecks',
        'Research automation tools',
        'Calculate ROI'
      ],
      automationPotential: true,
      context: { workflows: 8, automation_potential: 0.6 },
      createdAt: new Date().toISOString(),
      status: 'active'
    }
  ];
}
