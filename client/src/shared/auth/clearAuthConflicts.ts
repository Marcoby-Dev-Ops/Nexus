/**
 * Utility to clear authentication conflicts between MSAL and Authentik
 * This should be called during app initialization to ensure clean auth state
 */

export const clearAuthConflicts = (): void => {
  try {
    // Clear MSAL-related localStorage entries
    const msalKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('msal.') || 
      key.includes('msal') ||
      key.includes('microsoft') ||
      key === 'msal_integration_cache'
    );
    
    msalKeys.forEach(key => {
      localStorage.removeItem(key);
    });

    // Clear MSAL-related sessionStorage entries
    const msalSessionKeys = Object.keys(sessionStorage).filter(key => 
      key.startsWith('msal.') || 
      key.includes('msal') ||
      key.includes('microsoft')
    );
    
    msalSessionKeys.forEach(key => {
      sessionStorage.removeItem(key);
    });

    // Clear MSAL-related cookies
    const cookies = document.cookie.split(';');
    cookies.forEach(cookie => {
      const [name] = cookie.trim().split('=');
      if (name.includes('msal') || name.includes('microsoft')) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
      }
    });

  } catch (error) {
    console.error('❌ Error clearing auth conflicts:', error);
  }
};

/**
 * Check if there are any MSAL-related storage entries that might conflict
 */
export const hasAuthConflicts = (): boolean => {
  try {
    // Check localStorage
    const hasMsalLocalStorage = Object.keys(localStorage).some(key => 
      key.startsWith('msal.') || 
      key.includes('msal') ||
      key.includes('microsoft')
    );

    // Check sessionStorage
    const hasMsalSessionStorage = Object.keys(sessionStorage).some(key => 
      key.startsWith('msal.') || 
      key.includes('msal') ||
      key.includes('microsoft')
    );

    // Check cookies
    const hasMsalCookies = document.cookie.includes('msal') || document.cookie.includes('microsoft');

    return hasMsalLocalStorage || hasMsalSessionStorage || hasMsalCookies;
  } catch (error) {
    console.error('❌ Error checking auth conflicts:', error);
    return false;
  }
};
