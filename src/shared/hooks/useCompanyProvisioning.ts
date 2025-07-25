/**
 * Company Provisioning Hook
 * 
 * Provides user-friendly company provisioning functionality
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth.ts';
import { companyProvisioningService } from '@/core/services/CompanyProvisioningService';
import type { CompanyProvisioningOptions, ProvisioningResult } from '@/core/services/CompanyProvisioningService';
import { logger } from '@/shared/utils/logger.ts';

export interface UseCompanyProvisioningReturn {
  // State
  isProvisioning: boolean;
  provisioningResult: ProvisioningResult | null;
  error: string | null;
  
  // Actions
  provisionCompany: (options?: CompanyProvisioningOptions) => Promise<ProvisioningResult>;
  createPersonalWorkspace: () => Promise<ProvisioningResult>;
  createDefaultCompany: () => Promise<ProvisioningResult>;
  redirectToOnboarding: () => Promise<ProvisioningResult>;
  
  // Utilities
  hasCompany: boolean;
  companyId: string | null;
}

export const useCompanyProvisioning = (): UseCompanyProvisioningReturn => {
  const { user } = useAuth();
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisioningResult, setProvisioningResult] = useState<ProvisioningResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const provisionCompany = useCallback(async (options: CompanyProvisioningOptions = {}): Promise<ProvisioningResult> => {
    if (!user?.id) {
      const result: ProvisioningResult = {
        success: false,
        action: 'failed',
        message: 'User not authenticated',
        error: 'User not authenticated'
      };
      setError(result.error);
      return result;
    }

    setIsProvisioning(true);
    setError(null);

    try {
      const result = await companyProvisioningService.ensureCompanyAssociation(user.id, options);
      setProvisioningResult(result);
      
      if (!result.success) {
        setError(result.error || 'Failed to provision company');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      logger.error('Error in provisionCompany:', err);
      
      const result: ProvisioningResult = {
        success: false,
        action: 'failed',
        message: 'Failed to provision company',
        error: errorMessage
      };
      setProvisioningResult(result);
      return result;
    } finally {
      setIsProvisioning(false);
    }
  }, [user?.id]);

  const createPersonalWorkspace = useCallback(async (): Promise<ProvisioningResult> => {
    return provisionCompany({ createDefaultCompany: false });
  }, [provisionCompany]);

  const createDefaultCompany = useCallback(async (): Promise<ProvisioningResult> => {
    return provisionCompany({ createDefaultCompany: true });
  }, [provisionCompany]);

  const redirectToOnboarding = useCallback(async (): Promise<ProvisioningResult> => {
    return provisionCompany({ redirectToOnboarding: true });
  }, [provisionCompany]);

  // Check if user has a company
  const hasCompany = provisioningResult?.success && provisioningResult.companyId != null;
  const companyId = provisioningResult?.companyId || null;

  return {
    isProvisioning,
    provisioningResult,
    error,
    provisionCompany,
    createPersonalWorkspace,
    createDefaultCompany,
    redirectToOnboarding,
    hasCompany,
    companyId
  };
}; 