/**
 * React hook for onboarding verification
 * Provides easy access to verification functionality
 */

import { useState, useCallback, useEffect } from 'react';
import { useAuthContext } from '@/domains/admin/user/hooks/AuthContext';
import { onboardingVerificationService } from '../services/onboardingVerificationService';
import type { VerificationResult } from '../services/onboardingVerificationService';

export interface UseOnboardingVerificationReturn {
  // State
  isVerifying: boolean;
  verificationResult: VerificationResult | null;
  error: string | null;
  
  // Actions
  verifyOnboarding: () => Promise<void>;
  quickVerify: () => { isComplete: boolean; issues: string[] };
  resetVerification: () => void;
  
  // Computed
  isComplete: boolean;
  hasIssues: boolean;
  issues: string[];
}

export function useOnboardingVerification(): UseOnboardingVerificationReturn {
  const { user } = useAuthContext();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const verifyOnboarding = useCallback(async () => {
    if (!user?.id) {
      setError('No authenticated user found');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const result = await onboardingVerificationService.verifyOnboardingCompletion(user.id);
      setVerificationResult(result);
      
      if (!result.success) {
        console.warn('Onboarding verification failed:', result.summary);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Verification failed';
      setError(errorMessage);
      console.error('Onboarding verification error:', err);
    } finally {
      setIsVerifying(false);
    }
  }, [user?.id]);

  const quickVerify = useCallback(() => {
    return onboardingVerificationService.quickVerify();
  }, []);

  const resetVerification = useCallback(() => {
    setVerificationResult(null);
    setError(null);
  }, []);

  // Computed values
  const isComplete = verificationResult?.success ?? false;
  const hasIssues = verificationResult ? !verificationResult.success : false;
  const issues = verificationResult?.checks
    .filter(check => check.status === 'fail')
    .map(check => check.message) ?? [];

  return {
    // State
    isVerifying,
    verificationResult,
    error,
    
    // Actions
    verifyOnboarding,
    quickVerify,
    resetVerification,
    
    // Computed
    isComplete,
    hasIssues,
    issues
  };
}

/**
 * Hook for automatic verification on component mount
 */
export function useAutoVerification(autoVerify = true) {
  const verification = useOnboardingVerification();
  
  // Auto-verify on mount if requested
  useEffect(() => {
    if (autoVerify && !verification.isVerifying && !verification.verificationResult) {
      verification.verifyOnboarding();
    }
  }, [autoVerify, verification.isVerifying, verification.verificationResult]);

  return verification;
} 