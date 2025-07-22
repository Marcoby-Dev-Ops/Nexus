/**
 * HubSpot OAuth Scopes Constants
 * 
 * Following OAuth 2.0 best practices:
 * - Minimal required scopes for initial connection
 * - Progressive scope requests based on user needs
 * - Clear separation between read/write permissions
 */

// Core OAuth scope (always required)
export const HUBSPOT_CORE_SCOPE = 'oauth';

// Minimal required scopes for basic CRM access
// Using HubSpot's official scope format
export const HUBSPOT_REQUIRED_SCOPES = [
  'crm.objects.contacts.read',
  'crm.objects.companies.read',
  'crm.objects.deals.read'
];

// Progressive scope groups based on user needs
export const HUBSPOT_SCOPE_GROUPS = {
  // Basic CRM read access
  basic: [
    'crm.objects.contacts.read',
    'crm.objects.companies.read',
    'crm.objects.deals.read'
  ],
  
  // Full CRM access (read + write)
  crm: [
    'crm.objects.contacts.read',
    'crm.objects.contacts.write',
    'crm.objects.companies.read',
    'crm.objects.companies.write',
    'crm.objects.deals.read',
    'crm.objects.deals.write'
  ],
  
  // Marketing capabilities
  marketing: [
    'crm.lists.read',
    'crm.lists.write',
    'marketing.email.read',
    'marketing.forms.read'
  ],
  
  // Analytics and reporting
  analytics: [
    'analytics.read',
    'crm.objects.contacts.read',
    'crm.objects.deals.read'
  ],
  
  // File management
  files: [
    'files.read',
    'files.write'
  ]
};

// Optional scopes for advanced features
export const HUBSPOT_OPTIONAL_SCOPES = [
  'crm.objects.contacts.write',
  'crm.objects.companies.write',
  'crm.objects.deals.write',
  'crm.lists.read',
  'crm.lists.write',
  'marketing.email.read',
  'analytics.read'
];

// Legacy scopes (for backward compatibility)
export const HUBSPOT_LEGACY_SCOPES = [
  'oauth',
  'crm.lists.read',
  'crm.lists.write',
  'crm.objects.companies.read',
  'crm.objects.companies.write',
  'crm.objects.contacts.read',
  'crm.objects.contacts.write',
  'crm.objects.deals.read',
  'crm.objects.deals.write',
  'crm.objects.goals.read',
  'crm.objects.goals.write',
  'crm.objects.leads.read',
  'crm.objects.leads.write',
  'crm.schemas.appointments.read',
  'crm.schemas.appointments.write'
];

// HubSpot API endpoints
export const HUBSPOT_API_ENDPOINTS = {
  AUTH_URL: 'https://app.hubspot.com/oauth/authorize',
  TOKEN_URL: 'https://api.hubapi.com/oauth/v1/token',
  API_BASE_URL: 'https://api.hubapi.com',
  CONTACTS_ENDPOINT: '/crm/v3/objects/contacts',
  COMPANIES_ENDPOINT: '/crm/v3/objects/companies',
  DEALS_ENDPOINT: '/crm/v3/objects/deals',
  LISTS_ENDPOINT: '/crm/v3/lists',
  PIPELINES_ENDPOINT: '/crm/v3/pipelines'
} as const;

// HubSpot integration metadata
export const HUBSPOT_INTEGRATION_METADATA = {
  name: 'HubSpot CRM',
  slug: 'hubspot',
  category: 'CRM',
  description: 'Connect HubSpot for marketing, sales, and CRM automation.',
  icon: 'Zap',
  authType: 'oauth',
  setupTime: '7 minutes',
  isPopular: true,
  dataFields: ['contacts', 'companies', 'deals', 'tickets', 'emails', 'calls']
} as const; 