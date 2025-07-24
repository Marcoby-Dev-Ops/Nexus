/**
 * HubSpot Configuration
 * 
 * This module provides centralized configuration for HubSpot integration.
 * All OAuth scopes and settings are managed here to ensure consistency.
 */

import { HUBSPOT_API_ENDPOINTS } from './constants';

export interface HubSpotConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

/**
 * Retrieves the HubSpot API key from environment variables.
 *
 * In a production Supabase environment, secrets are injected directly
 * into the runtime as environment variables. For local development,
 * these can be loaded from a `.env` file.
 *
 * @returns {string | null} The HubSpot API key, or null if it is not set.
 */
export function getHubspotApiKey(): string | null {
  return process.env.HUBSPOT_API_KEY || null;
}

/**
 * Retrieves the HubSpot OAuth configuration.
 *
 * In a production Supabase environment, secrets are injected as environment variables.
 * For local development, it reads from a .env file.
 *
 * @returns The HubSpot configuration object.
 */
export function getHubspotConfig(): HubSpotConfig {
  const clientId = process.env.HUBSPOT_CLIENT_ID;
  const clientSecret = process.env.HUBSPOT_CLIENT_SECRET;


  if (!clientId || !clientSecret) {
    throw new Error('HubSpot Client ID or Secret is not configured in environment variables.');
  }

  return {
    baseUrl: HUBSPOT_API_ENDPOINTS.API_BASE_URL,
    clientId,
    clientSecret,
    redirectUri: `${typeof window !== 'undefined' ? window.location.origin : 'https://nexus.marcoby.net'}/integrations/hubspot/callback`,
    // Note: Scopes are now managed in constants.ts and should be used via utils.ts
  };
}

/**
 * Get HubSpot OAuth scopes for different use cases
 */
export function getHubSpotScopes(includeOptional = true) {
  if (includeOptional) {
    return [...HUBSPOT_REQUIRED_SCOPES, ...HUBSPOT_OPTIONAL_SCOPES];
  }
  return [...HUBSPOT_REQUIRED_SCOPES];
} 