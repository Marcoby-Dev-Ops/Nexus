/**
 * HubSpot Integration Constants
 */

export const HUBSPOT_REQUIRED_SCOPES = [
  'crm.lists.read',
  'crm.lists.write',
  'crm.objects.contacts.read',
  'crm.objects.contacts.write',
  'crm.objects.companies.read',
  'crm.objects.companies.write',
  'crm.objects.deals.read',
  'crm.objects.deals.write',
  'crm.objects.goals.read',
  'crm.objects.goals.write',
  'crm.objects.leads.read',
  'crm.objects.leads.write',
  'crm.schemas.appointments.read',
  'crm.schemas.appointments.write',
  'oauth'
];

export const HUBSPOT_API_BASE_URL = 'https://api.hubapi.com';
export const HUBSPOT_OAUTH_BASE_URL = 'https://app.hubspot.com/oauth';

export const HUBSPOT_OBJECT_TYPES = {
  CONTACTS: 'contacts',
  COMPANIES: 'companies',
  DEALS: 'deals',
  TICKETS: 'tickets'
} as const;

export const HUBSPOT_PROPERTY_TYPES = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  DATE: 'date',
  ENUMERATION: 'enumeration',
  OBJECT: 'object'
} as const; 
