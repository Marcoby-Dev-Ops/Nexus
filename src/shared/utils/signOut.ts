import { supabase } from '@/core/supabase';
import { useAuthStore } from '@/shared/stores/authStore';

// Enhanced logging utility
const logSignOut = (level: 'info' | 'warn' | 'error', message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  const logData = data ? ` | Data: ${JSON.stringify(data)}` : '';
  console.log(`[SignOut:${timestamp}] ${level.toUpperCase()}: ${message}${logData}`);
};

/**
 * Comprehensive sign out utility that ensures complete cleanup
 * This function should be used for all sign out operations
 */
export const performSignOut = async (): Promise<void> => {
  try {
    logSignOut('info', 'Starting comprehensive sign out process');
    
    // Step 1: Clear Zustand store state
    const store = useAuthStore.getState();
    store.clearAuth();
    logSignOut('info', 'Zustand store cleared');
    
    // Step 2: Call Supabase sign out
    const { error } = await supabase.auth.signOut();
    if (error) {
      logSignOut('error', 'Supabase sign out failed', { error: error.message });
    } else {
      logSignOut('info', 'Supabase sign out successful');
    }
    
    // Step 3: Clear all browser storage
    try {
      // Clear localStorage
      localStorage.clear();
      logSignOut('info', 'localStorage cleared');
      
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
    
    // Step 5: Force redirect to login page
    setTimeout(() => {
      logSignOut('info', 'Redirecting to login page');
      window.location.href = '/login';
    }, 100);
    
  } catch (error) {
    logSignOut('error', 'Sign out process failed', { error: (error as Error).message });
    
    // Even if there's an error, try to redirect to login
    setTimeout(() => {
      logSignOut('info', 'Redirecting to login page after error');
      window.location.href = '/login';
    }, 100);
  }
};

/**
 * Sign out with redirect to specific page
 */
export const signOutWithRedirect = async (redirectTo: string = '/login'): Promise<void> => {
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
export const forceSignOut = (redirectTo: string = '/login'): void => {
  logSignOut('info', 'Force sign out called', { redirectTo });
  
  // Clear everything immediately
  try {
    const store = useAuthStore.getState();
    store.clearAuth();
    localStorage.clear();
    sessionStorage.clear();
  } catch (error) {
    logSignOut('warn', 'Error during force sign out cleanup', { error: (error as Error).message });
  }
  
  // Force redirect
  setTimeout(() => {
    logSignOut('info', 'Force redirecting to login');
    window.location.href = redirectTo;
  }, 50);
};

// Export convenience functions
export const signOut = performSignOut;
export const logout = performSignOut; 