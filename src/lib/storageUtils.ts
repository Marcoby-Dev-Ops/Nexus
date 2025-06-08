/**
 * @name storageUtils
 * @description Utilities for managing localStorage and preventing JSON parsing errors.
 */

/**
 * Safely get an item from localStorage with JSON parsing
 * @param key - The localStorage key
 * @param defaultValue - Default value to return if parsing fails
 * @returns The parsed value or default value
 */
export function safeGetLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    console.warn(`Failed to parse localStorage item "${key}":`, error);
    // Remove the corrupted item
    localStorage.removeItem(key);
    return defaultValue;
  }
}

/**
 * Safely set an item in localStorage with JSON stringification
 * @param key - The localStorage key
 * @param value - The value to store
 * @returns Whether the operation was successful
 */
export function safeSetLocalStorage<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`Failed to set localStorage item "${key}":`, error);
    return false;
  }
}

/**
 * Clean up potentially corrupted localStorage items
 * @param keysToCheck - Array of key patterns to check
 */
export function cleanupLocalStorage(keysToCheck: string[] = [
  'vite-ui-theme',
  'nexus_n8n_config_',
  'nexus_onboarding_state',
  'n8n_webhook_'
]): void {
  try {
    const allKeys = Object.keys(localStorage);
    let cleanedCount = 0;

    allKeys.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          // Check for common problematic values
          if (value === '[object Object]' || value === 'undefined' || value === 'null') {
            console.warn(`Removing invalid localStorage value for key: ${key}`);
            localStorage.removeItem(key);
            cleanedCount++;
            return;
          }
          
          // Only validate JSON for keys we care about
          const shouldValidateJSON = keysToCheck.some(pattern => key.includes(pattern));
          
          if (shouldValidateJSON) {
            // Try to parse the JSON to see if it's valid
            JSON.parse(value);
          }
        }
      } catch (e) {
        console.warn(`Removing corrupted localStorage key: ${key}`);
        localStorage.removeItem(key);
        cleanedCount++;
      }
    });

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} corrupted localStorage items`);
    }
  } catch (error) {
    console.warn('Error during localStorage cleanup:', error);
  }
}

/**
 * Aggressive cleanup for immediate issues
 */
export function aggressiveCleanup(): void {
  try {
    const allKeys = Object.keys(localStorage);
    let cleanedCount = 0;

    allKeys.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          // Remove any "[object Object]" values immediately
          if (value === '[object Object]' || value === 'undefined' || value === 'null' || value === '') {
            console.warn(`Aggressive cleanup removing: ${key} = "${value}"`);
            localStorage.removeItem(key);
            cleanedCount++;
            return;
          }
          
          // Try to parse all values to check validity
          try {
            JSON.parse(value);
          } catch (e) {
            // If it's not valid JSON and not a simple string, remove it
            if (value.includes('{') || value.includes('[') || value.includes('object')) {
              console.warn(`Aggressive cleanup removing invalid JSON: ${key}`);
              localStorage.removeItem(key);
              cleanedCount++;
            }
          }
        }
      } catch (e) {
        console.warn(`Aggressive cleanup error for key ${key}:`, e);
        localStorage.removeItem(key);
        cleanedCount++;
      }
    });

    if (cleanedCount > 0) {
      console.log(`Aggressive cleanup removed ${cleanedCount} problematic localStorage items`);
    }
  } catch (error) {
    console.warn('Error during aggressive localStorage cleanup:', error);
  }
}

/**
 * Initialize localStorage cleanup on app start
 */
export function initializeStorageCleanup(): void {
  // Run aggressive cleanup first to fix immediate issues
  aggressiveCleanup();
  
  // Run normal cleanup
  cleanupLocalStorage();

  // Set up periodic cleanup (every 5 minutes)
  setInterval(() => {
    cleanupLocalStorage();
  }, 5 * 60 * 1000);
}

/**
 * Check if localStorage is available
 * @returns Whether localStorage is available
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, 'test');
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
} 