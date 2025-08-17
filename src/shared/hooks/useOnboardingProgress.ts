import { useState, useCallback } from 'react';
import { selectData as select, selectOne, updateOne } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';

interface OnboardingStep {
  id: string;
  user_id: string;
  step_name: string;
  completed: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export const useOnboardingProgress = () => {
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async (userId: string) => {
    // Validate required parameters
    if (!userId || typeof userId !== 'string') {
      const errorMsg = 'User ID is required and must be a string';
      setError(errorMsg);
      logger.error(errorMsg);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await select('onboarding_steps', '*', { user_id: userId });
      
      if (error) {
        const errorMsg = 'Failed to fetch onboarding progress';
        setError(errorMsg);
        logger.error(errorMsg, { error, userId });
        return;
      }
      
      setSteps(data || []);
      logger.info('Onboarding progress fetched successfully', { userId, stepCount: data?.length || 0 });
    } catch (err) {
      const errorMsg = 'Error fetching onboarding progress';
      setError(errorMsg);
      logger.error(errorMsg, { err, userId });
    } finally {
      setLoading(false);
    }
  }, []);

  const completeStep = useCallback(async (userId: string, stepName: string) => {
    // Validate required parameters
    if (!userId || typeof userId !== 'string') {
      const errorMsg = 'User ID is required and must be a string';
      setError(errorMsg);
      logger.error(errorMsg);
      return null;
    }

    if (!stepName || typeof stepName !== 'string') {
      const errorMsg = 'Step name is required and must be a string';
      setError(errorMsg);
      logger.error(errorMsg);
      return null;
    }

    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await updateOne('onboarding_steps', 
        { user_id: userId, step_name: stepName }, 
        {
          completed: true,
          completed_at: new Date().toISOString(),
        }
      );
      
      if (error) {
        const errorMsg = 'Failed to complete onboarding step';
        setError(errorMsg);
        logger.error(errorMsg, { error, userId, stepName });
        return null;
      }
      
      // Update local state
      setSteps(prev => prev.map(step => 
        step.step_name === stepName 
          ? { ...step, completed: true, completed_at: new Date().toISOString() }
          : step
      ));
      
      logger.info('Onboarding step completed successfully', { userId, stepName });
      return data;
    } catch (err) {
      const errorMsg = 'Error completing onboarding step';
      setError(errorMsg);
      logger.error(errorMsg, { err, userId, stepName });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getProgressPercentage = useCallback(() => {
    if (steps.length === 0) return 0;
    const completedSteps = steps.filter(step => step.completed).length;
    return Math.round((completedSteps / steps.length) * 100);
  }, [steps]);

  return {
    steps,
    loading,
    error,
    fetchProgress,
    completeStep,
    getProgressPercentage,
  };
}; 