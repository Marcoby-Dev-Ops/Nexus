/**
 * Company Provisioning Hook
 * 
 * Provides user-friendly company provisioning functionality
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks';
import { companyService } from '@/services/core';
import type { CompanyProvisioningOptions, ProvisioningResult } from '@/services/core';
import { logger } from '@/shared/utils/logger';

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
      const serviceResponse = await companyService.ensureCompanyAssociation(user.id, options);
      
      if (serviceResponse.error) {
        const result: ProvisioningResult = {
          success: false,
          action: 'failed',
          message: 'Failed to provision company',
          error: serviceResponse.error
        };
        setError(result.error ?? null);
        setProvisioningResult(result);
        return result;
      }

      const result = serviceResponse.data;
      setProvisioningResult(result);
      
      if (result && !result.success) {
        setError(result.error || 'Failed to provision company');
      }
      
      return result || {
        success: false,
        action: 'failed',
        message: 'No result returned from service',
        error: 'No result returned from service'
      };
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
  const hasCompany = Boolean(provisioningResult?.success && provisioningResult?.companyId);
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
