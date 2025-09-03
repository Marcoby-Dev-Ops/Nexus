/**
 * Company Association Hook
 * Combines CompanyAssociationService and CompanyOwnershipService for easy use in React components
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/core/auth/useAuth';
import { CompanyAssociationService, CompanyOwnershipService } from '@/services/business';
import type { UserCompanyProfile, CompanyOwnershipStatus } from '@/services/business';

export const useCompanyAssociation = () => {
  const { user, session } = useAuth();
  const [companyProfile, setCompanyProfile] = useState<UserCompanyProfile | null>(null);
  const [ownershipStatus, setOwnershipStatus] = useState<CompanyOwnershipStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const companyAssociationService = new CompanyAssociationService();
  const companyOwnershipService = new CompanyOwnershipService();

  // Load user's company profile
  const loadCompanyProfile = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const result = await companyAssociationService.getUserCompanyProfile(user.id);
      if (result.success) {
        setCompanyProfile(result.data);
        
        // If user has a company, also load ownership status
        if (result.data?.companyId) {
          const ownershipResult = await companyOwnershipService.getCompanyOwnershipStatus(
            result.data.companyId,
            user.id
          );
          if (ownershipResult.success) {
            setOwnershipStatus(ownershipResult.data);
          }
        }
      } else {
        setError(result.error || 'Failed to load company profile');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Ensure user has a company association
  const ensureCompanyAssociation = useCallback(async (companyName: string) => {
    if (!user?.id || !user?.email) return null;

    setLoading(true);
    setError(null);

    try {
      const result = await companyAssociationService.ensureUserCompanyAssociation(
        user.id,
        companyName,
        user.email
      );

      if (result.success && result.data) {
        setCompanyProfile(result.data);
        
        // Load ownership status for new company
        if (result.data.companyId) {
          const ownershipResult = await companyOwnershipService.getCompanyOwnershipStatus(
            result.data.companyId,
            user.id
          );
          if (ownershipResult.success) {
            setOwnershipStatus(ownershipResult.data);
          }
        }
        
        return result.data;
      } else {
        setError(result.error || 'Failed to ensure company association');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.email]);

  // Transfer company ownership
  const transferOwnership = useCallback(async (newOwnerId: string) => {
    if (!user?.id || !companyProfile?.companyId) return false;

    setLoading(true);
    setError(null);

    try {
      const result = await companyOwnershipService.transferCompanyOwnership({
        companyId: companyProfile.companyId,
        newOwnerId,
        currentUserId: user.id
      });

      if (result.success) {
        // Reload company profile to reflect changes
        await loadCompanyProfile();
        return true;
      } else {
        setError(result.error || 'Failed to transfer ownership');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.id, companyProfile?.companyId, loadCompanyProfile]);

  // Update user role in company
  const updateUserRole = useCallback(async (userId: string, newRole: string) => {
    if (!companyProfile?.companyId) return false;

    setLoading(true);
    setError(null);

    try {
      const result = await companyAssociationService.updateUserRole(
        userId,
        companyProfile.companyId,
        newRole
      );

      if (result.success) {
        // Reload company profile to reflect changes
        await loadCompanyProfile();
        return true;
      } else {
        setError(result.error || 'Failed to update user role');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [companyProfile?.companyId, loadCompanyProfile]);

  // Remove user from company
  const removeUserFromCompany = useCallback(async (userId: string) => {
    if (!companyProfile?.companyId) return false;

    setLoading(true);
    setError(null);

    try {
      const result = await companyAssociationService.removeUserFromCompany(
        userId,
        companyProfile.companyId
      );

      if (result.success) {
        // Reload company profile to reflect changes
        await loadCompanyProfile();
        return true;
      } else {
        setError(result.error || 'Failed to remove user from company');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [companyProfile?.companyId, loadCompanyProfile]);

  // Load company profile on mount
  useEffect(() => {
    loadCompanyProfile();
  }, [loadCompanyProfile]);

  return {
    // State
    companyProfile,
    ownershipStatus,
    loading,
    error,
    
    // Actions
    loadCompanyProfile,
    ensureCompanyAssociation,
    transferOwnership,
    updateUserRole,
    removeUserFromCompany,
    
    // Computed values
    hasCompany: !!companyProfile,
    isCompanyOwner: companyProfile?.isOwner || false,
    isCompanyAdmin: companyProfile?.isAdmin || false,
    canTransferOwnership: ownershipStatus?.canTransfer || false,
    
    // Clear error
    clearError: () => setError(null)
  };
};
