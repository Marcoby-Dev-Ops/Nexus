import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/lib/SupabaseProvider';
import { supabase } from '@/lib/supabase';
import type { 
  EnhancedUser, 
  UserProfile, 
  Company, 
  UserIntegration, 
  Integration,
  UserContextType 
} from '@/lib/types/userProfile';

// Helper function to validate UUID format
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

const EnhancedUserContext = createContext<UserContextType | undefined>(undefined);

/**
 * Enhanced User Provider that manages user profiles, companies, and integrations
 */
export const EnhancedUserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: authUser, loading: authLoading } = useSupabase();
  const [user, setUser] = useState<EnhancedUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch complete user data including profile, company, and integrations
  const fetchUserData = useCallback(async (userId: string): Promise<EnhancedUser | null> => {
    try {
      console.log('🔄 Fetching user data for:', userId);

      // Fetch user profile first
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      // Only throw on actual errors, not on missing records
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('❌ Error fetching user profile:', profileError);
        throw profileError;
      }

      // Fetch company data separately if user has a company_id
      let companyData = null;
      if (profileData?.company_id && isValidUUID(profileData.company_id)) {
        const { data: company, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', profileData.company_id)
          .single();
        
        if (!companyError) {
          companyData = company;
        }
      }

      // Fetch user integrations
      const { data: integrationsData, error: integrationsError } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', userId);

      if (integrationsError) {
        console.error('❌ Error fetching user integrations:', integrationsError);
        throw integrationsError;
      }

      // Build enhanced user object
      const enhancedUser: EnhancedUser = {
        id: userId,
        email: authUser?.email || '',
        email_confirmed_at: authUser?.email_confirmed_at,
        profile: profileData || undefined,
        company: companyData || undefined,
        integrations: integrationsData || [],
        full_name: profileData 
          ? `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || profileData.display_name
          : authUser?.email?.split('@')[0],
        initials: getInitials(profileData?.first_name, profileData?.last_name, authUser?.email),
        can_manage_company: profileData?.role === 'owner' || profileData?.role === 'admin'
      };

      console.log('✅ User data fetched successfully:', enhancedUser);
      return enhancedUser;

    } catch (error) {
      console.error('❌ Error in fetchUserData:', error);
      return null;
    }
  }, [authUser]);

  // Load user data when auth user changes
  useEffect(() => {
    const loadUserData = async () => {
      if (authUser?.id) {
        setLoading(true);
        const userData = await fetchUserData(authUser.id);
        setUser(userData);
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    if (!authLoading) {
      loadUserData();
    }
  }, [authUser, authLoading, fetchUserData]);

  // Helper functions
  const getInitials = (firstName?: string, lastName?: string, email?: string): string => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) {
      return firstName[0].toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
  };

  // Action functions
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!authUser?.id) throw new Error('User not authenticated');

    // Include default values for required fields if this is a new profile
    const profileData = {
      id: authUser.id,
      role: 'user' as const,
      timezone: 'UTC',
      preferences: {
        theme: 'system' as const,
        notifications: true,
        language: 'en'
      },
      onboarding_completed: false,
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('user_profiles')
      .upsert(profileData);

    if (error) throw error;

    // Refresh user data
    const userData = await fetchUserData(authUser.id);
    setUser(userData);
  }, [authUser?.id, fetchUserData]);

  const updateCompany = useCallback(async (updates: Partial<Company>) => {
    if (!authUser?.id || !user?.profile?.company_id) {
      throw new Error('User not authenticated or no company associated');
    }

    const { error } = await supabase
      .from('companies')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.profile.company_id);

    if (error) throw error;

    // Refresh user data
    const userData = await fetchUserData(authUser.id);
    setUser(userData);
  }, [authUser?.id, user?.profile?.company_id, fetchUserData]);

  const addIntegration = useCallback(async (integration: Omit<UserIntegration, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!authUser?.id) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('user_integrations')
      .insert({
        user_id: authUser.id,
        company_id: user?.profile?.company_id,
        ...integration
      });

    if (error) throw error;

    // Refresh user data
    const userData = await fetchUserData(authUser.id);
    setUser(userData);
  }, [authUser?.id, user?.profile?.company_id, fetchUserData]);

  const updateIntegration = useCallback(async (id: string, updates: Partial<UserIntegration>) => {
    const { error } = await supabase
      .from('user_integrations')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', authUser?.id);

    if (error) throw error;

    // Refresh user data
    if (authUser?.id) {
      const userData = await fetchUserData(authUser.id);
      setUser(userData);
    }
  }, [authUser?.id, fetchUserData]);

  const removeIntegration = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('user_integrations')
      .delete()
      .eq('id', id)
      .eq('user_id', authUser?.id);

    if (error) throw error;

    // Refresh user data
    if (authUser?.id) {
      const userData = await fetchUserData(authUser.id);
      setUser(userData);
    }
  }, [authUser?.id, fetchUserData]);

  const refreshUserData = useCallback(async () => {
    if (authUser?.id) {
      setLoading(true);
      const userData = await fetchUserData(authUser.id);
      setUser(userData);
      setLoading(false);
    }
  }, [authUser?.id, fetchUserData]);

  const completeOnboarding = useCallback(async () => {
    if (!authUser?.id) throw new Error('User not authenticated');

    // Create or update profile with onboarding completed and basic defaults
    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        id: authUser.id,
        onboarding_completed: true,
        role: 'user',
        timezone: 'UTC',
        preferences: {
          theme: 'system',
          notifications: true,
          language: 'en'
        },
        updated_at: new Date().toISOString()
      });

    if (error) throw error;

    // Refresh user data
    const userData = await fetchUserData(authUser.id);
    setUser(userData);
  }, [authUser?.id, fetchUserData]);

  const value: UserContextType = {
    user,
    loading: loading || authLoading,
    isAuthenticated: !!authUser && !!user,
    updateProfile,
    updateCompany,
    addIntegration,
    updateIntegration,
    removeIntegration,
    refreshUserData,
    completeOnboarding
  };

  return (
    <EnhancedUserContext.Provider value={value}>
      {children}
    </EnhancedUserContext.Provider>
  );
};

/**
 * Hook to access enhanced user context
 */
export const useEnhancedUser = (): UserContextType => {
  const context = useContext(EnhancedUserContext);
  if (context === undefined) {
    throw new Error('useEnhancedUser must be used within an EnhancedUserProvider');
  }
  return context;
};

/**
 * Hook to get available integrations
 */
export const useAvailableIntegrations = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        const { data, error } = await supabase
          .from('integrations')
          .select('*')
          .eq('is_active', true)
          .order('category', { ascending: true });

        if (error) throw error;
        setIntegrations(data || []);
      } catch (error) {
        console.error('Error fetching integrations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIntegrations();
  }, []);

  return { integrations, loading };
}; 