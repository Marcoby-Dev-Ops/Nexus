import { useAuth } from '@/core/auth/AuthProvider';

/**
 * Hook for accessing user data from the auth context
 * Provides a simple interface for components that need user information
 */
export function useUser() {
  const { user, session, isAuthenticated, loading } = useAuth();

  return {
    user,
    session,
    isAuthenticated,
    loading,
    userId: user?.id,
    email: user?.email,
    name: user?.name,
    avatarUrl: user?.avatar_url,
  };
} 