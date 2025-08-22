import { useState, useCallback } from 'react';
import { businessProfileService } from '@/shared/lib/business/businessProfileService';
import { logger } from '@/shared/utils/logger';
import type { BusinessProfile } from '@/shared/lib/business/businessProfileService';

interface CreateOrganizationParams {
  tenantId: string;
  name: string;
  description?: string;
  userId: string;
  profileData?: Partial<BusinessProfile>;
}

interface OrganizationResult {
  success: boolean;
  orgId?: string;
  profileId?: string;
  error?: string;
}

export const useOrganization = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrganization = useCallback(async (params: CreateOrganizationParams): Promise<OrganizationResult> => {
    setIsLoading(true);
    setError(null);

    try {
      logger.info('Creating organization via hook', { 
        tenantId: params.tenantId, 
        name: params.name, 
        userId: params.userId 
      });

      const result = await businessProfileService.createOrganizationWithProfile(
        params.tenantId,
        params.userId,
        params.name,
        params.profileData || {}
      );

      if (!result.success) {
        logger.error('Failed to create organization via hook', { 
          error: result.error, 
          tenantId: params.tenantId, 
          name: params.name 
        });
        setError(result.error || 'Failed to create organization');
        return result;
      }

      logger.info('Organization created successfully via hook', { 
        orgId: result.orgId, 
        profileId: result.profileId 
      });

      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      logger.error('Error creating organization via hook', { error: err });
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const joinOrganization = useCallback(async (
    userId: string,
    orgId: string,
    profileData?: Partial<BusinessProfile>
  ): Promise<OrganizationResult> => {
    setIsLoading(true);
    setError(null);

    try {
      logger.info('Joining organization via hook', { userId, orgId });

      const result = await businessProfileService.joinOrganizationWithProfile(
        userId,
        orgId,
        profileData || {}
      );

      if (!result.success) {
        logger.error('Failed to join organization via hook', { 
          error: result.error, 
          userId, 
          orgId 
        });
        setError(result.error || 'Failed to join organization');
        return result;
      }

      logger.info('Successfully joined organization via hook', { 
        userId, 
        orgId, 
        profileId: result.profileId 
      });

      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      logger.error('Error joining organization via hook', { error: err });
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    createOrganization,
    joinOrganization,
    isLoading,
    error,
    clearError
  };
};
