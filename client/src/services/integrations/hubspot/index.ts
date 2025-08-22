/**
 * HubSpot Integration Service
 * Exports HubSpot integration utilities and constants
 */

import { HUBSPOT_REQUIRED_SCOPES, HUBSPOT_API_BASE_URL, HUBSPOT_OAUTH_BASE_URL, HUBSPOT_OBJECT_TYPES, HUBSPOT_PROPERTY_TYPES } from './constants';
import { createHubSpotAuthUrl, validateHubSpotCallback, parseHubSpotState } from './utils';

export const hubspotIntegration = {
  constants: {
    REQUIRED_SCOPES: HUBSPOT_REQUIRED_SCOPES,
    API_BASE_URL: HUBSPOT_API_BASE_URL,
    OAUTH_BASE_URL: HUBSPOT_OAUTH_BASE_URL,
    OBJECT_TYPES: HUBSPOT_OBJECT_TYPES,
    PROPERTY_TYPES: HUBSPOT_PROPERTY_TYPES
  },
  utils: {
    createAuthUrl: createHubSpotAuthUrl,
    validateCallback: validateHubSpotCallback,
    parseState: parseHubSpotState
  }
};

// Also export individual items for direct imports
export * from './constants';
export * from './utils'; 
