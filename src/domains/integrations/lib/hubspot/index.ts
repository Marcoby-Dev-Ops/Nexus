/**
 * Consolidated HubSpot Integration Module
 * Pillar: 1,2 - CRM integration for sales and marketing automation
 * 
 * This module consolidates all HubSpot functionality into a single, well-organized structure.
 * All HubSpot OAuth scopes, configuration, and services are managed here.
 */

// Core configuration
export { getHubspotConfig } from './config';
export { HubSpotService } from './service';

// Types and interfaces
export type {
  HubSpotConfig,
  HubSpotContact,
  HubSpotCompany,
  HubSpotDeal,
  HubSpotIntegration
} from './types';

// Constants
export { HUBSPOT_SCOPES, HUBSPOT_REQUIRED_SCOPES, HUBSPOT_OPTIONAL_SCOPES } from './constants';

// Utilities
export { createHubSpotAuthUrl, validateHubSpotTokens } from './utils'; 