/**
 * Hooks Index - Central export for all hooks
 * 
 * This file provides a centralized export for all hooks used throughout the application.
 * It acts as a bridge between the shared authentication system and the rest of the app.
 */

// Re-export the shared authentication hook
export { useAuthentikAuth as useAuth } from '@/shared/contexts/AuthentikAuthContext';

// Re-export other commonly used hooks that actually exist
export { useUser } from '@/shared/hooks/useUser';
export { useRedirectManager } from '@/shared/hooks/useRedirectManager';
export { useAuthenticatedApi } from './useAuthenticatedApi';

// Re-export additional hooks that might be needed
export { useUserProfile } from '@/shared/contexts/UserContext';
export { useCompany } from '@/shared/contexts/CompanyContext';
export { useUserPreferences } from '@/shared/contexts/UserPreferencesContext';