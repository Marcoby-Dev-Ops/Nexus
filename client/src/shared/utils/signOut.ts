import { authentikAuthService } from '@/core/auth/authentikAuthServiceInstance';
import { logger } from '@/shared/utils/logger';

function getAuthentikBaseUrl(): string {
  // Match the same resolution order as authentikAuthServiceInstance
  const url =
    (window as any).__APP_CONFIG__?.VITE_AUTHENTIK_URL ||
    import.meta.env.VITE_AUTHENTIK_URL ||
    'https://identity.marcoby.com';
  return url.replace(/\/+$/, '');
}

function clearAllAuthStorage(): void {
  const authKeys = [
    'authentik_token',
    'authentik_refresh_token',
    'authentik_session',
    'supabase.auth.token',
    'supabase.auth.refreshToken',
    'supabase.auth.expiresAt',
    'supabase.auth.expiresIn',
    'supabase.auth.tokenType',
    'supabase.auth.user',
    'supabase.auth.session',
  ];
  authKeys.forEach(key => localStorage.removeItem(key));
  sessionStorage.clear();
}

export async function performSignOut(): Promise<void> {
  try {
    logger.info('Signing out user');

    // Sign out from Authentik (revokes the token)
    const result = await authentikAuthService.signOut();

    if (!result.success) {
      logger.error('Failed to sign out from Marcoby IAM:', result.error);
    }

    clearAllAuthStorage();

    // Clear any cached data
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
      } catch (error) {
        logger.warn('Failed to clear caches:', error);
      }
    }

    // Redirect to Authentik's session-end page to invalidate the SSO cookie.
    // Without this, the Authentik session cookie stays active and /login
    // silently re-authenticates the user via OAuth.
    const authentikBase = getAuthentikBaseUrl();
    const postLogoutRedirect = `${window.location.origin}/login`;
    window.location.href = `${authentikBase}/if/session-end/?redirect_uri=${encodeURIComponent(postLogoutRedirect)}`;

    logger.info('User signed out successfully');
  } catch (error) {
    logger.error('Error during sign out:', error);

    clearAllAuthStorage();

    // Fallback: still try Authentik session-end
    try {
      const authentikBase = getAuthentikBaseUrl();
      const postLogoutRedirect = `${window.location.origin}/login`;
      window.location.href = `${authentikBase}/if/session-end/?redirect_uri=${encodeURIComponent(postLogoutRedirect)}`;
    } catch {
      // Last resort: just go to login
      window.location.href = '/login';
    }
  }
}

/**
 * Sign out with custom redirect
 */
export const signOutWithRedirect = async (redirectTo: string = '/'): Promise<void> => {
  try {
    logger.info('Signing out with redirect', { redirectTo });
    await authentikAuthService.signOut();
    clearAllAuthStorage();

    const authentikBase = getAuthentikBaseUrl();
    const postLogoutRedirect = redirectTo.startsWith('http') ? redirectTo : `${window.location.origin}${redirectTo}`;
    window.location.href = `${authentikBase}/if/session-end/?redirect_uri=${encodeURIComponent(postLogoutRedirect)}`;
  } catch (error) {
    logger.error('Sign out with redirect failed', { error: (error as Error).message });
    clearAllAuthStorage();

    const authentikBase = getAuthentikBaseUrl();
    const postLogoutRedirect = redirectTo.startsWith('http') ? redirectTo : `${window.location.origin}${redirectTo}`;
    window.location.href = `${authentikBase}/if/session-end/?redirect_uri=${encodeURIComponent(postLogoutRedirect)}`;
  }
};

/**
 * Force sign out without waiting for auth service
 * Use this when auth service is unavailable
 */
export const forceSignOut = (redirectTo?: string): void => {
  logger.info('Force sign out called');

  try {
    localStorage.clear();
    sessionStorage.clear();

    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => caches.delete(cacheName));
      });
    }
  } catch (error) {
    logger.warn('Error during force sign out cleanup', { error: (error as Error).message });
  }

  // Redirect to Authentik session-end to invalidate SSO cookie
  setTimeout(() => {
    const authentikBase = getAuthentikBaseUrl();
    const postLogoutRedirect = redirectTo || `${window.location.origin}/login`;
    window.location.href = `${authentikBase}/if/session-end/?redirect_uri=${encodeURIComponent(postLogoutRedirect)}`;
  }, 50);
};

// Export convenience functions
export const signOut = performSignOut;
export const logout = performSignOut; 
