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

function getRuntimeConfigValue(key: string): string | undefined {
  const runtimeValue = (window as any).__APP_CONFIG__?.[key];
  if (typeof runtimeValue === 'string' && runtimeValue.trim()) {
    return runtimeValue.trim();
  }
  const viteValue = (import.meta.env as any)?.[key];
  if (typeof viteValue === 'string' && viteValue.trim()) {
    return viteValue.trim();
  }
  return undefined;
}

function getLoginRedirectUrl(): string {
  return getRuntimeConfigValue('VITE_APP_LOGIN_URL') || `${window.location.origin}/login`;
}

function useGlobalSsoLogout(): boolean {
  return getRuntimeConfigValue('VITE_AUTHENTIK_GLOBAL_LOGOUT') === 'true';
}

function redirectAfterLogout(redirectTo?: string): void {
  const targetUrl = redirectTo || getLoginRedirectUrl();
  if (useGlobalSsoLogout()) {
    const authentikBase = getAuthentikBaseUrl();
    window.location.href = `${authentikBase}/if/session-end/?redirect_uri=${encodeURIComponent(targetUrl)}`;
    return;
  }
  window.location.href = targetUrl;
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

    redirectAfterLogout();

    logger.info('User signed out successfully');
  } catch (error) {
    logger.error('Error during sign out:', error);

    clearAllAuthStorage();

    // Fallback: redirect to app login
    try {
      redirectAfterLogout();
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

    const postLogoutRedirect = redirectTo.startsWith('http') ? redirectTo : `${window.location.origin}${redirectTo}`;
    redirectAfterLogout(postLogoutRedirect);
  } catch (error) {
    logger.error('Sign out with redirect failed', { error: (error as Error).message });
    clearAllAuthStorage();

    const postLogoutRedirect = redirectTo.startsWith('http') ? redirectTo : `${window.location.origin}${redirectTo}`;
    redirectAfterLogout(postLogoutRedirect);
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

  // Redirect to app login (or global SSO logout if explicitly enabled)
  setTimeout(() => {
    const postLogoutRedirect = redirectTo || getLoginRedirectUrl();
    redirectAfterLogout(postLogoutRedirect);
  }, 50);
};

// Export convenience functions
export const signOut = performSignOut;
export const logout = performSignOut; 
