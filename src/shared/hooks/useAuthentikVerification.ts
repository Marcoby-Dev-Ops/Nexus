import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/index';
import { authentikUserVerificationService } from '@/core/auth/AuthentikUserVerificationService';
import type { UserVerificationStatus } from '@/core/auth/AuthentikUserVerificationService';
import { logger } from '@/shared/utils/logger';

/**
 * Hook to manage Authentik user verification
 * Provides easy access to verification status and actions
 */
export const useAuthentikVerification = () => {
  const { user } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<UserVerificationStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load verification status
  const loadVerificationStatus = useCallback(async () => {
    if (!user?.id) {
      setVerificationStatus(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await authentikUserVerificationService.getUserVerificationStatus(user.id);
      
      if (result.success && result.data) {
        setVerificationStatus(result.data);
        logger.info('Verification status loaded', { 
          userId: user.id, 
          emailVerified: result.data.emailVerified,
          profileComplete: result.data.profileComplete 
        });
      } else {
        setError(result.error || 'Failed to load verification status');
        logger.error('Failed to load verification status', { 
          userId: user.id, 
          error: result.error 
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      logger.error('Error loading verification status', { userId: user.id, error: err });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Check if user is verified
  const isVerified = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const result = await authentikUserVerificationService.isUserVerified(user.id);
      return result.success && result.data ? result.data : false;
    } catch (err) {
      logger.error('Error checking verification', { userId: user.id, error: err });
      return false;
    }
  }, [user?.id]);

  // Request email verification
  const requestEmailVerification = useCallback(async (): Promise<{ success: boolean; url?: string; error?: string }> => {
    if (!user?.id) {
      return { success: false, error: 'No user ID available' };
    }

    try {
      const result = await authentikUserVerificationService.requestEmailVerification(user.id);
      
      if (result.success && result.data) {
        return { success: true, url: result.data };
      } else {
        return { success: false, error: result.error || 'Failed to request verification' };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }, [user?.id]);

  // Get verification requirements
  const getRequirements = useCallback(async () => {
    if (!user?.id) return null;

    try {
      const result = await authentikUserVerificationService.getVerificationRequirements(user.id);
      return result.success ? result.data : null;
    } catch (err) {
      logger.error('Error getting verification requirements', { userId: user.id, error: err });
      return null;
    }
  }, [user?.id]);

  // Complete verification
  const completeVerification = useCallback(async (verificationData?: any) => {
    if (!user?.id) {
      return { success: false, error: 'No user ID available' };
    }

    try {
      const result = await authentikUserVerificationService.completeVerification(user.id, verificationData);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }, [user?.id]);

  // Load verification status when user changes
  useEffect(() => {
    loadVerificationStatus();
  }, [loadVerificationStatus]);

  // Computed values
  const isEmailVerified = verificationStatus?.emailVerified || false;
  const isProfileComplete = verificationStatus?.profileComplete || false;
  const isAccountActive = verificationStatus?.accountActive || false;
  const verificationLevel = verificationStatus?.verificationLevel || 'none';
  const isFullyVerified = isEmailVerified && isProfileComplete && isAccountActive;

  return {
    // State
    verificationStatus,
    loading,
    error,
    
    // Computed values
    isEmailVerified,
    isProfileComplete,
    isAccountActive,
    verificationLevel,
    isFullyVerified,
    
    // Actions
    loadVerificationStatus,
    isVerified,
    requestEmailVerification,
    getRequirements,
    completeVerification,
    
    // Utility
    refresh: loadVerificationStatus
  };
};
