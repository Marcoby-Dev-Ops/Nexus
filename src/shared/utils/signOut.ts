import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth.ts';

// Enhanced logging utility
const logSignOut = (level: 'info' | 'warn' | 'error', message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  const logData = data ? ` | Data: ${JSON.stringify(data)}` : '';
  // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log(`[SignOut: ${timestamp}] ${level.toUpperCase()}: ${message}${logData}`);
};

/**
 * Comprehensive sign out utility that ensures complete cleanup
 * This function should be used for all sign out operations
 */
export const performSignOut = async (): Promise<void> => {
  try {
    logSignOut('info', 'Starting comprehensive sign out process');
    
    // Step 1: Auth state is now handled by AuthProvider
    // No need to clear Zustand store as it's managed by React Context
    logSignOut('info', 'Auth state will be cleared by AuthProvider');
    
    // Step 2: Call Supabase sign out
    const { error } = await supabase.auth.signOut();
    if (error) {
      logSignOut('error', 'Supabase sign out failed', { error: error.message });
    } else {
      logSignOut('info', 'Supabase sign out successful');
    }
    
    // Step 3: Clear all browser storage
    try {
      // Preserve theme preference
      const themePreference = localStorage.getItem('theme');
      const primaryColorPreference = localStorage.getItem('primaryColor');
      
      // Clear localStorage
      localStorage.clear();
      logSignOut('info', 'localStorage cleared');
      
      // Restore theme preferences
      if (themePreference) {
        localStorage.setItem('theme', themePreference);
        logSignOut('info', 'Theme preference preserved');
      }
      if (primaryColorPreference) {
        localStorage.setItem('primaryColor', primaryColorPreference);
        logSignOut('info', 'Primary color preference preserved');
      }
      
      // Clear sessionStorage
      sessionStorage.clear();
      logSignOut('info', 'sessionStorage cleared');
      
      // Clear specific items that might persist
      localStorage.removeItem('nexus-auth-store');
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.removeItem('supabase.auth.token');
      logSignOut('info', 'Specific auth items cleared');
    } catch (storageError) {
      logSignOut('warn', 'Failed to clear some storage', { error: (storageError as Error).message });
    }
    
    // Step 4: Clear any cached data
    try {
      // Clear any cached API responses
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        logSignOut('info', 'Browser cache cleared');
      }
    } catch (cacheError) {
      logSignOut('warn', 'Failed to clear cache', { error: (cacheError as Error).message });
    }
    
    logSignOut('info', 'Sign out process completed successfully');
    
    // Step 5: Force redirect to home page
    setTimeout(() => {
      logSignOut('info', 'Redirecting to home page');
      window.location.href = '/';
    }, 100);
    
  } catch (error) {
    logSignOut('error', 'Sign out process failed', { error: (error as Error).message });
    
    // Even if there's an error, try to redirect to home page
    setTimeout(() => {
      logSignOut('info', 'Redirecting to home page after error');
      window.location.href = '/';
    }, 100);
  }
};

/**
 * Sign out with redirect to specific page
 */
export const signOutWithRedirect = async (redirectTo: string = '/'): Promise<void> => {
  try {
    logSignOut('info', 'Signing out with redirect', { redirectTo });
    
    // Perform the sign out
    await performSignOut();
    
    // Override the redirect
    setTimeout(() => {
      logSignOut('info', 'Redirecting to specified page', { redirectTo });
      window.location.href = redirectTo;
    }, 100);
    
  } catch (error) {
    logSignOut('error', 'Sign out with redirect failed', { error: (error as Error).message });
    
    // Redirect even on error
    setTimeout(() => {
      window.location.href = redirectTo;
    }, 100);
  }
};

/**
 * Force sign out (ignores errors and forces redirect)
 */
export const forceSignOut = (redirectTo: string = '/'): void => {
  logSignOut('info', 'Force sign out called', { redirectTo });
  
  // Clear everything immediately
  try {
    // Preserve theme preference
    const themePreference = localStorage.getItem('theme');
    const primaryColorPreference = localStorage.getItem('primaryColor');
    
    // Auth state is now handled by AuthProvider
    // No need to clear store as it's managed by React Context
    localStorage.clear();
    sessionStorage.clear();
    
    // Restore theme preferences
    if (themePreference) {
      localStorage.setItem('theme', themePreference);
    }
    if (primaryColorPreference) {
      localStorage.setItem('primaryColor', primaryColorPreference);
    }
  } catch (error) {
    logSignOut('warn', 'Error during force sign out cleanup', { error: (error as Error).message });
  }
  
  // Force redirect
  setTimeout(() => {
    logSignOut('info', 'Force redirecting to home page');
    window.location.href = redirectTo;
  }, 50);
};

// Export convenience functions
export const signOut = performSignOut;
export const logout = performSignOut; 