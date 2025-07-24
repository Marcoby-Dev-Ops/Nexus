/**
 * useBrainOnboarding Hook
 * Manages brain onboarding state and backend integration
 * Provides FIRE cycle tracking and intelligence updates
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/core/auth/AuthProvider';
import { brainOnboardingService, type BrainOnboardingSession } from '../services/brainOnboardingService';

export interface BrainOnboardingState {
  session: BrainOnboardingSession | null;
  isLoading: boolean;
  error: string | null;
  currentStep: number;
  completedSteps: string[];
  systemIntelligence: {
    understandingLevel: number;
    personalizedInsights: number;
    contextAccuracy: number;
    recommendationRelevance: number;
    learningProgress: number;
  };
  userProfile: {
    company: Record<string, any>;
    user: Record<string, any>;
    business: Record<string, any>;
  };
  brainAnalysis: {
    actionAnalysis: Record<string, any>;
    expertKnowledge: Record<string, any>;
    progressiveLearning: Record<string, any>;
  };
  insights: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    category: string;
    impact: string;
    confidence: number;
  }>;
  actions: Array<{
    id: string;
    type: string;
    stepId: string;
    data: Record<string, any>;
    fireCyclePhase: string;
    intelligenceGain: number;
  }>;
}

export interface BrainOnboardingActions {
  initializeSession: () => Promise<void>;
  updateStep: (stepData: Partial<BrainOnboardingState>) => Promise<void>;
  recordAction: (action: {
    type: 'feedback' | 'insight' | 'recommendation' | 'execution';
    stepId: string;
    data: Record<string, any>;
    fireCyclePhase: 'feedback' | 'insight' | 'recommendation' | 'execution';
  }) => Promise<void>;
  generateInsight: (insight: {
    type: string;
    title: string;
    description: string;
    category: string;
    impact: string;
    confidence: number;
  }) => Promise<void>;
  saveContext: (context: Record<string, any>) => Promise<void>;
  saveGoal: (goal: Record<string, any>) => Promise<void>;
  saveDepartmentConfig: (config: Record<string, any>) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  clearSession: () => void;
}

export function useBrainOnboarding(): [BrainOnboardingState, BrainOnboardingActions] {
  const { user } = useAuth();
  const [state, setState] = useState<BrainOnboardingState>({
    session: null,
    isLoading: true,
    error: null,
    currentStep: 0,
    completedSteps: [],
    systemIntelligence: {
      understandingLevel: 0,
      personalizedInsights: 0,
      contextAccuracy: 0,
      recommendationRelevance: 0,
      learningProgress: 0
    },
    userProfile: {
      company: {},
      user: {},
      business: {}
    },
    brainAnalysis: {
      actionAnalysis: {},
      expertKnowledge: {},
      progressiveLearning: {}
    },
    insights: [],
    actions: []
  });

  const initializeSession = useCallback(async () => {
    if (!user?.id) return;

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const sessionData = await brainOnboardingService.createOrGetSession(user.id);
      
      // Load session data
      const insights = await brainOnboardingService.getSessionInsights(sessionData.id);
      const actions = await brainOnboardingService.getSessionActions(sessionData.id);
      
      setState(prev => ({
        ...prev,
        session: sessionData,
        currentStep: sessionData.current_step || 0,
        completedSteps: sessionData.completed_steps || [],
        systemIntelligence: sessionData.system_intelligence || prev.systemIntelligence,
        userProfile: sessionData.user_profile || prev.userProfile,
        brainAnalysis: sessionData.brain_analysis || prev.brainAnalysis,
        insights,
        actions,
        isLoading: false
      }));
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error initializing brain onboarding session: ', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to initialize session',
        isLoading: false
      }));
    }
  }, [user?.id]);

  const updateStep = useCallback(async (stepData: Partial<BrainOnboardingState>) => {
    if (!state.session?.id) return;

    try {
      // Update session progress
      await brainOnboardingService.updateSessionProgress(state.session.id, {
        currentstep: state.currentStep + 1,
        completedsteps: [...state.completedSteps, stepData.currentStep?.toString() || ''],
        userprofile: stepData.userProfile || state.userProfile,
        brainanalysis: stepData.brainAnalysis || state.brainAnalysis,
        systemintelligence: stepData.systemIntelligence || state.systemIntelligence
      });

      setState(prev => ({
        ...prev,
        ...stepData,
        currentStep: prev.currentStep + 1,
        completedSteps: [...prev.completedSteps, stepData.currentStep?.toString() || '']
      }));
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error updating step: ', error);
      setState(prev => ({ ...prev, error: 'Failed to update step' }));
    }
  }, [state.session?.id, state.currentStep, state.completedSteps, state.userProfile, state.brainAnalysis, state.systemIntelligence]);

  const recordAction = useCallback(async (action: {
    type: 'feedback' | 'insight' | 'recommendation' | 'execution';
    stepId: string;
    data: Record<string, any>;
    fireCyclePhase: 'feedback' | 'insight' | 'recommendation' | 'execution';
  }) => {
    if (!state.session?.id) return;

    try {
      const recordedAction = await brainOnboardingService.recordFireAction(state.session.id, {
        actiontype: action.type,
        stepid: action.stepId,
        actiondata: action.data,
        firecycle_phase: action.fireCyclePhase,
        intelligencegain: 0
      });

      setState(prev => ({
        ...prev,
        actions: [recordedAction, ...prev.actions]
      }));
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error recording action: ', error);
    }
  }, [state.session?.id]);

  const generateInsight = useCallback(async (insight: {
    type: string;
    title: string;
    description: string;
    category: string;
    impact: string;
    confidence: number;
  }) => {
    if (!state.session?.id) return;

    try {
      const generatedInsight = await brainOnboardingService.generateInsight(state.session.id, {
        insighttype: insight.type as any,
        title: insight.title,
        description: insight.description,
        category: insight.category,
        impact: insight.impact as any,
        confidence: insight.confidence,
        stepid: state.currentStep.toString(),
        brainintegration_type: 'expert-guidance'
      });

      setState(prev => ({
        ...prev,
        insights: [generatedInsight, ...prev.insights]
      }));
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error generating insight: ', error);
    }
  }, [state.session?.id, state.currentStep]);

  const saveContext = useCallback(async (context: Record<string, any>) => {
    if (!state.session?.id) return;

    try {
      await brainOnboardingService.saveContextCollection(state.session.id, {
        contextcategory: 'company',
        fieldid: 'context_data',
        fieldlabel: 'Business Context',
        fieldvalue: JSON.stringify(context),
        fieldweight: 10,
        intelligenceimpact: 15,
        insightsgenerated: 1
      });
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error saving context: ', error);
    }
  }, [state.session?.id]);

  const saveGoal = useCallback(async (goal: Record<string, any>) => {
    if (!state.session?.id) return;

    try {
      await brainOnboardingService.saveGoal(state.session.id, {
        goaltype: 'primary',
        title: goal.title || 'Business Goal',
        description: goal.description,
        category: goal.category || 'growth',
        priority: goal.priority || 'medium',
        targetvalue: goal.targetValue,
        currentvalue: goal.currentValue,
        unit: goal.unit,
        timeframe: goal.timeframe,
        confidence: goal.confidence || 0.8
      });
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error saving goal: ', error);
    }
  }, [state.session?.id]);

  const saveDepartmentConfig = useCallback(async (config: Record<string, any>) => {
    if (!state.session?.id) return;

    try {
      await brainOnboardingService.saveDepartmentConfig(state.session.id, {
        departmentname: config.name,
        departmenttype: config.type,
        isactive: config.isActive || true,
        aiagents: config.agents || [],
        intelligencemetrics: {
          understandingLevel: config.intelligence?.understandingLevel || 0,
          insightsGenerated: config.intelligence?.insightsGenerated || 0,
          recommendationsCount: config.intelligence?.recommendationsCount || 0,
          lastUpdated: new Date()
        },
        insights: config.insights || []
      });
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error saving department config: ', error);
    }
  }, [state.session?.id]);

  const completeOnboarding = useCallback(async () => {
    if (!state.session?.id) return;

    try {
      await brainOnboardingService.completeOnboarding(state.session.id, {
        finalState: state,
        completionTimestamp: new Date().toISOString()
      });

      brainOnboardingService.clearCurrentSession();
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error completing onboarding: ', error);
    }
  }, [state.session?.id, state]);

  const clearSession = useCallback(() => {
    brainOnboardingService.clearCurrentSession();
    setState(prev => ({
      ...prev,
      session: null,
      currentStep: 0,
      completedSteps: [],
      insights: [],
      actions: []
    }));
  }, []);

  // Initialize session on mount
  useEffect(() => {
    if (user?.id) {
      initializeSession();
    }
  }, [user?.id, initializeSession]);

  const actions: BrainOnboardingActions = {
    initializeSession,
    updateStep,
    recordAction,
    generateInsight,
    saveContext,
    saveGoal,
    saveDepartmentConfig,
    completeOnboarding,
    clearSession
  };

  return [state, actions];
} 