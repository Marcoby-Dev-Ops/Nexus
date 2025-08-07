import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks';
import { 
  validateOnboardingCompletion, 
  isOnboardingTrulyCompleted, 
  getValidationReport,
  type OnboardingValidationResult 
} from '@/shared/utils/onboardingValidation';
import { logger } from '@/shared/utils/logger';

/**
 * React hook for onboarding validation
 * Provides real-time validation of onboarding completion status
 */
export const useOnboardingValidation = () => {
  const { user } = useAuth();
  const [validationResult, setValidationResult] = useState<OnboardingValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Validate onboarding completion
   */
  const validateOnboarding = useCallback(async () => {
    if (!user?.id) {
      const errorMsg = 'User not authenticated';
      setError(errorMsg);
      logger.error(errorMsg);
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await validateOnboardingCompletion(user.id);
      setValidationResult(result);
      logger.info('Onboarding validation completed', { userId: user.id, isValid: result.isValid });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Validation failed';
      setError(errorMessage);
      logger.error('Onboarding validation error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  /**
   * Check if onboarding is truly completed
   */
  const checkCompletion = useCallback(async (): Promise<boolean> => {
    if (!user?.id) {
      logger.error('Cannot check completion: user not authenticated');
      return false;
    }

    try {
      const isCompleted = await isOnboardingTrulyCompleted(user.id);
      logger.info('Onboarding completion check completed', { userId: user.id, isCompleted });
      return isCompleted;
    } catch (err) {
      logger.error('Error checking onboarding completion:', err);
      return false;
    }
  }, [user?.id]);

  /**
   * Get detailed validation report
   */
  const getReport = useCallback(async (): Promise<OnboardingValidationResult | null> => {
    if (!user?.id) {
      const errorMsg = 'User not authenticated';
      setError(errorMsg);
      logger.error(errorMsg);
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getValidationReport(user.id);
      setValidationResult(result);
      logger.info('Validation report generated', { userId: user.id, isValid: result.isValid });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get report';
      setError(errorMessage);
      logger.error('Error getting validation report:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  /**
   * Auto-validate on mount and when user changes
   */
  useEffect(() => {
    if (user?.id) {
      validateOnboarding();
    }
  }, [user?.id, validateOnboarding]);

  return {
    // State
    validationResult,
    isLoading,
    error,
    
    // Actions
    validateOnboarding,
    checkCompletion,
    getReport,
    
    // Computed values
    isCompleted: validationResult?.isValid ?? false,
    completionPercentage: validationResult?.completionPercentage ?? 0,
    missingFields: validationResult?.missingFields ?? [],
    mismatchedFields: validationResult?.mismatchedFields ?? [],
    recommendations: validationResult?.recommendations ?? [],
    
    // Detailed validation
    userProfileValidation: validationResult?.validationDetails.userProfile,
    companyProfileValidation: validationResult?.validationDetails.companyProfile,
    onboardingDataValidation: validationResult?.validationDetails.onboardingData
  };
};

export default useOnboardingValidation; 