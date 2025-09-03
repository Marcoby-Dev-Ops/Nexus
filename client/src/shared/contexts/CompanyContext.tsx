import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { logger } from '@/shared/utils/logger';
import { useUserProfile } from '@/shared/contexts/UserContext';
import { companyService } from '@/services/core/CompanyService';
import type {
  Company,
  Department,
  CompanyRole,
  CompanyHealth,
} from '@/services/core/CompanyService';

// Temporary type until CompanyAnalytics is properly defined
interface CompanyAnalytics {
  companyId: string;
  employeeCount: number;
  mrr: number;
  growthStage: string;
  industry: string;
  size: string;
  websiteVisitors: number;
  csat: number;
  grossMargin: number;
  lastUpdated: string;
}

/**
 * CompanyContext provides read-through cached company data and related resources
 * that depend on the authenticated user's active company.
 */
export interface CompanyContextState {
  // Core company record
  company: Company | null;
  // Related resources
  departments: Department[];
  roles: CompanyRole[];
  analytics: CompanyAnalytics | null;
  health: CompanyHealth | null;

  // Loading flags
  loadingCompany: boolean;
  loadingDepartments: boolean;
  loadingRoles: boolean;
  loadingAnalytics: boolean;
  loadingHealth: boolean;

  // Error states
  companyError: string | null;
  departmentsError: string | null;
  rolesError: string | null;
  analyticsError: string | null;
  healthError: string | null;

  // Cache timestamps (epoch ms)
  lastCompanyFetch: number | null;
  lastDepartmentsFetch: number | null;
  lastRolesFetch: number | null;
  lastAnalyticsFetch: number | null;
  lastHealthFetch: number | null;
}

export interface CompanyContextActions {
  refreshCompany: (force?: boolean) => Promise<void>;
  refreshDepartments: (force?: boolean) => Promise<void>;
  refreshRoles: (force?: boolean) => Promise<void>;
  refreshAnalytics: (force?: boolean) => Promise<void>;
  refreshHealth: (force?: boolean) => Promise<void>;
  refreshAll: (force?: boolean) => Promise<void>;
  updateCompany: (updates: Partial<Company>) => Promise<void>;
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
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<CompanyRole[]>([]);
  const [analytics, setAnalytics] = useState<CompanyAnalytics | null>(null);
  const [health, setHealth] = useState<CompanyHealth | null>(null);

  // Loading
  const [loadingCompany, setLoadingCompany] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [loadingHealth, setLoadingHealth] = useState(false);

  // Errors
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [departmentsError, setDepartmentsError] = useState<string | null>(null);
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);

  // Cache control
  const [lastCompanyFetch, setLastCompanyFetch] = useState<number | null>(null);
  const [lastDepartmentsFetch, setLastDepartmentsFetch] = useState<number | null>(null);
  const [lastRolesFetch, setLastRolesFetch] = useState<number | null>(null);
  const [lastAnalyticsFetch, setLastAnalyticsFetch] = useState<number | null>(null);
  const [lastHealthFetch, setLastHealthFetch] = useState<number | null>(null);

  // Cache TTL 5 minutes
  const CACHE_TTL_MS = 5 * 60 * 1000;

  const isFresh = useCallback((lastFetch: number | null) => {
    return Boolean(lastFetch && Date.now() - lastFetch < CACHE_TTL_MS);
  }, []);

  const clearErrors = useCallback(() => {
    setCompanyError(null);
    setDepartmentsError(null);
    setRolesError(null);
    setAnalyticsError(null);
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
          companyName: result.data.name,
          companyData: result.data 
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

  const loadDepartments = useCallback(async (force = false) => {
    if (!companyId) {
      setDepartments([]);
      setDepartmentsError(null);
      return;
    }
    if (!force && isFresh(lastDepartmentsFetch) && departments.length > 0) return;

    setLoadingDepartments(true);
    setDepartmentsError(null);
    try {
      const result = await companyService.getCompanyDepartments(companyId);
      if ((result as any).success !== false) {
        // Service returns { data, error } on success within BaseService wrapper
        const data = (result as any).data as Department[];
        setDepartments(data || []);
        setLastDepartmentsFetch(Date.now());
        logger.info('Company departments loaded', { companyId, count: data?.length || 0 });
      } else {
        setDepartmentsError((result as any).error || 'Failed to load departments');
        logger.error('Failed to load departments', { companyId, error: (result as any).error });
      }
    } catch (error) {
      setDepartmentsError(error instanceof Error ? error.message : 'Failed to load departments');
      logger.error('Error loading departments', { companyId, error });
    } finally {
      setLoadingDepartments(false);
    }
  }, [companyId, isFresh, lastDepartmentsFetch]);

  const loadRoles = useCallback(async (force = false) => {
    if (!companyId) {
      setRoles([]);
      setRolesError(null);
      return;
    }
    if (!force && isFresh(lastRolesFetch) && roles.length > 0) return;

    setLoadingRoles(true);
    setRolesError(null);
    try {
      const result = await companyService.getCompanyRoles(companyId);
      if ((result as any).success !== false) {
        const data = (result as any).data as CompanyRole[];
        setRoles(data || []);
        setLastRolesFetch(Date.now());
        logger.info('Company roles loaded', { companyId, count: data?.length || 0 });
      } else {
        setRolesError((result as any).error || 'Failed to load roles');
        logger.error('Failed to load roles', { companyId, error: (result as any).error });
      }
    } catch (error) {
      setRolesError(error instanceof Error ? error.message : 'Failed to load roles');
      logger.error('Error loading roles', { companyId, error });
    } finally {
      setLoadingRoles(false);
    }
  }, [companyId, isFresh, lastRolesFetch]);

  const loadAnalytics = useCallback(async (force = false) => {
    if (!companyId) {
      setAnalytics(null);
      setAnalyticsError(null);
      return;
    }
    if (!force && isFresh(lastAnalyticsFetch) && analytics) return;

    setLoadingAnalytics(true);
    setAnalyticsError(null);
    try {
      const result = await companyService.getCompanyAnalytics(companyId);
      if ((result as any).success !== false) {
        const data = (result as any).data as CompanyAnalytics;
        setAnalytics(data || null);
        setLastAnalyticsFetch(Date.now());
        logger.info('Company analytics loaded', { companyId });
      } else {
        setAnalyticsError((result as any).error || 'Failed to load analytics');
        logger.error('Failed to load analytics', { companyId, error: (result as any).error });
      }
    } catch (error) {
      setAnalyticsError(error instanceof Error ? error.message : 'Failed to load analytics');
      logger.error('Error loading analytics', { companyId, error });
    } finally {
      setLoadingAnalytics(false);
    }
  }, [companyId, isFresh, lastAnalyticsFetch]);

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
      const result = await companyService.getCompanyHealth(companyId);
      if ((result as any).success !== false) {
        const data = (result as any).data as CompanyHealth;
        setHealth(data || null);
        setLastHealthFetch(Date.now());
        logger.info('Company health loaded', { companyId });
      } else {
        setHealthError((result as any).error || 'Failed to load health');
        logger.error('Failed to load company health', { companyId, error: (result as any).error });
      }
    } catch (error) {
      setHealthError(error instanceof Error ? error.message : 'Failed to load health');
      logger.error('Error loading company health', { companyId, error });
    } finally {
      setLoadingHealth(false);
    }
  }, [companyId, isFresh, lastHealthFetch]);

  const refreshCompany = useCallback(async (force = false) => {
    await loadCompany(force);
  }, [loadCompany]);

  const refreshDepartments = useCallback(async (force = false) => {
    // Department feature not yet implemented
    logger.info('Department refresh called but feature not yet implemented');
  }, []);

  const refreshRoles = useCallback(async (force = false) => {
    // Roles feature not yet implemented
    logger.info('Roles refresh called but feature not yet implemented');
  }, []);

  const refreshAnalytics = useCallback(async (force = false) => {
    await loadAnalytics(force);
  }, [loadAnalytics]);

  const refreshHealth = useCallback(async (force = false) => {
    await loadHealth(force);
  }, [loadHealth]);

  const refreshAll = useCallback(async (force = false) => {
    await Promise.all([
      loadCompany(force),
      // Comment out department and role loading until these features are implemented
      // loadDepartments(force),
      // loadRoles(force),
      loadAnalytics(force),
      loadHealth(force)
    ]);
  }, [loadCompany, loadAnalytics, loadHealth]);

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
      // Comment out department and role loading until these features are implemented
      // loadDepartments();
      // loadRoles();
      loadAnalytics();
      loadHealth();
    } else {
      logger.info('CompanyContext - No companyId, clearing errors');
      clearErrors();
    }
  }, [companyId, loadCompany, loadAnalytics, loadHealth, clearErrors]);

  const value: CompanyContextType = useMemo(() => ({
    company,
    departments,
    roles,
    analytics,
    health,
    loadingCompany,
    loadingDepartments,
    loadingRoles,
    loadingAnalytics,
    loadingHealth,
    companyError,
    departmentsError,
    rolesError,
    analyticsError,
    healthError,
    lastCompanyFetch,
    lastDepartmentsFetch,
    lastRolesFetch,
    lastAnalyticsFetch,
    lastHealthFetch,
    refreshCompany,
    refreshDepartments,
    refreshRoles,
    refreshAnalytics,
    refreshHealth,
    refreshAll,
    updateCompany,
    clearErrors,
  }), [
    company,
    departments,
    roles,
    analytics,
    health,
    loadingCompany,
    loadingDepartments,
    loadingRoles,
    loadingAnalytics,
    loadingHealth,
    companyError,
    departmentsError,
    rolesError,
    analyticsError,
    healthError,
    lastCompanyFetch,
    lastDepartmentsFetch,
    lastRolesFetch,
    lastAnalyticsFetch,
    lastHealthFetch,
    refreshCompany,
    refreshDepartments,
    refreshRoles,
    refreshAnalytics,
    refreshHealth,
    refreshAll,
    updateCompany,
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

export const useCompanyDepartments = () => {
  const { departments, loadingDepartments, departmentsError, refreshDepartments } = useCompanyContext();
  return { departments, loading: loadingDepartments, error: departmentsError, refreshDepartments };
};

export const useCompanyRoles = () => {
  const { roles, loadingRoles, rolesError, refreshRoles } = useCompanyContext();
  return { roles, loading: loadingRoles, error: rolesError, refreshRoles };
};

export const useCompanyAnalytics = () => {
  const { analytics, loadingAnalytics, analyticsError, refreshAnalytics } = useCompanyContext();
  return { analytics, loading: loadingAnalytics, error: analyticsError, refreshAnalytics };
};

export const useCompanyHealth = () => {
  const { health, loadingHealth, healthError, refreshHealth } = useCompanyContext();
  return { health, loading: loadingHealth, error: healthError, refreshHealth };
};
