/**
 * @deprecated Use UserContext hooks from '@/shared/contexts/UserContext' instead.
 * This wrapper preserves the existing API while delegating to the new context.
 */

import { useAuth } from '@/hooks';
import { logger } from '@/shared/utils/logger';
import { useUserProfile, useUserCompany } from '@/shared/contexts/UserContext';

export interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  display_name?: string;
  avatar_url?: string;
  role?: 'owner' | 'admin' | 'manager' | 'user';
  department?: string;
  job_title?: string;
  company_id?: string;
  business_email?: string;
  personal_email?: string;
  phone?: string;
  location?: string;
  timezone?: string;
  onboarding_completed?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Company {
  id: string;
  name: string;
  industry?: string;
  size?: string;
  website?: string;
  description?: string;
  logo_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UseUserReturn {
  user: unknown;
  session: unknown;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  profile: UserProfile | null;
  company: Company | null;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  updateCompany: (updates: Partial<Company>) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
  refreshCompany: () => Promise<void>;
  clearError: () => void;
}

export function useUser(): UseUserReturn {
  logger.warn(
    'useUser from \'@/hooks/useUser\' is deprecated. Use UserContext hooks from \'@/shared/contexts/UserContext\' instead.'
  );

  const { user, session, loading: authLoading } = useAuth();
  const {
    profile,
    loading: profileLoading,
    error: profileError,
    updateProfile,
    refreshProfile,
  } = useUserProfile();

  const {
    company,
    loading: companyLoading,
    error: companyError,
    refreshCompany,
  } = useUserCompany();

  const updateCompany = async (_updates: Partial<Company>) => {
    logger.warn('updateCompany not implemented yet. Pending CompanyContext.');
    return { success: false, error: 'Company updates not yet implemented' };
  };

  const clearError = () => {
    // Errors are managed by the contexts; nothing to clear here
  };

  return {
    user,
    session,
    isAuthenticated: !!user,
    loading: authLoading || profileLoading || companyLoading,
    error: profileError || companyError,
    profile,
    company,
    updateProfile,
    updateCompany,
    refreshProfile,
    refreshCompany,
    clearError,
  };
}
