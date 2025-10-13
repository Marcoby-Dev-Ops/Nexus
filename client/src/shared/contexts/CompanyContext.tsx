/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { logger } from '@/shared/utils/logger';
import { useUserProfile } from '@/shared/contexts/UserContext';
import { companyService } from '@/services/core/CompanyService';
import type {
  CompanyProfile,
  BusinessIdentity,
  CompanyHealth,
} from '@/services/core/CompanyService';

// Use types from CompanyService
type Company = CompanyProfile;

// Temporary type until CompanyAnalytics is properly defined
// Removed unused CompanyAnalytics interface to satisfy lint rules

/**
 * CompanyContext provides read-through cached company data and related resources
 * that depend on the authenticated user's active company.
 */
export interface CompanyContextState {
  // Core company record
  company: Company | null;
  // Business Identity
  businessIdentity: BusinessIdentity | null;
  // Company Health
  health: CompanyHealth | null;

  // Loading flags
  loadingCompany: boolean;
  loadingIdentity: boolean;
  loadingHealth: boolean;

  // Error states
  companyError: string | null;
  identityError: string | null;
  healthError: string | null;

  // Cache timestamps (epoch ms)
  lastCompanyFetch: number | null;
  lastIdentityFetch: number | null;
  lastHealthFetch: number | null;
}

export interface CompanyContextActions {
  refreshCompany: (force?: boolean) => Promise<void>;
  refreshBusinessIdentity: (force?: boolean) => Promise<void>;
  refreshHealth: (force?: boolean) => Promise<void>;
  refreshAll: (force?: boolean) => Promise<void>;
  updateCompany: (updates: Partial<Company>) => Promise<void>;
  updateBusinessIdentity: (updates: Partial<BusinessIdentity>) => Promise<void>;
  clearErrors: () => void;
}

export type CompanyContextType = CompanyContextState & CompanyContextActions;

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

interface CompanyProviderProps {
  children: React.ReactNode;
}

export const CompanyProvider: React.FC<CompanyProviderProps> = ({ children }) => {
  const { profile } = useUserProfile();
  const companyId = profile?.company_id || null;
  
  // Debug logging for company ID detection
  useEffect(() => {
    logger.info('CompanyContext - Profile/CompanyId changed', {
      hasProfile: !!profile,
      profileCompanyId: profile?.company_id,
      companyId,
      profileData: profile
    });
  }, [profile, companyId]);

  // State
  const [company, setCompany] = useState<Company | null>(null);
  const [businessIdentity, setBusinessIdentity] = useState<BusinessIdentity | null>(null);
  const [health, setHealth] = useState<CompanyHealth | null>(null);

  // Loading
  const [loadingCompany, setLoadingCompany] = useState(false);
  const [loadingIdentity, setLoadingIdentity] = useState(false);
  const [loadingHealth, setLoadingHealth] = useState(false);

  // Errors
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [identityError, setIdentityError] = useState<string | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);

  // Cache control
  const [lastCompanyFetch, setLastCompanyFetch] = useState<number | null>(null);
  const [lastIdentityFetch, setLastIdentityFetch] = useState<number | null>(null);
  const [lastHealthFetch, setLastHealthFetch] = useState<number | null>(null);

  // Cache TTL 5 minutes
  const CACHE_TTL_MS = 5 * 60 * 1000;

  const isFresh = useCallback((lastFetch: number | null) => {
    return Boolean(lastFetch && Date.now() - lastFetch < CACHE_TTL_MS);
  }, [CACHE_TTL_MS]);

  const clearErrors = useCallback(() => {
    setCompanyError(null);
    setIdentityError(null);
    setHealthError(null);
  }, []);

  const loadCompany = useCallback(async (force = false) => {
    logger.info('CompanyContext - loadCompany called', { companyId, force, hasCompany: !!company });
    
    if (!companyId) {
      logger.info('CompanyContext - No companyId, clearing company');
      setCompany(null);
      setCompanyError(null);
      return;
    }
    if (!force && isFresh(lastCompanyFetch) && company) {
      logger.info('CompanyContext - Using cached company data');
      return;
    }

    setLoadingCompany(true);
    setCompanyError(null);
    try {
      logger.info('CompanyContext - Fetching company from service', { companyId });
      const result = await companyService.get(companyId);
      if (result.success && result.data) {
        setCompany(result.data);
        setLastCompanyFetch(Date.now());
        logger.info('Company loaded successfully', { 
          companyId, 
          companyName: result.data.name 
        });
      } else {
        setCompanyError(result.error || 'Failed to load company');
        logger.error('Failed to load company', { companyId, error: result.error });
      }
    } catch (error) {
      setCompanyError(error instanceof Error ? error.message : 'Failed to load company');
      logger.error('Error loading company', { companyId, error });
    } finally {
      setLoadingCompany(false);
    }
  }, [companyId, isFresh, lastCompanyFetch, company]);

  const loadBusinessIdentity = useCallback(async (force = false) => {
    if (!companyId) {
      setBusinessIdentity(null);
      setIdentityError(null);
      return;
    }
    if (!force && isFresh(lastIdentityFetch) && businessIdentity) return;

    setLoadingIdentity(true);
    setIdentityError(null);
    try {
      logger.info('CompanyContext - Fetching business identity', { companyId });
      const result = await companyService.getBusinessIdentity(companyId);
      if (result.success && result.data) {
        setBusinessIdentity(result.data);
        setLastIdentityFetch(Date.now());
        logger.info('Business identity loaded successfully', { companyId });
      } else {
        setIdentityError(result.error || 'Failed to load business identity');
        logger.error('Failed to load business identity', { companyId, error: result.error });
      }
    } catch (error) {
      setIdentityError(error instanceof Error ? error.message : 'Failed to load business identity');
      logger.error('Error loading business identity', { companyId, error });
    } finally {
      setLoadingIdentity(false);
    }
  }, [companyId, isFresh, lastIdentityFetch, businessIdentity]);

  const loadHealth = useCallback(async (force = false) => {
    if (!companyId) {
      setHealth(null);
      setHealthError(null);
      return;
    }
    if (!force && isFresh(lastHealthFetch) && health) return;

    setLoadingHealth(true);
    setHealthError(null);
    try {
      logger.info('CompanyContext - Fetching company health', { companyId });
      const result = await companyService.getCompanyHealth(companyId);
      if (result.success && result.data) {
        setHealth(result.data);
        setLastHealthFetch(Date.now());
        logger.info('Company health loaded successfully', { companyId });
      } else {
        setHealthError(result.error || 'Failed to load company health');
        logger.error('Failed to load company health', { companyId, error: result.error });
      }
    } catch (error) {
      setHealthError(error instanceof Error ? error.message : 'Failed to load company health');
      logger.error('Error loading company health', { companyId, error });
    } finally {
      setLoadingHealth(false);
    }
  }, [companyId, isFresh, lastHealthFetch, health]);

  const refreshCompany = useCallback(async (force = false) => {
    await loadCompany(force);
  }, [loadCompany]);

  const refreshBusinessIdentity = useCallback(async (force = false) => {
    await loadBusinessIdentity(force);
  }, [loadBusinessIdentity]);

  const refreshHealth = useCallback(async (force = false) => {
    await loadHealth(force);
  }, [loadHealth]);

  const refreshAll = useCallback(async (force = false) => {
    await Promise.all([
      loadCompany(force),
      loadBusinessIdentity(force),
      loadHealth(force)
    ]);
  }, [loadCompany, loadBusinessIdentity, loadHealth]);

  const updateCompany = useCallback(async (updates: Partial<Company>) => {
    if (!company?.id) throw new Error('No company to update');
    try {
      const result = await companyService.update(company.id, updates);
      if (result.success && result.data) {
        setCompany(result.data);
        setLastCompanyFetch(Date.now());
        logger.info('Company updated', { companyId: company.id });
      } else {
        throw new Error(result.error || 'Failed to update company');
      }
    } catch (error) {
      setCompanyError(error instanceof Error ? error.message : 'Failed to update company');
      logger.error('Error updating company', { companyId: company?.id, error });
      throw error;
    }
  }, [company?.id]);

  const updateBusinessIdentity = useCallback(async (updates: Partial<BusinessIdentity>) => {
    if (!company?.id) throw new Error('No company to update');
    try {
      const result = await companyService.updateBusinessIdentity(company.id, updates);
      if (result.success && result.data) {
        setBusinessIdentity(result.data);
        setLastIdentityFetch(Date.now());
        logger.info('Business identity updated', { companyId: company.id });
      } else {
        throw new Error(result.error || 'Failed to update business identity');
      }
    } catch (error) {
      setIdentityError(error instanceof Error ? error.message : 'Failed to update business identity');
      logger.error('Error updating business identity', { companyId: company?.id, error });
      throw error;
    }
  }, [company?.id]);

  // Load company data when companyId changes
  useEffect(() => {
    logger.info('CompanyContext - useEffect triggered', { 
      companyId, 
      hasCompanyId: !!companyId,
      willLoadCompany: !!companyId 
    });
    
    if (companyId) {
      logger.info('CompanyContext - Starting company data load', { companyId });
      loadCompany();
      loadBusinessIdentity();
      loadHealth();
    } else {
      logger.info('CompanyContext - No companyId, clearing errors');
      clearErrors();
    }
  }, [companyId, loadCompany, loadBusinessIdentity, loadHealth, clearErrors]);

  // Auto-fix: if company was created with placeholder name, but profile has a real company_name, update it
  const autoFixAttemptedRef = React.useRef(false);
  useEffect(() => {
    // Only attempt once per session to avoid loops
    if (autoFixAttemptedRef.current) return;
    if (!company?.id) return;
    const currentName = (company.name || '').trim();
    if (!currentName) return;
    const isPlaceholder = currentName.toLowerCase() === 'my business';
    const desiredName = (profile?.company_name || '').trim();
    if (isPlaceholder && desiredName && desiredName.toLowerCase() !== 'my business') {
      autoFixAttemptedRef.current = true;
      (async () => {
        try {
          logger.info('Auto-fixing placeholder company name', { companyId: company.id, from: currentName, to: desiredName });
          const result = await companyService.update(company.id, { name: desiredName });
          if (result.success && result.data) {
            setCompany(result.data);
            setLastCompanyFetch(Date.now());
            logger.info('Company name auto-fixed successfully', { companyId: company.id, name: result.data.name });
          } else {
            logger.warn('Failed to auto-fix company name', { companyId: company.id, error: result.error });
          }
        } catch (err) {
          logger.warn('Error during company name auto-fix', { companyId: company.id, error: err instanceof Error ? err.message : String(err) });
        }
      })();
    }
  }, [company?.id, company?.name, profile?.company_name]);

  const value: CompanyContextType = useMemo(() => ({
    company,
    businessIdentity,
    health,
    loadingCompany,
    loadingIdentity,
    loadingHealth,
    companyError,
    identityError,
    healthError,
    lastCompanyFetch,
    lastIdentityFetch,
    lastHealthFetch,
    refreshCompany,
    refreshBusinessIdentity,
    refreshHealth,
    refreshAll,
    updateCompany,
    updateBusinessIdentity,
    clearErrors,
  }), [
    company,
    businessIdentity,
    health,
    loadingCompany,
    loadingIdentity,
    loadingHealth,
    companyError,
    identityError,
    healthError,
    lastCompanyFetch,
    lastIdentityFetch,
    lastHealthFetch,
    refreshCompany,
    refreshBusinessIdentity,
    refreshHealth,
    refreshAll,
    updateCompany,
    updateBusinessIdentity,
    clearErrors,
  ]);

  return (
    <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>
  );
};

export const useCompanyContext = (): CompanyContextType => {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error('useCompanyContext must be used within a CompanyProvider');
  return ctx;
};

export const useCompany = () => {
  const { company, loadingCompany, companyError, refreshCompany, updateCompany } = useCompanyContext();
  return { company, loading: loadingCompany, error: companyError, refreshCompany, updateCompany };
};

export const useBusinessIdentity = () => {
  const { businessIdentity, loadingIdentity, identityError, refreshBusinessIdentity, updateBusinessIdentity } = useCompanyContext();
  return { businessIdentity, loading: loadingIdentity, error: identityError, refreshBusinessIdentity, updateBusinessIdentity };
};

export const useCompanyHealth = () => {
  const { health, loadingHealth, healthError, refreshHealth } = useCompanyContext();
  return { health, loading: loadingHealth, error: healthError, refreshHealth };
};
