import { authentikAuthService } from '@/core/auth/authentikAuthServiceInstance';
import { logger } from '@/shared/utils/logger';

export async function performSignOut(): Promise<void> {
  try {
    logger.info('Signing out user');
    
    // Sign out from Authentik
    const result = await authentikAuthService.signOut();
    
    if (!result.success) {
      logger.error('Failed to sign out from Marcoby IAM:', result.error);
    }

    // Clear all authentication-related local storage
    localStorage.removeItem('authentik_token');
    localStorage.removeItem('authentik_refresh_token');
    localStorage.removeItem('authentik_session');
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('supabase.auth.refreshToken');
    localStorage.removeItem('supabase.auth.expiresAt');
    localStorage.removeItem('supabase.auth.expiresIn');
    localStorage.removeItem('supabase.auth.tokenType');
    localStorage.removeItem('supabase.auth.user');
    localStorage.removeItem('supabase.auth.session');

    // Clear any session storage
    sessionStorage.clear();

    // Clear any cached data
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
      } catch (error) {
        logger.warn('Failed to clear caches:', error);
      }
    }

    // Redirect to login page
    window.location.href = '/login';
    
    logger.info('User signed out successfully');
  } catch (error) {
    logger.error('Error during sign out:', error);
    
    // Even if there's an error, clear local storage and redirect
    localStorage.removeItem('authentik_token');
    localStorage.removeItem('authentik_refresh_token');
    localStorage.removeItem('authentik_session');
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('supabase.auth.refreshToken');
    localStorage.removeItem('supabase.auth.expiresAt');
    localStorage.removeItem('supabase.auth.expiresIn');
    localStorage.removeItem('supabase.auth.tokenType');
    localStorage.removeItem('supabase.auth.user');
    localStorage.removeItem('supabase.auth.session');
    sessionStorage.clear();
    
    window.location.href = '/login';
  }
}

/**
 * Sign out with custom redirect
 */
export const signOutWithRedirect = async (redirectTo: string = '/'): Promise<void> => {
  try {
    logger.info('Signing out with redirect', { redirectTo });
    
    // Perform the sign out
    await performSignOut();
    
    // Override the redirect
    setTimeout(() => {
      logger.info('Redirecting to specified page', { redirectTo });
      window.location.href = redirectTo;
    }, 100);
    
  } catch (error) {
    logger.error('Sign out with redirect failed', { error: (error as Error).message });
    
    // Redirect even on error
    setTimeout(() => {
      window.location.href = redirectTo;
    }, 100);
  }
};

/**
 * Force sign out without waiting for auth service
 * Use this when auth service is unavailable
 */
export const forceSignOut = (redirectTo: string = '/'): void => {
  logger.info('Force sign out called', { redirectTo });
  
  // Clear everything immediately
  try {
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear any cached data
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          caches.delete(cacheName);
        });
      });
    }

    // Force clear any remaining auth-related items
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
      'supabase.auth.session'
    ];
    
    authKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        // Ignore errors
      }
    });
  } catch (error) {
    logger.warn('Error during force sign out cleanup', { error: (error as Error).message });
  }
  
  // Force redirect
  setTimeout(() => {
    logger.info('Force redirecting to home page');
    window.location.href = redirectTo;
  }, 50);
};

// Export convenience functions
export const signOut = performSignOut;
export const logout = performSignOut; 
