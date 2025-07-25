import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/index';
import { CompanyOwnershipService, CompanyOwner, OwnershipTransferRequest } from '@/core/services/CompanyOwnershipService';

export interface UseCompanyOwnershipState {
  owner: CompanyOwner | null;
  isOwner: boolean;
  isLoading: boolean;
  isTransferring: boolean;
  error: string | null;
  stats: {
    totalCompanies: number;
    companiesWithOwners: number;
    orphanedCompanies: number;
  };
}

export interface UseCompanyOwnershipActions {
  getOwner: (companyId: string) => Promise<void>;
  checkOwnership: (companyId: string) => Promise<void>;
  transferOwnership: (request: OwnershipTransferRequest) => Promise<{ success: boolean; error?: string }>;
  getOwnershipStats: () => Promise<void>;
  setCompanyOwner: (companyId: string, userId: string) => Promise<{ success: boolean; error?: string }>;
}

export const useCompanyOwnership = (): UseCompanyOwnershipState & UseCompanyOwnershipActions => {
  const { user } = useAuth();
  const ownershipService = new CompanyOwnershipService();
  
  const [state, setState] = useState<UseCompanyOwnershipState>({
    owner: null,
    isOwner: false,
    isLoading: false,
    isTransferring: false,
    error: null,
    stats: {
      totalCompanies: 0,
      companiesWithOwners: 0,
      orphanedCompanies: 0
    }
  });

  const getOwner = useCallback(async (companyId: string) => {
    if (!companyId) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const owner = await ownershipService.getCompanyOwner(companyId);
      setState(prev => ({ 
        ...prev, 
        owner, 
        isLoading: false 
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to get company owner', 
        isLoading: false 
      }));
    }
  }, [ownershipService]);

  const checkOwnership = useCallback(async (companyId: string) => {
    if (!companyId || !user?.id) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const isOwner = await ownershipService.isCompanyOwner(companyId, user.id);
      setState(prev => ({ 
        ...prev, 
        isOwner, 
        isLoading: false 
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to check ownership', 
        isLoading: false 
      }));
    }
  }, [ownershipService, user?.id]);

  const transferOwnership = useCallback(async (request: OwnershipTransferRequest) => {
    setState(prev => ({ ...prev, isTransferring: true, error: null }));

    try {
      const result = await ownershipService.transferOwnership(request);
      
      if (result.success) {
        // Refresh owner data
        await getOwner(request.companyId);
        await checkOwnership(request.companyId);
      }

      setState(prev => ({ 
        ...prev, 
        isTransferring: false,
        error: result.error || null
      }));

      return result;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isTransferring: false,
        error: 'Failed to transfer ownership'
      }));

      return { success: false, error: 'Failed to transfer ownership' };
    }
  }, [ownershipService, getOwner, checkOwnership]);

  const getOwnershipStats = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const stats = await ownershipService.getOwnershipStats();
      setState(prev => ({ 
        ...prev, 
        stats, 
        isLoading: false 
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to get ownership stats', 
        isLoading: false 
      }));
    }
  }, [ownershipService]);

  const setCompanyOwner = useCallback(async (companyId: string, userId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await ownershipService.setCompanyOwner(companyId, userId);
      
      if (result.success) {
        // Refresh owner data
        await getOwner(companyId);
        await checkOwnership(companyId);
      }

      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: result.error || null
      }));

      return result;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: 'Failed to set company owner'
      }));

      return { success: false, error: 'Failed to set company owner' };
    }
  }, [ownershipService, getOwner, checkOwnership]);

  return {
    ...state,
    getOwner,
    checkOwnership,
    transferOwnership,
    getOwnershipStats,
    setCompanyOwner
  };
}; 