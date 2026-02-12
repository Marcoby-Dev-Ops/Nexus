/**
 * API URL utility to centralize API endpoint construction
 * Fixes the issue with relative URLs pointing to the wrong server
 */

/**
 * Get the base API URL from environment variables
 */
export function getApiUrl(): string {
  // Use VITE_API_URL if defined, otherwise empty string for relative URLs (Vite proxy)
  const apiUrl = import.meta.env.VITE_API_URL || '';
  return apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
}

/**
 * Construct a relative or absolute API URL from a path
 * @param path - API path (e.g., '/api/organizations')
 * @returns Full API URL
 */
export function buildApiUrl(path: string): string {
  const baseUrl = getApiUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

/**
 * Common API endpoints
 */
export const API_ENDPOINTS = {
  // Organizations
  ORGANIZATIONS: '/api/organizations',
  ORGANIZATION: (id: string) => `/api/organizations/${id}`,
  ORGANIZATION_MEMBERS: (id: string) => `/api/organizations/${id}/members`,

  // User preferences
  USER_PREFERENCES: '/api/user-preferences',
  USER_PREFERENCES_QUERY: (userId: string) => `/api/user-preferences?userId=${userId}`,
  USER_PREFERENCES_NOTIFICATIONS: '/api/user-preferences/notifications',

  // OAuth
  OAUTH_CONFIG: (provider: string) => `/api/oauth/config/${provider}`,
  OAUTH_TOKEN: '/api/oauth/token',
  OAUTH_REFRESH: '/api/oauth/refresh',
  OAUTH_STATE: '/api/oauth/state',

  // AI
  AI_CHAT: '/api/ai/chat',
  AI_EMBEDDINGS: '/api/ai/embeddings',

  // Integrations
  INTEGRATIONS_HUBSPOT_DATA: '/api/integrations/hubspot/data',
  INTEGRATIONS_ANALYTICS_DATA: '/api/integrations/analytics/data',
  INTEGRATIONS_FINANCE_DATA: '/api/integrations/finance/data',

  // Push notifications
  PUSH_VAPID_PUBLIC_KEY: '/api/push/vapid-public-key',
  PUSH_SUBSCRIPTIONS: '/api/push/subscriptions',
  PUSH_TEST: '/api/push/test',

  // Other
  VAR_LEADS: '/api/var-leads',
  THOUGHTS: '/api/thoughts',
  QUANTUM_ONBOARDING_SAVE: '/api/quantum/onboarding/save',
} as const;
