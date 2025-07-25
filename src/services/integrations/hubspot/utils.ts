/**
 * HubSpot Integration Utilities
 * Provides OAuth and API utilities for HubSpot integration
 */

export const HUBSPOT_REQUIRED_SCOPES = [
  'contacts',
  'crm.objects.contacts.read',
  'crm.objects.contacts.write',
  'crm.objects.companies.read',
  'crm.objects.companies.write',
  'crm.objects.deals.read',
  'crm.objects.deals.write',
  'crm.schemas.contacts.read',
  'crm.schemas.companies.read',
  'crm.schemas.deals.read'
];

export interface HubSpotAuthUrlParams {
  clientId: string;
  redirectUri: string;
  requiredScopes: string[];
  state?: string;
}

/**
 * Creates a HubSpot OAuth authorization URL
 */
export function createHubSpotAuthUrl({
  clientId,
  redirectUri,
  requiredScopes,
  state
}: HubSpotAuthUrlParams): string {
  const baseUrl = 'https://app.hubspot.com/oauth/authorize';
  const scopes = requiredScopes.join(' ');
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes
  });

  if (state) {
    params.append('state', state);
  }

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Validates HubSpot OAuth callback parameters
 */
export function validateHubSpotCallback(searchParams: URLSearchParams): {
  code?: string;
  state?: string;
  error?: string;
  errorDescription?: string;
} {
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  return {
    code: code || undefined,
    state: state || undefined,
    error: error || undefined,
    errorDescription: errorDescription || undefined
  };
}

/**
 * Parses HubSpot state parameter
 */
export function parseHubSpotState(state: string): {
  timestamp: number;
  service: string;
  userId: string | null;
} | null {
  try {
    const decoded = atob(state);
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Failed to parse HubSpot state:', error);
    return null;
  }
} 