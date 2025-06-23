import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';
import { corsHeaders } from './cors.ts';

interface OAuthRequest {
  code: string;
  state: string;
  error?: string;
  error_description?: string;
  userId?: string; // Optional - for validation but not required
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    // Get Microsoft Graph OAuth credentials
    const clientId = Deno.env.get('MICROSOFT_CLIENT_ID');
    const clientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET');
    
    if (!clientId || !clientSecret) {
      throw new Error('Microsoft OAuth credentials not configured');
    }

    const url = new URL(req.url);

    if (req.method === 'GET') {
      // Handle direct OAuth callback (fallback)
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const error = url.searchParams.get('error');
      const errorDescription = url.searchParams.get('error_description');

      if (error) {
        console.error('OAuth error:', error, errorDescription);
        return new Response(`
          <!DOCTYPE html>
          <html>
            <head><title>OAuth Error</title></head>
            <body>
              <h1>OAuth Error</h1>
              <p>Error: ${error}</p>
              <p>Description: ${errorDescription || 'Unknown error'}</p>
              <p><a href="${url.origin}/settings/integrations">Return to Integrations</a></p>
            </body>
          </html>
        `, {
          headers: { 'Content-Type': 'text/html' },
          status: 400
        });
      }

      if (!code || !state) {
        return new Response(`
          <!DOCTYPE html>
          <html>
            <head><title>OAuth Error</title></head>
            <body>
              <h1>OAuth Error</h1>
              <p>Missing authorization code or state parameter.</p>
              <p><a href="${url.origin}/settings/integrations">Return to Integrations</a></p>
            </body>
          </html>
        `, {
          headers: { 'Content-Type': 'text/html' },
          status: 400
        });
      }

      return handleOAuthCallback(supabaseUrl, supabaseServiceKey, clientId, clientSecret, code, state, url.origin);
    }

    if (req.method === 'POST') {
      const { code, state, error, error_description, userId } = await req.json() as OAuthRequest;

      console.log('POST request received:', { 
        hasCode: !!code, 
        hasState: !!state, 
        error, 
        userId,
        clientId: clientId ? 'Present' : 'Missing',
        clientSecret: clientSecret ? 'Present' : 'Missing'
      });

      if (error) {
        console.error('OAuth error:', error, error_description);
        return new Response(
          JSON.stringify({
            success: false,
            error: error_description || error
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        );
      }

      if (!code || !state) {
        console.error('Missing required parameters:', { code: !!code, state: !!state });
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Missing authorization code or state parameter'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        );
      }

      return handleOAuthCallbackJSON(supabaseUrl, supabaseServiceKey, clientId, clientSecret, code, state);
    }

    return new Response('Method not allowed', { status: 405, headers: corsHeaders });

  } catch (error) {
    console.error('Microsoft Graph OAuth error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

async function handleOAuthCallback(
  supabaseUrl: string,
  supabaseKey: string,
  clientId: string,
  clientSecret: string,
  code: string,
  state: string,
  baseUrl: string
) {
  try {
    const result = await processOAuthCallback(supabaseUrl, supabaseKey, clientId, clientSecret, code, state);
    
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head><title>Microsoft 365 Connected</title></head>
        <body>
          <h1>Microsoft 365 Successfully Connected!</h1>
          <p>Your Microsoft 365 account has been connected to Nexus.</p>
          <p><a href="${baseUrl}/settings/integrations">Return to Integrations</a></p>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' },
      status: 200
    });

  } catch (error) {
    console.error('OAuth callback error:', error);
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head><title>OAuth Error</title></head>
        <body>
          <h1>OAuth Error</h1>
          <p>Failed to connect Microsoft 365: ${error instanceof Error ? error.message : 'Unknown error'}</p>
          <p><a href="${baseUrl}/settings/integrations">Return to Integrations</a></p>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' },
      status: 400
    });
  }
}

async function handleOAuthCallbackJSON(
  supabaseUrl: string,
  supabaseKey: string,
  clientId: string,
  clientSecret: string,
  code: string,
  state: string
) {
  try {
    const result = await processOAuthCallback(supabaseUrl, supabaseKey, clientId, clientSecret, code, state);
    
    return new Response(
      JSON.stringify({
        success: true,
        data: result
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('OAuth callback error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
}

async function processOAuthCallback(
  supabaseUrl: string,
  supabaseKey: string,
  clientId: string,
  clientSecret: string,
  code: string,
  state: string
) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Parse state parameter - handle both pipe and hyphen formats for backward compatibility
  let userId: string;
  let timestamp: string;
  
  if (state.includes('|')) {
    // New pipe format: userId|timestamp|region
    [userId, timestamp] = state.split('|');
  } else {
    // Old hyphen format: userId-randomUUID (reconstruct UUID if needed)
    const parts = state.split('-');
    if (parts.length >= 5) {
      // Reconstruct UUID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      userId = `${parts[0]}-${parts[1]}-${parts[2]}-${parts[3]}-${parts.slice(4).join('-')}`;
    } else {
      userId = parts[0];
    }
    timestamp = Date.now().toString();
  }

  if (!userId) {
    throw new Error('Invalid state parameter: missing user ID');
  }

  // Validate timestamp (if provided) - reject if older than 10 minutes
  if (timestamp) {
    const stateTime = parseInt(timestamp);
    const now = Date.now();
    if (now - stateTime > 10 * 60 * 1000) {
      throw new Error('OAuth state has expired. Please try again.');
    }
  }

  // Exchange code for tokens
  const tokenResponse = await exchangeCodeForTokens(clientId, clientSecret, code);
  
  // Get user profile from Microsoft Graph
  const userProfile = await getMicrosoftUserProfile(tokenResponse.access_token);
  
  // Persist Microsoft 365 credentials in the organisation-scoped `ai_integrations` table
  // 1. Look up the organisation (company) linked to this user
  const { data: userProfileRow, error: userProfileErr } = await supabase
    .from('user_profiles')
    .select('company_id')
    .eq('id', userId)
    .single();

  if (userProfileErr || !userProfileRow) {
    console.error('Error fetching user profile for org lookup:', userProfileErr);
    throw new Error('Failed to determine organisation for OAuth integration');
  }

  const orgId = userProfileRow.company_id;

  const { error: aiIntegrationError } = await supabase
    .from('ai_integrations')
    .upsert({
      org_id: orgId,
      provider: 'microsoft',
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token,
      expires_at: new Date(Date.now() + (tokenResponse.expires_in * 1000)).toISOString(),
      metadata: {
        provider_user_id: userProfile.id,
        provider_email: userProfile.mail || userProfile.userPrincipalName,
        scopes: tokenResponse.scope.split(' '),
        user_display_name: userProfile.displayName
      },
      updated_at: new Date().toISOString()
    }, { onConflict: 'org_id,provider', ignoreDuplicates: false });

  if (aiIntegrationError) {
    console.error('Error saving ai_integration:', aiIntegrationError);
    throw new Error(`Failed to save integration: ${aiIntegrationError.message}`);
  }

  // Log successful integration (best-effort)
  try {
    await supabase.from('ai_audit_logs').insert({
      user_id: userId,
      action: 'microsoft_integration_connected',
      table_name: 'ai_integrations',
      record_id: `${orgId}:microsoft`,
      details: {
        provider_user_id: userProfile.id,
        provider_email: userProfile.mail || userProfile.userPrincipalName,
        scopes: tokenResponse.scope.split(' '),
        user_display_name: userProfile.displayName
      }
    });
  } catch (logErr) {
    console.error('Audit log insert failed (non-blocking):', logErr);
  }

  return {
    provider: 'microsoft',
    provider_user_id: userProfile.id,
    provider_email: userProfile.mail || userProfile.userPrincipalName,
    display_name: userProfile.displayName
  };
}

async function exchangeCodeForTokens(
  clientId: string,
  clientSecret: string,
  code: string
): Promise<TokenResponse> {
  const tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
  const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/microsoft-graph-oauth-callback`;

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code: code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  return response.json();
}

async function getMicrosoftUserProfile(accessToken: string) {
  const response = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Profile fetch failed: ${error}`);
  }

  return response.json();
} 