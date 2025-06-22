import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { getHubspotConfig } from '@/lib/hubspot-config'

async function exchangeCodeForTokens(code: string) {
  const config = getHubspotConfig();
  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      code: code,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('HubSpot token exchange failed:', errorBody);
    throw new Error('Failed to exchange HubSpot code for tokens');
  }

  const tokens = await response.json();
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresIn: tokens.expires_in,
  };
}

async function saveTokens(supabase: SupabaseClient, companyId: string, accessToken: string, refreshToken: string, expiresIn: number) {
  // Store tokens in Vault
  const { data: accessTokenData, error: accessTokenError } = await supabase.vault.secrets.create({ name: `hubspot-access-token-${companyId}`, secret: accessToken });
  if (accessTokenError) throw accessTokenError;

  const { data: refreshTokenData, error: refreshTokenError } = await supabase.vault.secrets.create({ name: `hubspot-refresh-token-${companyId}`, secret: refreshToken });
  if (refreshTokenError) throw refreshTokenError;

  // Save references in the database table
  const expires_at = new Date(Date.now() + expiresIn * 1000).toISOString();
  const { error: dbError } = await supabase.from('ai_integrations_oauth').upsert({
    company_id: companyId,
    provider: 'hubspot',
    access_token_vault_id: accessTokenData.id,
    refresh_token_vault_id: refreshTokenData.id,
    expires_at: expires_at,
    status: 'active',
  }, { onConflict: 'company_id,provider' });

  if (dbError) throw dbError;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return new Response('Missing authorization code', { status: 400 });
  }

  try {
    const { accessToken, refreshToken, expiresIn } = await exchangeCodeForTokens(code);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("User not found");
    
    // Read the company_id from the custom claim in the user's JWT
    const companyId = user.app_metadata.company_id;
    if (!companyId) throw new Error("Company ID not found in user token. Please re-login.");
    
    await saveTokens(supabase, companyId, accessToken, refreshToken, expiresIn);

    // Redirect user back to the app's integration settings page
    const appUrl = getHubspotConfig().redirectUri.split('/api/')[0];
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${appUrl}/settings/integrations?success=true`,
      },
    });

  } catch (error) {
    console.error('HubSpot OAuth callback error:', error);
    return new Response('An error occurred during HubSpot authentication.', { status: 500 });
  }
}) 