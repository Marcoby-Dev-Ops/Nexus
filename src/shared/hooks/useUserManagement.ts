/**
 * World-Class User Management Hook
 * 
 * Provides comprehensive user management features inspired by:
 * - Google Workspace Admin Console
 * - Microsoft 365 Admin Center
 * - Modern SaaS platforms
 */

import { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { DatabaseQueryWrapper } from '@/core/database/queryWrapper';
import { useAuth } from '@/hooks/index';
import { logger } from '@/shared/utils/logger.ts';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role?: string;
  department?: string;
  company_id?: string;
  onboarding_completed?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  session_id: string;
  is_active: boolean;
  last_activity: string;
  created_at: string;
}

export interface UserActivity {
  id: string;
  user_id: string;
  activity_type: string;
  description: string;
  metadata?: any;
  created_at: string;
}

export interface UserAnalytics {
  totalSessions: number;
  activeSessions: number;
  lastActivity: string;
  averageSessionDuration: number;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'company';
    dataSharing: boolean;
  };
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  lastPasswordChange: string;
  loginHistory: Array<{
    timestamp: string;
    ip: string;
    location: string;
    device: string;
  }>;
}

export interface OnboardingFlow {
  step: number;
  completed: boolean;
  steps: Array<{
    id: string;
    title: string;
    completed: boolean;
    required: boolean;
  }>;
}

export interface UserInvitation {
  id: string;
  email: string;
  role: string;
  status: 'pending' | 'accepted' | 'expired';
  invited_by: string;
  invited_at: string;
  expires_at: string;
}

export interface UserManagementState {
  profile: UserProfile | null;
  sessions: UserSession[];
  activities: UserActivity[];
  analytics: UserAnalytics | null;
  preferences: UserPreferences | null;
  securitySettings: SecuritySettings | null;
  onboardingFlow: OnboardingFlow | null;
  invitations: UserInvitation[];
  pendingInvitations: UserInvitation[];
  isLoading: boolean;
  isUpdating: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastError: string | null;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
}

export interface UserManagementActions {
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
  getActiveSessions: () => Promise<UserSession[]>;
  revokeSession: (sessionId: string) => Promise<{ success: boolean; error?: string }>;
  getActivities: (limit?: number) => Promise<UserActivity[]>;
  getAnalytics: () => Promise<UserAnalytics | null>;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<{ success: boolean; error?: string }>;
  getSecuritySettings: () => Promise<SecuritySettings | null>;
  enableTwoFactor: () => Promise<{ success: boolean; error?: string }>;
  disableTwoFactor: () => Promise<{ success: boolean; error?: string }>;
  getOnboardingFlow: () => Promise<OnboardingFlow | null>;
  completeOnboardingStep: (stepId: string) => Promise<{ success: boolean; error?: string }>;
  getInvitations: () => Promise<UserInvitation[]>;
  sendInvitation: (email: string, role: string) => Promise<{ success: boolean; error?: string }>;
  revokeInvitation: (invitationId: string) => Promise<{ success: boolean; error?: string }>;
  refreshData: () => Promise<void>;
  clearError: () => void;
}

export const useUserManagement = (): UserManagementState & UserManagementActions => {
  const { user } = useAuth();
  const queryWrapper = new DatabaseQueryWrapper();
  
  const [state, setState] = useState<UserManagementState>({
    profile: null,
    sessions: [],
    activities: [],
    analytics: null,
    preferences: null,
    securitySettings: null,
    onboardingFlow: null,
    invitations: [],
    pendingInvitations: [],
    isLoading: false,
    isUpdating: false,
    isRefreshing: false,
    error: null,
    lastError: null,
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: 20
  });

  // Memoized selectors
  const pendingInvitations = useMemo(() => 
    state.invitations.filter(inv => inv.status === 'pending'), 
    [state.invitations]
  );

  // Profile management
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user?.id) {
      return { success: false, error: 'No authenticated user' };
    }

    setState(prev => ({ ...prev, isUpdating: true, error: null }));

    try {
      const { data, error } = await queryWrapper.updateUserProfile(user.id, updates);

      if (error) {
        throw new Error(error.message || 'Failed to update profile');
      }

      setState(prev => ({ 
        ...prev, 
        profile: data, 
        isUpdating: false 
      }));

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        lastError: errorMessage,
        isUpdating: false 
      }));
      return { success: false, error: errorMessage };
    }
  }, [user?.id, queryWrapper]);

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data, error } = await queryWrapper.getUserProfile(user.id);

      if (error) {
        throw new Error(error.message || 'Failed to refresh profile');
      }

      setState(prev => ({ 
        ...prev, 
        profile: data, 
        isLoading: false 
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh profile';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        lastError: errorMessage,
        isLoading: false 
      }));
    }
  }, [user?.id, queryWrapper]);

  // Session management
  const getActiveSessions = useCallback(async (): Promise<UserSession[]> => {
    if (!user?.id) return [];

    try {
      const { data, error } = await queryWrapper.userQuery(
        async () => supabase
          .from('user_sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('last_activity', { ascending: false }),
        user.id,
        'get-active-sessions'
      );

      if (error) {
        throw new Error(error.message || 'Failed to get active sessions');
      }

      setState(prev => ({ ...prev, sessions: data || [] }));
      return data || [];
    } catch (error) {
      logger.error('Failed to get active sessions:', error);
      return [];
    }
  }, [user?.id, queryWrapper]);

  const revokeSession = useCallback(async (sessionId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) {
      return { success: false, error: 'No authenticated user' };
    }

    try {
      const { error } = await queryWrapper.userQuery(
        async () => supabase
          .from('user_sessions')
          .update({ is_active: false })
          .eq('id', sessionId)
          .eq('user_id', user.id),
        user.id,
        'revoke-session'
      );

      if (error) {
        throw new Error(error.message || 'Failed to revoke session');
      }

      // Refresh sessions list
      await getActiveSessions();
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to revoke session';
      return { success: false, error: errorMessage };
    }
  }, [user?.id, queryWrapper, getActiveSessions]);

  // Activity management
  const getActivities = useCallback(async (limit = 20): Promise<UserActivity[]> => {
    if (!user?.id) return [];

    try {
      const { data, error } = await queryWrapper.userQuery(
        async () => supabase
          .from('user_activity')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(limit),
        user.id,
        'get-activities'
      );

      if (error) {
        throw new Error(error.message || 'Failed to get activities');
      }

      setState(prev => ({ ...prev, activities: data || [] }));
      return data || [];
    } catch (error) {
      logger.error('Failed to get activities:', error);
      return [];
    }
  }, [user?.id, queryWrapper]);

  // Analytics
  const getAnalytics = useCallback(async (): Promise<UserAnalytics | null> => {
    if (!user?.id) return null;

    try {
      const { data, error } = await queryWrapper.userQuery(
        async () => supabase
          .rpc('get_user_analytics', { user_id: user.id }),
        user.id,
        'get-analytics'
      );

      if (error) {
        throw new Error(error.message || 'Failed to get analytics');
      }

      setState(prev => ({ ...prev, analytics: data }));
      return data;
    } catch (error) {
      logger.error('Failed to get analytics:', error);
      return null;
    }
  }, [user?.id, queryWrapper]);

  // Preferences
  const updatePreferences = useCallback(async (preferences: Partial<UserPreferences>): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) {
      return { success: false, error: 'No authenticated user' };
    }

    try {
      const { error } = await queryWrapper.userQuery(
        async () => supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            ...preferences,
            updated_at: new Date().toISOString()
          }),
        user.id,
        'update-preferences'
      );

      if (error) {
        throw new Error(error.message || 'Failed to update preferences');
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update preferences';
      return { success: false, error: errorMessage };
    }
  }, [user?.id, queryWrapper]);

  // Security settings
  const getSecuritySettings = useCallback(async (): Promise<SecuritySettings | null> => {
    if (!user?.id) return null;

    try {
      const { data, error } = await queryWrapper.userQuery(
        async () => supabase
          .from('user_security_settings')
          .select('*')
          .eq('user_id', user.id)
          .single(),
        user.id,
        'get-security-settings'
      );

      if (error) {
        throw new Error(error.message || 'Failed to get security settings');
      }

      setState(prev => ({ ...prev, securitySettings: data }));
      return data;
    } catch (error) {
      logger.error('Failed to get security settings:', error);
      return null;
    }
  }, [user?.id, queryWrapper]);

  const enableTwoFactor = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) {
      return { success: false, error: 'No authenticated user' };
    }

    try {
      const { error } = await queryWrapper.userQuery(
        async () => supabase
          .from('user_security_settings')
          .upsert({
            user_id: user.id,
            two_factor_enabled: true,
            updated_at: new Date().toISOString()
          }),
        user.id,
        'enable-two-factor'
      );

      if (error) {
        throw new Error(error.message || 'Failed to enable two-factor authentication');
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to enable two-factor authentication';
      return { success: false, error: errorMessage };
    }
  }, [user?.id, queryWrapper]);

  const disableTwoFactor = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) {
      return { success: false, error: 'No authenticated user' };
    }

    try {
      const { error } = await queryWrapper.userQuery(
        async () => supabase
          .from('user_security_settings')
          .upsert({
            user_id: user.id,
            two_factor_enabled: false,
            updated_at: new Date().toISOString()
          }),
        user.id,
        'disable-two-factor'
      );

      if (error) {
        throw new Error(error.message || 'Failed to disable two-factor authentication');
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to disable two-factor authentication';
      return { success: false, error: errorMessage };
    }
  }, [user?.id, queryWrapper]);

  // Onboarding
  const getOnboardingFlow = useCallback(async (): Promise<OnboardingFlow | null> => {
    if (!user?.id) return null;

    try {
      const { data, error } = await queryWrapper.userQuery(
        async () => supabase
          .from('user_onboarding')
          .select('*')
          .eq('user_id', user.id)
          .single(),
        user.id,
        'get-onboarding-flow'
      );

      if (error) {
        throw new Error(error.message || 'Failed to get onboarding flow');
      }

      setState(prev => ({ ...prev, onboardingFlow: data }));
      return data;
    } catch (error) {
      logger.error('Failed to get onboarding flow:', error);
      return null;
    }
  }, [user?.id, queryWrapper]);

  const completeOnboardingStep = useCallback(async (stepId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) {
      return { success: false, error: 'No authenticated user' };
    }

    try {
      const { error } = await queryWrapper.userQuery(
        async () => supabase
          .from('user_onboarding_steps')
          .upsert({
            user_id: user.id,
            step_id: stepId,
            completed: true,
            completed_at: new Date().toISOString()
          }),
        user.id,
        'complete-onboarding-step'
      );

      if (error) {
        throw new Error(error.message || 'Failed to complete onboarding step');
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete onboarding step';
      return { success: false, error: errorMessage };
    }
  }, [user?.id, queryWrapper]);

  // Invitations
  const getInvitations = useCallback(async (): Promise<UserInvitation[]> => {
    if (!user?.id) return [];

    try {
      const { data, error } = await queryWrapper.userQuery(
        async () => supabase
          .from('user_invitations')
          .select('*')
          .eq('invited_by', user.id)
          .order('invited_at', { ascending: false }),
        user.id,
        'get-invitations'
      );

      if (error) {
        throw new Error(error.message || 'Failed to get invitations');
      }

      setState(prev => ({ ...prev, invitations: data || [] }));
      return data || [];
    } catch (error) {
      logger.error('Failed to get invitations:', error);
      return [];
    }
  }, [user?.id, queryWrapper]);

  const sendInvitation = useCallback(async (email: string, role: string): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) {
      return { success: false, error: 'No authenticated user' };
    }

    try {
      const { error } = await queryWrapper.userQuery(
        async () => supabase
          .from('user_invitations')
          .insert({
            email,
            role,
            invited_by: user.id,
            invited_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
            status: 'pending'
          }),
        user.id,
        'send-invitation'
      );

      if (error) {
        throw new Error(error.message || 'Failed to send invitation');
      }

      // Refresh invitations list
      await getInvitations();
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send invitation';
      return { success: false, error: errorMessage };
    }
  }, [user?.id, queryWrapper, getInvitations]);

  const revokeInvitation = useCallback(async (invitationId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) {
      return { success: false, error: 'No authenticated user' };
    }

    try {
      const { error } = await queryWrapper.userQuery(
        async () => supabase
          .from('user_invitations')
          .update({ status: 'expired' })
          .eq('id', invitationId)
          .eq('invited_by', user.id),
        user.id,
        'revoke-invitation'
      );

      if (error) {
        throw new Error(error.message || 'Failed to revoke invitation');
      }

      // Refresh invitations list
      await getInvitations();
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to revoke invitation';
      return { success: false, error: errorMessage };
    }
  }, [user?.id, queryWrapper, getInvitations]);

  // Utility functions
  const refreshData = useCallback(async () => {
    setState(prev => ({ ...prev, isRefreshing: true }));
    
    try {
      await Promise.all([
        refreshProfile(),
        getActiveSessions(),
        getActivities(),
        getAnalytics(),
        getSecuritySettings(),
        getOnboardingFlow(),
        getInvitations()
      ]);
    } catch (error) {
      logger.error('Failed to refresh data:', error);
    } finally {
      setState(prev => ({ ...prev, isRefreshing: false }));
    }
  }, [refreshProfile, getActiveSessions, getActivities, getAnalytics, getSecuritySettings, getOnboardingFlow, getInvitations]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    pendingInvitations,
    updateProfile,
    refreshProfile,
    getActiveSessions,
    revokeSession,
    getActivities,
    getAnalytics,
    updatePreferences,
    getSecuritySettings,
    enableTwoFactor,
    disableTwoFactor,
    getOnboardingFlow,
    completeOnboardingStep,
    getInvitations,
    sendInvitation,
    revokeInvitation,
    refreshData,
    clearError
  };
}; 