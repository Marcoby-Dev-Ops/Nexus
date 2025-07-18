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
export function getHubspotConfig() {
  const clientId = Deno.env.get('HUBSPOT_CLIENT_ID');
  const clientSecret = Deno.env.get('HUBSPOT_CLIENT_SECRET');
  const appUrl = Deno.env.get('NEXT_PUBLIC_APP_URL') || 'http://localhost:3000';

  if (!clientId || !clientSecret) {
    throw new Error('HubSpot Client ID or Secret is not configured in environment variables.');
  }

  return {
    clientId: clientId,
    clientSecret: clientSecret,
    redirectUri: `${appUrl}/functions/v1/hubspot-callback`,
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
      'files.ui_hidden.write',
      // Required for refresh tokens
      'oauth',
    ],
    authUrl: 'https://app.hubspot.com/oauth/authorize',
    tokenUrl: 'https://api.hubspot.com/oauth/v1/token',
    apiBaseUrl: 'https://api.hubapi.com',
  };
} 