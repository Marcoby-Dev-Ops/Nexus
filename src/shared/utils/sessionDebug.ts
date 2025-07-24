/**
 * Session Debug Utilities
 * 
 * Tools for debugging session state and persistence issues
 */

import { supabase } from '@/core/supabase';

export interface SessionDebugInfo {
  hasLocalStorage: boolean;
  hasSessionStorage: boolean;
  storedSession: any;
  supabaseSession: any;
  sessionExpiry: number | null;
  isExpired: boolean;
  timeUntilExpiry: number | null;
  localStorageKeys: string[];
  sessionStorageKeys: string[];
  errors: string[];
}

/**
 * Get comprehensive session debug information
 */
export const getSessionDebugInfo = async (): Promise<SessionDebugInfo> => {
  const debugInfo: SessionDebugInfo = {
    hasLocalStorage: false,
    hasSessionStorage: false,
    storedSession: null,
    supabaseSession: null,
    sessionExpiry: null,
    isExpired: false,
    timeUntilExpiry: null,
    localStorageKeys: [],
    sessionStorageKeys: [],
    errors: []
  };

  try {
    // Check storage availability
    debugInfo.hasLocalStorage = typeof localStorage !== 'undefined';
    debugInfo.hasSessionStorage = typeof sessionStorage !== 'undefined';

    // Get localStorage keys
    if (debugInfo.hasLocalStorage) {
      try {
        debugInfo.localStorageKeys = Object.keys(localStorage);
      } catch (error) {
        debugInfo.errors.push(`Failed to get localStorage keys: ${error}`);
      }
    }

    // Get sessionStorage keys
    if (debugInfo.hasSessionStorage) {
      try {
        debugInfo.sessionStorageKeys = Object.keys(sessionStorage);
      } catch (error) {
        debugInfo.errors.push(`Failed to get sessionStorage keys: ${error}`);
      }
    }

    // Get stored session from localStorage
    if (debugInfo.hasLocalStorage) {
      try {
        const storedSessionStr = localStorage.getItem('nexus_auth_session');
        if (storedSessionStr) {
          debugInfo.storedSession = JSON.parse(storedSessionStr);
          
          if (debugInfo.storedSession.expiresAt) {
            // expiresAt is in seconds, convert to milliseconds for comparison
            debugInfo.sessionExpiry = debugInfo.storedSession.expiresAt * 1000;
            debugInfo.isExpired = debugInfo.sessionExpiry < Date.now();
            debugInfo.timeUntilExpiry = debugInfo.isExpired ? 0: debugInfo.sessionExpiry - Date.now();
          }
        }
      } catch (error) {
        debugInfo.errors.push(`Failed to parse stored session: ${error}`);
      }
    }

    // Get current Supabase session
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        debugInfo.errors.push(`Supabase session error: ${error.message}`);
      } else {
        debugInfo.supabaseSession = session;
      }
    } catch (error) {
      debugInfo.errors.push(`Failed to get Supabase session: ${error}`);
    }

  } catch (error) {
    debugInfo.errors.push(`General error in getSessionDebugInfo: ${error}`);
  }

  return debugInfo;
};

/**
 * Clear all session-related storage
 */
export const clearAllSessionStorage = (): void => {
  try {
    // Clear localStorage session keys
    const sessionKeys = [
      'nexus_auth_session',
      'nexus_current_session',
      'sb-nexus-auth-token',
      'supabase.auth.token'
    ];

    sessionKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      } catch (error) {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.warn(`Failed to remove ${key}:`, error);
      }
    });

    // Clear any other Supabase-related keys
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase') || key.includes('nexus_auth')) {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.warn(`Failed to remove ${key}:`, error);
        }
      }
    });

    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('Cleared all session storage');
  } catch (error) {
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error clearing session storage: ', error);
  }
};

/**
 * Force refresh the session
 */
export const forceRefreshSession = async (): Promise<boolean> => {
  try {
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('Force refreshing session...');
    
    // Clear stored session
    clearAllSessionStorage();
    
    // Try to refresh the session
    const { data: { session }, error } = await supabase.auth.refreshSession();
    
    if (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Session refresh failed: ', error);
      return false;
    }
    
    if (session) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('Session refreshed successfully');
      
      // Store the refreshed session
      try {
        const sessionData = {
          accessToken: session.access_token,
          refreshToken: session.refresh_token,
          expiresAt: session.expires_at,
          userId: session.user?.id,
          email: session.user?.email,
          timestamp: Date.now()
        };
        localStorage.setItem('nexus_auth_session', JSON.stringify(sessionData));
      } catch (error) {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Failed to store refreshed session: ', error);
      }
      
      return true;
    } else {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('No session after refresh');
      return false;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error force refreshing session: ', error);
    return false;
  }
};

/**
 * Check if session is valid and not expired
 */
export const isSessionValid = async (): Promise<boolean> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      return false;
    }
    
    // Check if session is expired
    if (session.expires_at && session.expires_at < Date.now() / 1000) {
      return false;
    }
    
    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error checking session validity: ', error);
    return false;
  }
};

/**
 * Log detailed session information for debugging
 */
export const logSessionDebugInfo = async (): Promise<void> => {
  const debugInfo = await getSessionDebugInfo();
  
  console.group('🔍 Session Debug Information');
  // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('Storage Available: ', {
    localStorage: debugInfo.hasLocalStorage,
    sessionStorage: debugInfo.hasSessionStorage
  });
  
  // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('Stored Session: ', debugInfo.storedSession);
  // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('Supabase Session: ', debugInfo.supabaseSession);
  
  if (debugInfo.sessionExpiry) {
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('Session Expiry: ', {
      expiry: new Date(debugInfo.sessionExpiry),
      isExpired: debugInfo.isExpired,
      timeUntilExpiry: debugInfo.timeUntilExpiry ? `${Math.round(debugInfo.timeUntilExpiry / 1000)}s` : 'N/A'
    });
  }
  
  // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('localStorage Keys: ', debugInfo.localStorageKeys.filter(key => 
    key.includes('supabase') || key.includes('nexus') || key.includes('auth')
  ));
  
  // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('sessionStorage Keys: ', debugInfo.sessionStorageKeys.filter(key => 
    key.includes('supabase') || key.includes('nexus') || key.includes('auth')
  ));
  
  if (debugInfo.errors.length > 0) {
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Errors: ', debugInfo.errors);
  }
  
  console.groupEnd();
};

/**
 * Initialize session debugging
 */
export const initializeSessionDebug = (): void => {
  if (import.meta.env.DEV) {
    // Add debug function to window for console access
    (window as any).debugSession = logSessionDebugInfo;
    (window as any).clearSessionStorage = clearAllSessionStorage;
    (window as any).forceRefreshSession = forceRefreshSession;
    (window as any).isSessionValid = isSessionValid;
    
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('🔍 Session debug utilities available: ');
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('- debugSession() - Log detailed session info');
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('- clearSessionStorage() - Clear all session storage');
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('- forceRefreshSession() - Force refresh session');
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('- isSessionValid() - Check if session is valid');
  }
}; 

/**
 * Comprehensive session debugging utility
 */
export const debugSessionExpiry = async () => {
  // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('🔍 Starting comprehensive session debugging...');
  
  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    environment: import.meta.env.MODE,
    userAgent: navigator.userAgent,
    localStorage: {
      available: false,
      nexusAuthSession: null,
      supabaseSession: null,
      otherKeys: []
    },
    sessionState: {
      hasSession: false,
      sessionData: null,
      expiresAt: null,
      timeUntilExpiry: null,
      isExpired: false,
      refreshAttempts: 0
    },
    supabaseState: {
      hasSession: false,
      sessionData: null,
      error: null
    },
    authStore: {
      isAuthenticated: false,
      isSessionValid: false,
      isSessionExpiring: false,
      sessionExpiry: null,
      refreshAttempts: 0
    }
  };

  try {
    // Check localStorage
    try {
      debugInfo.localStorage.available = true;
      debugInfo.localStorage.nexusAuthSession = localStorage.getItem('nexus_auth_session');
      debugInfo.localStorage.supabaseSession = localStorage.getItem('nexus-main-client');
      
      // Get all localStorage keys
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('nexus') || key?.includes('supabase')) {
          keys.push(key);
        }
      }
      debugInfo.localStorage.otherKeys = keys;
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('❌ localStorage access failed: ', error);
    }

    // Check current Supabase session
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      debugInfo.supabaseState.hasSession = !!session;
      debugInfo.supabaseState.sessionData = session ? {
        userId: session.user?.id,
        email: session.user?.email,
        expiresAt: session.expires_at,
        hasAccessToken: !!session.access_token,
        hasRefreshToken: !!session.refresh_token
      } : null;
      debugInfo.supabaseState.error = error?.message;
    } catch (error) {
      debugInfo.supabaseState.error = error instanceof Error ? error.message: 'Unknown error';
    }

    // Auth store state is now handled by AuthProvider
    // No need to check auth store state as it's managed by React Context

    // Calculate session expiry info
    if (debugInfo.supabaseState.sessionData) {
      const session = debugInfo.supabaseState.sessionData;
      if (session.expiresAt) {
        const now = Date.now();
        const expiresAt = typeof session.expiresAt === 'number' 
          ? session.expiresAt * 1000: new Date(session.expiresAt).getTime();
        
        debugInfo.sessionState.hasSession = true;
        debugInfo.sessionState.expiresAt = expiresAt;
        debugInfo.sessionState.timeUntilExpiry = expiresAt - now;
        debugInfo.sessionState.isExpired = now >= expiresAt;
        debugInfo.sessionState.sessionData = session;
      }
    }

    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('🔍 Session Debug Results: ', debugInfo);
    return debugInfo;

  } catch (error) {
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('❌ Session debugging failed: ', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Force session refresh and debug
 */
export const forceSessionRefresh = async () => {
  // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('🔄 Force refreshing session...');
  
  try {
    // Clear any cached sessions
    localStorage.removeItem('nexus_auth_session');
    localStorage.removeItem('nexus-main-client');
    
    // Force Supabase to refresh
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('❌ Force refresh failed: ', error);
      return { success: false, error: error.message };
    }
    
    if (data.session) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('✅ Force refresh successful');
      return { success: true, session: data.session };
    } else {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('❌ No session returned from force refresh');
      return { success: false, error: 'No session returned' };
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('❌ Force refresh error: ', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}; 