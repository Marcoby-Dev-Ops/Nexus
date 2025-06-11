export const HUBSPOT_CONFIG = {
  clientId: process.env.HUBSPOT_CLIENT_ID || '',
  clientSecret: process.env.HUBSPOT_CLIENT_SECRET || '',
  scopes: [
    'contacts',
    'crm.objects.contacts.read',
    'crm.objects.contacts.write',
    'crm.objects.deals.read',
    'crm.objects.deals.write',
    'crm.objects.companies.read',
    'crm.objects.companies.write',
    'crm.schemas.contacts.read',
    'crm.schemas.contacts.write',
    'crm.schemas.deals.read',
    'crm.schemas.deals.write',
    'crm.schemas.companies.read',
    'crm.schemas.companies.write',
    'crm.import',
    'files',
    'files.ui_hidden.read',
    'files.ui_hidden.write'
  ],
  redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/hubspot/callback`,
  authUrl: 'https://app.hubspot.com/oauth/authorize',
  tokenUrl: 'https://api.hubspot.com/oauth/v1/token',
  apiBaseUrl: 'https://api.hubapi.com',
  webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/hubspot/webhook`
}; 