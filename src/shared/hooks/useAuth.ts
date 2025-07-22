import { useAuthState, useAuthActions } from '@/shared/stores/authStore';

/**
 * Simple auth hook following NextAuth.js pattern
 * Returns authentication state and actions
 */
export const useAuth = () => {
  const {
    session,
    user,
    profile,
    company,
    integrations,
    loading,
    error,
    initialized,
    status,
    isAuthenticated
  } = useAuthState();

  const {
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshSession,
    clearAuth,
    fetchProfile,
    fetchIntegrations,
    fetchCompany,
    isValid
  } = useAuthActions();

  return {
    // State
    session,
    user,
    profile,
    company,
    integrations,
    loading,
    error,
    initialized,
    status,
    isAuthenticated,
    
    // Actions
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshSession,
    clearAuth,
    fetchProfile,
    fetchIntegrations,
    fetchCompany,
    isValid
  };
};

/**
 * Simple user context hook that throws if context is not available
 * Use this when you need guaranteed user context
 */
export const useUserContext = () => {
  const { user, session, profile, isValid } = useAuthContext();
  
  if (!isValid()) {
    throw new Error('User context not available');
  }
  
  return { user, session, profile };
};

/**
 * Optional user context hook that doesn't throw
 * Use this when user context might not be available
 */
export const useOptionalUserContext = () => {
  const { user, session, profile, isValid } = useAuthContext();
  
  return {
    user,
    session,
    profile,
    isValid: isValid()
  };
}; 