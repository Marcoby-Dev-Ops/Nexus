/**
 * HubSpot Integration Utilities
 */

import { HUBSPOT_API_ENDPOINTS, HUBSPOT_REQUIRED_SCOPES, HUBSPOT_OPTIONAL_SCOPES } from './constants';
import type { HubSpotAuthUrlParams, HubSpotOAuthTokens } from './types';

/**
 * Create HubSpot OAuth authorization URL with proper scope separation
 * Following HubSpot's OAuth Quickstart Guide requirements
 */
export function createHubSpotAuthUrl(params: HubSpotAuthUrlParams): string {
  const { clientId, redirectUri, requiredScopes, state } = params;
  
  // HubSpot requires space-separated scopes
  const formattedScopes = requiredScopes.join(' ');
  
  const urlParams = new URLSearchParams({
    clientid: clientId,
    redirecturi: redirectUri,
    scope: formattedScopes,
    responsetype: 'code'
  });

  // Add optional scopes if provided (HubSpot format)
  if (optionalScopes && optionalScopes.length > 0) {
    const formattedOptionalScopes = optionalScopes.join(' ');
    urlParams.set('optional_scope', formattedOptionalScopes);
  }

  // Add state parameter if provided
  if (state) {
    urlParams.set('state', state);
  }

  return `${HUBSPOT_API_ENDPOINTS.AUTH_URL}?${urlParams.toString()}`;
}

/**
 * Validate HubSpot OAuth tokens
 */
export function validateHubSpotTokens(tokens: HubSpotOAuthTokens): boolean {
  if (!tokens.access_token || !tokens.refresh_token) {
    return false;
  }

  // Check if tokens are expired
  if (tokens.expires_in && tokens.expires_in <= 0) {
    return false;
  }

  return true;
}

/**
 * Create default HubSpot OAuth URL with all scopes
 */
export function createDefaultHubSpotAuthUrl(clientId: string, redirectUri: string, state?: string): string {
  return createHubSpotAuthUrl({
    clientId,
    redirectUri,
    requiredScopes: HUBSPOT_REQUIRED_SCOPES,
    optionalScopes: HUBSPOT_OPTIONAL_SCOPES,
    state
  });
}

/**
 * Parse HubSpot OAuth callback parameters
 */
export function parseHubSpotCallback(url: string): {
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
} {
  const urlObj = new URL(url);
  
  return {
    code: urlObj.searchParams.get('code') || undefined,
    state: urlObj.searchParams.get('state') || undefined,
    error: urlObj.searchParams.get('error') || undefined,
    errordescription: urlObj.searchParams.get('error_description') || undefined
  };
}

/**
 * Format HubSpot API error messages
 */
export function formatHubSpotError(error: any): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  if (error?.error_description) {
    return error.error_description;
  }
  
  if (error?.error) {
    return error.error;
  }
  
  return 'Unknown HubSpot error occurred';
} 