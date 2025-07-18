import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { 
      status: 405,
      headers: corsHeaders 
    });
  }

  try {
    const { code, codeVerifier } = await req.json();

    if (!code || !codeVerifier) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Missing code or codeVerifier' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const clientId = Deno.env.get('MICROSOFT_CLIENT_ID');
    const clientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET');
    const redirectUri = Deno.env.get('MICROSOFT_REDIRECT_URI');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!clientId || !clientSecret || !redirectUri || !supabaseUrl || !supabaseServiceKey) {
      console.error('Missing required environment variables');
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Server configuration error' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Exchange code for tokens
    const params = new URLSearchParams({
      client_id: clientId,
      scope: 'User.Read Organization.Read.All openid profile email offline_access',
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      code_verifier: codeVerifier,
      client_secret: clientSecret,
    });

    const tokenRes = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      console.error('Token exchange failed:', tokenData);
      return new Response(JSON.stringify({ 
        success: false,
        error: tokenData.error_description || 'Token exchange failed' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client with service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing or invalid authorization header'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({
        success: false,
        error: 'User not authenticated'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      });
    }

    // Calculate expiration time
    const expiresAt = tokenData.expires_in 
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null;

    // Store tokens securely in oauth_tokens table
    const { error: storeError } = await supabase
      .from('oauth_tokens')
      .upsert({
        user_id: user.id,
        integration_slug: 'microsoft',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt,
        scope: tokenData.scope,
        token_type: tokenData.token_type || 'Bearer',
      });

    if (storeError) {
      console.error('Error storing OAuth tokens:', storeError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to store OAuth tokens'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'OAuth tokens exchanged and stored successfully',
      data: {
        integration: 'microsoft',
        stored: true,
        user_id: user.id
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (err) {
    console.error('Error in Microsoft OAuth callback:', err);
    return new Response(JSON.stringify({ 
      success: false,
      error: err.message || 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
