/**
 * HubSpot Public App Configuration
 * 
 * This module defines the configuration for Nexus as a HubSpot public app.
 * It includes app metadata, capabilities, and integration points.
 */

export interface HubSpotAppConfig {
  // App Identity
  appId: string;
  appName: string;
  appDescription: string;
  appUrl: string;
  appLogo?: string;
  
  // OAuth Configuration
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  
  // App Capabilities
  capabilities: HubSpotAppCapability[];
  
  // Integration Points
  integrations: HubSpotIntegrationPoint[];
  
  // App Settings
  settings: HubSpotAppSettings;
}

export interface HubSpotAppCapability {
  id: string;
  name: string;
  description: string;
  category: 'crm' | 'marketing' | 'sales' | 'service' | 'analytics';
  scopes: string[];
  enabled: boolean;
}

export interface HubSpotIntegrationPoint {
  id: string;
  name: string;
  type: 'webhook' | 'iframe' | 'card' | 'workflow';
  url: string;
  scopes: string[];
  enabled: boolean;
}

export interface HubSpotAppSettings {
  autoSync: boolean;
  syncFrequency: 'realtime' | 'hourly' | 'daily';
  dataRetention: number; // days
  maxApiCalls: number;
  webhookTimeout: number; // seconds
}

/**
 * Default HubSpot app configuration for Nexus
 */
export const HUBSPOTAPPCONFIG: HubSpotAppConfig = {
  appId: 'nexus-business-platform',
  appName: 'Nexus Business Platform',
  appDescription: 'Comprehensive business management platform that integrates with HubSpot CRM for enhanced sales, marketing, and customer service capabilities.',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  appLogo: '/images/nexus-logo.png',
  
  clientId: process.env.HUBSPOT_CLIENT_ID || '',
  clientSecret: process.env.HUBSPOT_CLIENT_SECRET || '',
  redirectUri: `${typeof window !== 'undefined' ? window.location.origin : 'https://nexus.marcoby.net'}/integrations/hubspot/callback`,
  
  capabilities: [
    {
      id: 'crm-sync',
      name: 'CRM Data Synchronization',
      description: 'Bidirectional sync of contacts, companies, and deals between Nexus and HubSpot',
      category: 'crm',
      scopes: [
        'crm.objects.contacts.read',
        'crm.objects.contacts.write',
        'crm.objects.companies.read',
        'crm.objects.companies.write',
        'crm.objects.deals.read',
        'crm.objects.deals.write'
      ],
      enabled: true
    },
    {
      id: 'sales-automation',
      name: 'Sales Pipeline Automation',
      description: 'Automated lead scoring, deal tracking, and sales process management',
      category: 'sales',
      scopes: [
        'crm.objects.deals.read',
        'crm.objects.deals.write',
        'crm.objects.contacts.read',
        'crm.objects.contacts.write'
      ],
      enabled: true
    },
    {
      id: 'marketing-analytics',
      name: 'Marketing Analytics',
      description: 'Comprehensive marketing performance tracking and ROI analysis',
      category: 'marketing',
      scopes: [
        'crm.lists.read',
        'crm.lists.write',
        'crm.objects.contacts.read'
      ],
      enabled: true
    },
    {
      id: 'customer-service',
      name: 'Customer Service Integration',
      description: 'Unified customer service management with ticket tracking',
      category: 'service',
      scopes: [
        'crm.objects.contacts.read',
        'crm.objects.contacts.write'
      ],
      enabled: true
    },
    {
      id: 'business-intelligence',
      name: 'Business Intelligence',
      description: 'Advanced analytics and reporting for business insights',
      category: 'analytics',
      scopes: [
        'crm.objects.contacts.read',
        'crm.objects.companies.read',
        'crm.objects.deals.read'
      ],
      enabled: true
    }
  ],
  
  integrations: [
    {
      id: 'contact-sync-webhook',
      name: 'Contact Sync Webhook',
      type: 'webhook',
      url: '/api/webhooks/hubspot/contact-sync',
      scopes: ['crm.objects.contacts.read'],
      enabled: true
    },
    {
      id: 'deal-sync-webhook',
      name: 'Deal Sync Webhook',
      type: 'webhook',
      url: '/api/webhooks/hubspot/deal-sync',
      scopes: ['crm.objects.deals.read'],
      enabled: true
    },
    {
      id: 'nexus-dashboard',
      name: 'Nexus Dashboard',
      type: 'iframe',
      url: '/integrations/hubspot/dashboard',
      scopes: [
        'crm.objects.contacts.read',
        'crm.objects.companies.read',
        'crm.objects.deals.read'
      ],
      enabled: true
    },
    {
      id: 'lead-management-workflow',
      name: 'Lead Management Workflow',
      type: 'workflow',
      url: '/api/workflows/hubspot/lead-management',
      scopes: [
        'crm.objects.contacts.read',
        'crm.objects.contacts.write'
      ],
      enabled: true
    }
  ],
  
  settings: {
    autoSync: true,
    syncFrequency: 'hourly',
    dataRetention: 365, // 1 year
    maxApiCalls: 10000, // per day
    webhookTimeout: 30 // seconds
  }
};

/**
 * Get HubSpot app configuration
 */
export function getHubspotAppConfig(): HubSpotAppConfig {
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
 * Validate HubSpot app configuration
 */
export function validateHubSpotAppConfig(config: HubSpotAppConfig): string[] {
  const errors: string[] = [];
  
  if (!config.clientId) {
    errors.push('HubSpot Client ID is required');
  }
  
  if (!config.clientSecret) {
    errors.push('HubSpot Client Secret is required');
  }
  
  if (!config.appUrl) {
    errors.push('App URL is required');
  }
  
  if (config.capabilities.length === 0) {
    errors.push('At least one capability must be defined');
  }
  
  return errors;
}

/**
 * Get enabled capabilities
 */
export function getEnabledCapabilities(config: HubSpotAppConfig): HubSpotAppCapability[] {
  return config.capabilities.filter(capability => capability.enabled);
}

/**
 * Get all required scopes for enabled capabilities
 */
export function getAllRequiredScopes(config: HubSpotAppConfig): string[] {
  const enabledCapabilities = getEnabledCapabilities(config);
  const scopes = new Set<string>();
  
  enabledCapabilities.forEach(capability => {
    capability.scopes.forEach(scope => scopes.add(scope));
  });
  
  return Array.from(scopes);
} 