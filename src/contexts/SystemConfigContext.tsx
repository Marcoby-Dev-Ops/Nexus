import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

interface SystemConfig {
  appName: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  features: {
    /** Whether AI features are enabled */
    ai: boolean;
    /** Whether multi-team features are enabled */
    multiTeam: boolean;
    /** Whether marketplace is enabled */
    marketplace: boolean;
    /** Whether advanced analytics is enabled */
    advancedAnalytics: boolean;
    /** Whether localization is enabled */
    localization: boolean;
    /** Whether custom branding is enabled */
    customBranding: boolean;
  };
  api: {
    /** Base URL for API calls */
    baseUrl: string;
    /** Timeout for API calls in milliseconds */
    timeout: number;
  };
  branding: {
    /** Primary brand color (hex) */
    primaryColor: string;
    /** Secondary brand color (hex) */
    secondaryColor: string;
    /** Brand logo URL */
    logoUrl: string;
    /** Brand favicon URL */
    faviconUrl: string;
  };
  /** Default language */
  defaultLanguage: string;
  /** Available languages */
  supportedLanguages: { code: string; name: string }[];
  /** Contact support email */
  supportEmail: string;
  /** Documentation URL */
  docsUrl: string;
  /** Privacy policy URL */
  privacyPolicyUrl: string;
  /** Terms of service URL */
  termsOfServiceUrl: string;
}

interface SystemConfigContextType {
  /** System configuration */
  config: SystemConfig;
  /** Whether configuration is still loading */
  isLoading: boolean;
  /** Any loading error */
  error: Error | null;
  /** Function to reload configuration */
  reloadConfig: () => Promise<void>;
  /** Function to override configuration (admin only) */
  overrideConfig: (updates: Partial<SystemConfig>) => void;
  /** Whether configuration has been overridden */
  isOverridden: boolean;
  /** Function to reset to default configuration */
  resetConfig: () => void;
}

// Default configuration
const defaultConfig: SystemConfig = {
  appName: 'Nexus',
  version: '1.0.0',
  environment: 'development',
  features: {
    ai: true,
    multiTeam: true,
    marketplace: true,
    advancedAnalytics: true,
    localization: true,
    customBranding: true,
  },
  api: {
    baseUrl: '/api',
    timeout: 30000,
  },
  branding: {
    primaryColor: '#0070f3',
    secondaryColor: '#6b21a8',
    logoUrl: '/assets/logo.svg',
    faviconUrl: '/favicon.ico',
  },
  defaultLanguage: 'en',
  supportedLanguages: [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
  ],
  supportEmail: 'support@nexusapp.com',
  docsUrl: 'https://docs.nexusapp.com',
  privacyPolicyUrl: 'https://nexusapp.com/privacy',
  termsOfServiceUrl: 'https://nexusapp.com/terms',
};

// Create context
const SystemConfigContext = createContext<SystemConfigContextType | undefined>(undefined);

/**
 * SystemConfigProvider - Provides system-wide configuration
 * 
 * Features:
 * - Loads configuration from API or environment
 * - Provides configuration to all components
 * - Allows overriding configuration (for development/testing)
 * - Handles different environments
 */
export const SystemConfigProvider: React.FC<{ children: ReactNode }> = ({ 
  children 
}) => {
  const [config, setConfig] = useState<SystemConfig>(defaultConfig);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isOverridden, setIsOverridden] = useState<boolean>(false);

  // Load configuration on mount
  useEffect(() => {
    loadConfig();
  }, []);

  // Load configuration from API or environment
  const loadConfig = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // In a real application, this would be an API call to load configuration
      // For this example, we'll simulate a delay and use environment variables or defaults
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check for environment variables (would be injected at build time)
      const envConfig: Partial<SystemConfig> = {
        appName: process.env.REACT_APP_NAME || defaultConfig.appName,
        version: process.env.REACT_APP_VERSION || defaultConfig.version,
        environment: (process.env.NODE_ENV || 'development') as 'development' | 'staging' | 'production',
        api: {
          baseUrl: process.env.REACT_APP_API_URL || defaultConfig.api.baseUrl,
          timeout: process.env.REACT_APP_API_TIMEOUT ? parseInt(process.env.REACT_APP_API_TIMEOUT) : defaultConfig.api.timeout,
        },
        features: {
          ai: process.env.REACT_APP_FEATURE_AI === 'true' || defaultConfig.features.ai,
          multiTeam: process.env.REACT_APP_FEATURE_MULTI_TEAM === 'true' || defaultConfig.features.multiTeam,
          marketplace: process.env.REACT_APP_FEATURE_MARKETPLACE === 'true' || defaultConfig.features.marketplace,
          advancedAnalytics: process.env.REACT_APP_FEATURE_ADVANCED_ANALYTICS === 'true' || defaultConfig.features.advancedAnalytics,
          localization: process.env.REACT_APP_FEATURE_LOCALIZATION === 'true' || defaultConfig.features.localization,
          customBranding: process.env.REACT_APP_FEATURE_CUSTOM_BRANDING === 'true' || defaultConfig.features.customBranding,
        },
      };
      
      // Merge with defaults
      setConfig({
        ...defaultConfig,
        ...envConfig,
        api: {
          ...defaultConfig.api,
          ...envConfig.api,
        },
        features: {
          ...defaultConfig.features,
          ...envConfig.features,
        },
      });
      
      setIsOverridden(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load system configuration'));
      console.error('Failed to load system configuration:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Reload configuration
  const reloadConfig = async (): Promise<void> => {
    await loadConfig();
  };

  // Override configuration (for development/testing)
  const overrideConfig = (updates: Partial<SystemConfig>): void => {
    setConfig(prevConfig => ({
      ...prevConfig,
      ...updates,
      api: {
        ...prevConfig.api,
        ...(updates.api || {}),
      },
      features: {
        ...prevConfig.features,
        ...(updates.features || {}),
      },
      branding: {
        ...prevConfig.branding,
        ...(updates.branding || {}),
      },
    }));
    setIsOverridden(true);
  };

  // Reset to default configuration
  const resetConfig = (): void => {
    setConfig(defaultConfig);
    setIsOverridden(false);
  };

  // Context value
  const value: SystemConfigContextType = {
    config,
    isLoading,
    error,
    reloadConfig,
    overrideConfig,
    isOverridden,
    resetConfig,
  };

  return (
    <SystemConfigContext.Provider value={value}>
      {children}
    </SystemConfigContext.Provider>
  );
};

/**
 * useSystemConfig - Hook to access system configuration
 */
export const useSystemConfig = (): SystemConfigContextType => {
  const context = useContext(SystemConfigContext);
  
  if (context === undefined) {
    throw new Error('useSystemConfig must be used within a SystemConfigProvider');
  }
  
  return context;
}; 