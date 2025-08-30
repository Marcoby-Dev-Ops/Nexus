/**
 * Logging Configuration
 * 
 * Centralized configuration for controlling logging behavior across the application.
 * This helps reduce noise in development while maintaining useful debugging capabilities.
 */

export interface LoggingConfig {
  // General logging controls
  enableDebugLogs: boolean;
  enableMethodCallLogs: boolean;
  enableAuthLogs: boolean;
  enableApiLogs: boolean;
  
  // Service-specific logging
  enableServiceLogs: boolean;
  enableHealthServiceLogs: boolean;
  enableBusinessSystemLogs: boolean;
  
  // Performance logging
  enablePerformanceLogs: boolean;
  logSlowOperations: boolean;
  slowOperationThreshold: number; // milliseconds
}

/**
 * Get logging configuration based on environment variables
 */
export function getLoggingConfig(): LoggingConfig {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const debugEnabled = process.env.VITE_ENABLE_DEBUG_LOGS === 'true';
  const authDebugEnabled = process.env.VITE_DEBUG_AUTH === 'true';
  
  return {
    // General logging controls
    enableDebugLogs: isDevelopment && debugEnabled,
    enableMethodCallLogs: isDevelopment && debugEnabled,
    enableAuthLogs: isDevelopment && authDebugEnabled,
    enableApiLogs: isDevelopment && debugEnabled,
    
    // Service-specific logging
    enableServiceLogs: isDevelopment && debugEnabled,
    enableHealthServiceLogs: isDevelopment && debugEnabled,
    enableBusinessSystemLogs: isDevelopment && debugEnabled,
    
    // Performance logging
    enablePerformanceLogs: isDevelopment && debugEnabled,
    logSlowOperations: isDevelopment && debugEnabled,
    slowOperationThreshold: 1000, // 1 second
  };
}

/**
 * Check if a specific type of logging is enabled
 */
export function isLoggingEnabled(type: keyof LoggingConfig): boolean {
  const config = getLoggingConfig();
  return config[type] || false;
}

/**
 * Logging utility functions
 */
export const loggingUtils = {
  /**
   * Log only if debug logging is enabled
   */
  debug: (message: string, data?: any) => {
    if (isLoggingEnabled('enableDebugLogs')) {
      console.debug(`[DEBUG] ${message}`, data);
    }
  },
  
  /**
   * Log only if auth logging is enabled
   */
  auth: (message: string, data?: any) => {
    if (isLoggingEnabled('enableAuthLogs')) {
      console.log(`[AUTH] ${message}`, data);
    }
  },
  
  /**
   * Log only if API logging is enabled
   */
  api: (message: string, data?: any) => {
    if (isLoggingEnabled('enableApiLogs')) {
      console.log(`[API] ${message}`, data);
    }
  },
  
  /**
   * Log only if service logging is enabled
   */
  service: (serviceName: string, methodName: string, data?: any) => {
    if (isLoggingEnabled('enableServiceLogs')) {
      console.log(`[${serviceName}] ${methodName}`, data);
    }
  },
  
  /**
   * Log performance metrics only if enabled
   */
  performance: (operation: string, duration: number, data?: any) => {
    if (isLoggingEnabled('enablePerformanceLogs')) {
      const config = getLoggingConfig();
      if (duration > config.slowOperationThreshold) {
        console.warn(`[PERF] Slow operation: ${operation} took ${duration}ms`, data);
      } else {
        console.log(`[PERF] ${operation} took ${duration}ms`, data);
      }
    }
  }
};
