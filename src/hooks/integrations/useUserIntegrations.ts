import { useIntegrations } from './useIntegrations';

/**
 * useUserIntegrations hook
 * 
 * This is an alias for useIntegrations that provides user-specific integration functionality.
 * The useIntegrations hook already handles user-specific operations by using the current user
 * from the auth context.
 * 
 * @returns Same interface as useIntegrations
 */
export const useUserIntegrations = useIntegrations;

// Re-export for convenience
export * from './useIntegrations';