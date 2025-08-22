import { useState, useCallback } from 'react';
import { selectData, selectOne, updateOne, insertOne } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';

interface OnboardingStep {
  id: string;
  user_id: string;
  step_id: string;
  step_data?: any;
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
      const { data, error } = await selectData('user_onboarding_steps', '*', { user_id: userId });
      
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
      // First, check if the step already exists
      const { data: existingStep, error: selectError } = await selectData(
        'user_onboarding_steps',
        'id',
        { user_id: userId, step_id: stepName }
      );

      if (selectError) {
        const errorMsg = 'Failed to check existing step';
        setError(errorMsg);
        logger.error(errorMsg, { error: selectError, userId, stepName });
        return null;
      }

      let result;
      if (existingStep && existingStep.length > 0) {
        // Update existing step
        const stepId = existingStep[0].id;
        result = await updateOne('user_onboarding_steps', stepId, {
          completed_at: new Date().toISOString(),
        });
      } else {
        // Insert new step
        const { data: insertData, error: insertError } = await insertOne('user_onboarding_steps', {
          user_id: userId,
          step_id: stepName,
          step_data: {},
          completed_at: new Date().toISOString(),
        });
        
        if (insertError) {
          const errorMsg = 'Failed to insert onboarding step';
          setError(errorMsg);
          logger.error(errorMsg, { error: insertError, userId, stepName });
          return null;
        }
        
        result = { data: insertData, error: null };
      }
      
      if (result.error) {
        const errorMsg = 'Failed to complete onboarding step';
        setError(errorMsg);
        logger.error(errorMsg, { error: result.error, userId, stepName });
        return null;
      }
      
      // Update local state
      setSteps(prev => prev.map(step => 
        step.step_id === stepName 
          ? { ...step, completed_at: new Date().toISOString() }
          : step
      ));
      
      logger.info('Onboarding step completed successfully', { userId, stepName });
      return result.data;
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
    const completedSteps = steps.filter(step => step.completed_at).length;
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