import { useAuthState, useAuthActions } from '@/shared/stores/authStore';

/**
 * Simple Zustand auth hook that returns direct state access
 * Use this when you need direct access to the auth store
 */
export const useZustandAuth = () => {
  const state = useAuthState();
  const actions = useAuthActions();
  
  return {
    ...state,
    ...actions
  };
};

/**
 * Individual auth state hooks for specific pieces
 * Use these to prevent unnecessary re-renders
 */
export const useAuthSession = () => useAuthState().session;
export const useAuthUser = () => useAuthState().user;
export const useAuthProfile = () => useAuthState().profile;
export const useAuthCompany = () => useAuthState().company;
export const useAuthIntegrations = () => useAuthState().integrations;
export const useAuthLoading = () => useAuthState().loading;
export const useAuthError = () => useAuthState().error;
export const useAuthInitialized = () => useAuthState().initialized;
export const useAuthStatus = () => useAuthState().status;
export const useAuthIsAuthenticated = () => useAuthState().isAuthenticated;

/**
 * Individual auth action hooks
 */
export const useAuthSignIn = () => useAuthActions().signIn;
export const useAuthSignUp = () => useAuthActions().signUp;
export const useAuthSignOut = () => useAuthActions().signOut;
export const useAuthResetPassword = () => useAuthActions().resetPassword;
export const useAuthRefreshSession = () => useAuthActions().refreshSession;
export const useAuthClearAuth = () => useAuthActions().clearAuth;
export const useAuthFetchProfile = () => useAuthActions().fetchProfile;
export const useAuthFetchIntegrations = () => useAuthActions().fetchIntegrations;
export const useAuthFetchCompany = () => useAuthActions().fetchCompany;
export const useAuthIsValid = () => useAuthActions().isValid;
export const useAuthUpdateProfile = () => useAuthActions().updateProfile; 