import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const {
  PAYPAL_CLIENT_ID,
  PAYPAL_CLIENT_SECRET,
  PAYPAL_ENV = 'sandbox',
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
} = Deno.env.toObject();

// Log environment variables for debugging (without exposing secrets)
console.log('PayPal OAuth Callback - Environment Check:', {
  hasPayPalClientId: !!PAYPAL_CLIENT_ID,
  hasPayPalClientSecret: !!PAYPAL_CLIENT_SECRET,
  paypalEnv: PAYPAL_ENV,
  hasSupabaseUrl: !!SUPABASE_URL,
  hasServiceRoleKey: !!SUPABASE_SERVICE_ROLE_KEY,
});

if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
  throw new Error('Missing PayPal credentials - check PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET');
}
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase admin env vars - check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

const PP_BASE = PAYPAL_ENV === 'live' ? 'https://api.paypal.com' : 'https://api.sandbox.paypal.com';

interface PayPalTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type?: string;
  scope?: string;
}

async function exchangeCodeForTokens(code: string): Promise<PayPalTokenResponse> {
  console.log('Exchanging authorization code for tokens...');
  
  const tokenUrl = `${PP_BASE}/v1/oauth2/token`;
  const body = `grant_type=authorization_code&code=${encodeURIComponent(code)}`;
  
  console.log('Token exchange request:', {
    url: tokenUrl,
    hasCode: !!code,
    paypalEnv: PAYPAL_ENV
  });

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body,
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error('PayPal token exchange failed:', {
      status: res.status,
      statusText: res.statusText,
      error: errorText
    });
    throw new Error(`PayPal token error ${res.status}: ${errorText}`);
  }
  
  const tokenData = await res.json();
  console.log('Token exchange successful:', {
    hasAccessToken: !!tokenData.access_token,
    hasRefreshToken: !!tokenData.refresh_token,
    expiresIn: tokenData.expires_in
  });
  
  return tokenData;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('PayPal OAuth callback received');
    
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const oauthError = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    console.log('OAuth callback parameters:', {
      hasCode: !!code,
      hasState: !!state,
      hasError: !!oauthError,
      errorDescription
    });

    // Handle OAuth errors
    if (oauthError) {
      console.error('PayPal OAuth error:', { error: oauthError, errorDescription });
      const errorHtml = `
        <html>
          <body>
            <h2>PayPal OAuth Error</h2>
            <p><strong>Error:</strong> ${oauthError}</p>
            <p><strong>Description:</strong> ${errorDescription || 'No description provided'}</p>
            <script>window.close();</script>
          </body>
        </html>
      `;
      return new Response(errorHtml, {
        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
        status: 400,
      });
    }

    if (!code || !state) {
      throw new Error('Missing code or state parameter');
    }

    // Parse state to get user ID and timestamp
    const [userId, _timestamp] = state.split('-');
    
    if (!userId) {
      throw new Error('Invalid state parameter - missing user ID');
    }

    console.log('Processing OAuth for user:', userId);

    const tokenResp = await exchangeCodeForTokens(code);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const expiresAt = new Date(Date.now() + tokenResp.expires_in * 1000).toISOString();

    // Get PayPal integration ID
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('id')
      .eq('slug', 'paypal')
      .single();

    if (integrationError || !integration) {
      console.error('PayPal integration not found:', integrationError);
      throw new Error('PayPal integration not found in database');
    }

    console.log('Storing user integration for user:', userId);

    // Store integration in user_integrations table
    const { error: upsertError } = await supabase
      .from('user_integrations')
      .upsert({
        user_id: userId,
        integration_id: integration.id,
        integration_type: 'paypal',
        integration_name: 'PayPal',
        status: 'active',
        credentials: {
          access_token: tokenResp.access_token,
          refresh_token: tokenResp.refresh_token,
          expires_at: expiresAt,
          token_type: tokenResp.token_type || 'Bearer',
          scope: tokenResp.scope,
        },
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,integration_id'
      });
      
    if (upsertError) {
      console.error('Failed to store user integration:', upsertError);
      throw upsertError;
    }

    console.log('PayPal integration stored successfully for user:', userId);

    const successHtml = `
      <html>
        <body>
          <h2>✅ PayPal Connected Successfully!</h2>
          <p>Your PayPal account has been connected to Nexus.</p>
          <p>You can close this window and return to the app.</p>
          <script>
            // Close popup and notify parent
            if (window.opener) {
              window.opener.postMessage({ type: 'paypal_oauth_success' }, '*');
            }
            setTimeout(() => window.close(), 2000);
          </script>
        </body>
      </html>
    `;
    
    return new Response(successHtml, {
      headers: { ...corsHeaders, 'Content-Type': 'text/html' },
      status: 200,
    });
  } catch (err: unknown) {
    console.error('[paypal_oauth_callback] error:', err);
    
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    
    const errorHtml = `
      <html>
        <body>
          <h2>❌ PayPal Connection Failed</h2>
          <p><strong>Error:</strong> ${errorMessage}</p>
          <p>Please try again or contact support if the problem persists.</p>
          <script>
            // Close popup and notify parent
            if (window.opener) {
              window.opener.postMessage({ type: 'paypal_oauth_error', error: '${errorMessage}' }, '*');
            }
            setTimeout(() => window.close(), 3000);
          </script>
        </body>
      </html>
    `;
    
    return new Response(errorHtml, {
      headers: { ...corsHeaders, 'Content-Type': 'text/html' },
      status: 400,
    });
  }
}); 