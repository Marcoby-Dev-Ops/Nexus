/**
 * Generic Page Orchestration Hook
 * Reusable orchestration system for any page with multiple components and data dependencies
 * Prevents race conditions, manages loading order, and provides unified error handling
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks';
import { logger } from '@/shared/utils/logger';

export interface OrchestrationStep {
  id: string;
  name: string;
  description: string;
  dependencies?: string[]; // IDs of steps that must complete first
  isRequired: boolean;
  estimatedDuration: number; // milliseconds
}

export interface OrchestrationState {
  // Core States
  isInitializing: boolean;
  isReady: boolean;
  hasErrors: boolean;
  
  // Step States
  completedSteps: Set<string>;
  failedSteps: Set<string>;
  currentStep: string | null;
  
  // Progress & Timing
  progress: number;
  startTime: number | null;
  estimatedCompletionTime: number | null;
  
  // Error Management
  errors: Array<{
    stepId: string;
    error: string;
    timestamp: number;
  }>;
  
  // Performance
  stepDurations: Record<string, number>;
}

export interface UsePageOrchestrationOptions {
  steps: OrchestrationStep[];
  onStepComplete?: (stepId: string) => void;
  onStepError?: (stepId: string, error: string) => void;
  onAllComplete?: () => void;
  retryAttempts?: number;
  retryDelay?: number;
  enableParallelExecution?: boolean;
}

export interface UsePageOrchestrationReturn {
  state: OrchestrationState;
  startOrchestration: () => Promise<void>;
  retryStep: (stepId: string) => Promise<void>;
  retryAllFailed: () => Promise<void>;
  reset: () => void;
  getStepStatus: (stepId: string) => 'pending' | 'running' | 'completed' | 'failed';
  getStepProgress: (stepId: string) => number;
  isStepReady: (stepId: string) => boolean;
}

export const usePageOrchestration = (options: UsePageOrchestrationOptions): UsePageOrchestrationReturn => {
  const { 
    steps, 
    onStepComplete, 
    onStepError, 
    onAllComplete,
    retryAttempts = 3,
    retryDelay = 1000,
    enableParallelExecution = false
  } = options;

  const { user, session, initialized } = useAuth();
  const [state, setState] = useState<OrchestrationState>({
    isInitializing: false,
    isReady: false,
    hasErrors: false,
    completedSteps: new Set(),
    failedSteps: new Set(),
    currentStep: null,
    progress: 0,
    startTime: null,
    estimatedCompletionTime: null,
    errors: [],
    stepDurations: {}
  });

  const orchestrationRef = useRef({
    isRunning: false,
    stepRetries: new Map<string, number>(),
    stepStartTimes: new Map<string, number>()
  });

  // Validate step dependencies
  const validateSteps = useCallback(() => {
    const stepIds = new Set(steps.map(s => s.id));
    const errors: string[] = [];

    steps.forEach(step => {
      if (step.dependencies) {
        step.dependencies.forEach(depId => {
          if (!stepIds.has(depId)) {
            errors.push(`Step "${step.id}" depends on non-existent step "${depId}"`);
          }
        });
      }
    });

    if (errors.length > 0) {
      throw new Error(`Orchestration configuration errors:\n${errors.join('\n')}`);
    }
  }, [steps]);

  // Get ready steps (dependencies satisfied)
  const getReadySteps = useCallback((completedSteps: Set<string>) => {
    return steps.filter(step => {
      // Skip if already completed or failed
      if (completedSteps.has(step.id) || state.failedSteps.has(step.id)) {
        return false;
      }

      // Check dependencies
      if (step.dependencies) {
        return step.dependencies.every(depId => completedSteps.has(depId));
      }

      return true;
    });
  }, [steps, state.failedSteps]);

  // Update progress calculation
  const updateProgress = useCallback((completedSteps: Set<string>) => {
    const totalSteps = steps.length;
    const completedCount = completedSteps.size;
    const progress = Math.round((completedCount / totalSteps) * 100);
    
    setState(prev => ({ ...prev, progress }));
  }, [steps.length]);

  // Execute a single step
  const executeStep = useCallback(async (step: OrchestrationStep): Promise<boolean> => {
    const stepStartTime = Date.now();
    orchestrationRef.current.stepStartTimes.set(step.id, stepStartTime);

    setState(prev => ({ 
      ...prev, 
      currentStep: step.id 
    }));

    logger.info(`Executing orchestration step: ${step.name}`, { stepId: step.id });

    try {
      // Call the step completion callback
      if (onStepComplete) {
        await onStepComplete(step.id);
      }

      const stepDuration = Date.now() - stepStartTime;
      
      setState(prev => ({
        ...prev,
        completedSteps: new Set([...prev.completedSteps, step.id]),
        stepDurations: { ...prev.stepDurations, [step.id]: stepDuration }
      }));

      logger.info(`Step completed: ${step.name}`, { 
        stepId: step.id, 
        duration: stepDuration 
      });

      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const retryCount = orchestrationRef.current.stepRetries.get(step.id) || 0;

      if (retryCount < retryAttempts) {
        // Retry the step
        orchestrationRef.current.stepRetries.set(step.id, retryCount + 1);
        
        logger.warn(`Retrying step: ${step.name}`, { 
          stepId: step.id, 
          retryCount: retryCount + 1,
          error: errorMessage 
        });

        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return executeStep(step);

      } else {
        // Step failed permanently
        setState(prev => ({
          ...prev,
          failedSteps: new Set([...prev.failedSteps, step.id]),
          hasErrors: true,
          errors: [...prev.errors, {
            stepId: step.id,
            error: errorMessage,
            timestamp: Date.now()
          }]
        }));

        if (onStepError) {
          onStepError(step.id, errorMessage);
        }

        logger.error(`Step failed permanently: ${step.name}`, { 
          stepId: step.id, 
          error: errorMessage 
        });

        return false;
      }
    }
  }, [onStepComplete, onStepError, retryAttempts, retryDelay]);

  // Main orchestration logic
  const startOrchestration = useCallback(async () => {
    if (orchestrationRef.current.isRunning) {
      logger.warn('Orchestration already running');
      return;
    }

    // Validate configuration
    try {
      validateSteps();
    } catch (error) {
      logger.error('Orchestration validation failed', { error });
      return;
    }

    // Wait for auth to be ready
    if (!initialized || !user || !session) {
      logger.info('Waiting for authentication to be ready');
      return;
    }

    orchestrationRef.current.isRunning = true;
    
    setState(prev => ({
      ...prev,
      isInitializing: true,
      startTime: Date.now(),
      completedSteps: new Set(),
      failedSteps: new Set(),
      errors: [],
      stepDurations: {}
    }));

    logger.info('Starting page orchestration', { 
      totalSteps: steps.length,
      userId: user.id 
    });

    try {
      if (enableParallelExecution) {
        // Execute steps in parallel where possible
        await executeStepsParallel();
      } else {
        // Execute steps sequentially
        await executeStepsSequential();
      }

      // Check if all required steps completed
      const allRequiredCompleted = steps
        .filter(step => step.isRequired)
        .every(step => state.completedSteps.has(step.id));

      if (allRequiredCompleted) {
        setState(prev => ({ 
          ...prev, 
          isReady: true,
          estimatedCompletionTime: Date.now()
        }));

        if (onAllComplete) {
          onAllComplete();
        }

        logger.info('Page orchestration completed successfully');
      } else {
        setState(prev => ({ 
          ...prev, 
          hasErrors: true 
        }));
        logger.warn('Page orchestration completed with errors');
      }

    } catch (error) {
      logger.error('Page orchestration failed', { error });
      setState(prev => ({ 
        ...prev, 
        hasErrors: true 
      }));
    } finally {
      orchestrationRef.current.isRunning = false;
      setState(prev => ({ 
        ...prev, 
        isInitializing: false,
        currentStep: null
      }));
    }
  }, [
    initialized, user, session, steps, enableParallelExecution,
    onAllComplete, validateSteps
  ]);

  // Sequential execution
  const executeStepsSequential = useCallback(async () => {
    let completedSteps = new Set<string>();
    
    while (completedSteps.size < steps.length) {
      const readySteps = getReadySteps(completedSteps);
      
      if (readySteps.length === 0) {
        // No ready steps, check for circular dependencies
        const remainingSteps = steps.filter(s => !completedSteps.has(s.id));
        if (remainingSteps.length > 0) {
          throw new Error(`Circular dependency detected in steps: ${remainingSteps.map(s => s.id).join(', ')}`);
        }
        break;
      }

      // Execute the first ready step
      const step = readySteps[0];
      const success = await executeStep(step);
      
      if (success) {
        completedSteps = new Set([...completedSteps, step.id]);
        updateProgress(completedSteps);
      } else {
        // Step failed, but continue with other steps
        break;
      }
    }
  }, [steps, getReadySteps, executeStep, updateProgress]);

  // Parallel execution
  const executeStepsParallel = useCallback(async () => {
    const completedSteps = new Set<string>();
    
    while (completedSteps.size < steps.length) {
      const readySteps = getReadySteps(completedSteps);
      
      if (readySteps.length === 0) {
        break;
      }

      // Execute all ready steps in parallel
      const stepPromises = readySteps.map(step => executeStep(step));
      const results = await Promise.allSettled(stepPromises);
      
      // Update completed steps
      results.forEach((result, index) => {
        const step = readySteps[index];
        if (result.status === 'fulfilled' && result.value) {
          completedSteps.add(step.id);
        }
      });

      updateProgress(completedSteps);
    }
  }, [steps, getReadySteps, executeStep, updateProgress]);

  // Retry a specific step
  const retryStep = useCallback(async (stepId: string) => {
    const step = steps.find(s => s.id === stepId);
    if (!step) {
      throw new Error(`Step not found: ${stepId}`);
    }

    // Reset step state
    orchestrationRef.current.stepRetries.set(stepId, 0);
    setState(prev => ({
      ...prev,
      failedSteps: new Set([...prev.failedSteps].filter(id => id !== stepId)),
      errors: prev.errors.filter(e => e.stepId !== stepId)
    }));

    // Execute the step
    await executeStep(step);
  }, [steps, executeStep]);

  // Retry all failed steps
  const retryAllFailed = useCallback(async () => {
    const failedStepIds = Array.from(state.failedSteps);
    
    for (const stepId of failedStepIds) {
      await retryStep(stepId);
    }
  }, [state.failedSteps, retryStep]);

  // Reset orchestration
  const reset = useCallback(() => {
    orchestrationRef.current.isRunning = false;
    orchestrationRef.current.stepRetries.clear();
    orchestrationRef.current.stepStartTimes.clear();
    
    setState({
      isInitializing: false,
      isReady: false,
      hasErrors: false,
      completedSteps: new Set(),
      failedSteps: new Set(),
      currentStep: null,
      progress: 0,
      startTime: null,
      estimatedCompletionTime: null,
      errors: [],
      stepDurations: {}
    });
  }, []);

  // Utility functions
  const getStepStatus = useCallback((stepId: string) => {
    if (state.completedSteps.has(stepId)) return 'completed';
    if (state.failedSteps.has(stepId)) return 'failed';
    if (state.currentStep === stepId) return 'running';
    return 'pending';
  }, [state.completedSteps, state.failedSteps, state.currentStep]);

  const getStepProgress = useCallback((stepId: string) => {
    const step = steps.find(s => s.id === stepId);
    if (!step) return 0;
    
    const status = getStepStatus(stepId);
    if (status === 'completed') return 100;
    if (status === 'failed') return 0;
    if (status === 'running') {
      const startTime = orchestrationRef.current.stepStartTimes.get(stepId);
      if (startTime) {
        const elapsed = Date.now() - startTime;
        return Math.min(90, Math.round((elapsed / step.estimatedDuration) * 100));
      }
    }
    return 0;
  }, [steps, getStepStatus]);

  const isStepReady = useCallback((stepId: string) => {
    const step = steps.find(s => s.id === stepId);
    if (!step) return false;
    
    if (step.dependencies) {
      return step.dependencies.every(depId => state.completedSteps.has(depId));
    }
    
    return true;
  }, [steps, state.completedSteps]);

  // Auto-start when auth is ready
  useEffect(() => {
    if (initialized && user && session && !state.isInitializing && !state.isReady) {
      startOrchestration();
    }
  }, [initialized, user, session, startOrchestration, state.isInitializing, state.isReady]);

  return {
    state,
    startOrchestration,
    retryStep,
    retryAllFailed,
    reset,
    getStepStatus,
    getStepProgress,
    isStepReady
  };
};

