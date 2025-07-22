import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to refresh Microsoft tokens (public client)
async function refreshMicrosoftToken(refreshToken: string, clientId: string) {
  const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Token refresh failed: ${errorData.error_description || 'Unknown error'}`);
  }
  
  return response.json();
}

// Helper function to log Microsoft activity
async function logMicrosoftActivity(supabase: any, userId: string, action: string, details: any) {
  try {
    await supabase.from('audit_logs').insert({
      user_id: userId,
      integration: 'microsoft',
      action,
      details,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to log Microsoft activity:', error);
    // Don't fail the main operation if logging fails
  }
}

// Helper function to validate environment variables
function validateEnvironment() {
  const required = ['MICROSOFT_CLIENT_ID', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  const missing = required.filter(key => !Deno.env.get(key));
  
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
}

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
    // Validate environment
    validateEnvironment();

    const { access_token, refresh_token, expires_in, scope, token_type } = await req.json();

    if (!access_token || !refresh_token) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Missing access_token or refresh_token' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const clientId = Deno.env.get('MICROSOFT_CLIENT_ID')!;
    const redirectUri = Deno.env.get('MICROSOFT_REDIRECT_URI') || 'http://localhost:5173/integrations/microsoft/callback';
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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

    console.log('User authentication result:', { user: user?.id, error: userError });

    if (userError || !user) {
      console.error('User authentication failed:', userError);
      return new Response(JSON.stringify({
        success: false,
        error: 'User not authenticated'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      });
    }



    // Log OAuth initiation
    await logMicrosoftActivity(supabase, user.id, 'oauth_initiated', { 
      timestamp: new Date().toISOString() 
    });

    // Calculate expiration time
    const expiresAt = expires_in 
      ? new Date(Date.now() + expires_in * 1000).toISOString()
      : null;

    // Store tokens securely in oauth_tokens table
    console.log('Attempting to store tokens for user:', user.id);
    
    const { data: storeData, error: storeError } = await supabase
      .from('oauth_tokens')
      .upsert({
        user_id: user.id,
        integration_slug: 'microsoft',
        access_token: access_token,
        refresh_token: refresh_token,
        expires_at: expiresAt,
        scope: scope,
        token_type: token_type || 'Bearer',
      }, {
        onConflict: 'user_id,integration_slug'
      })
      .select();

    console.log('Token storage result:', { data: storeData, error: storeError });

    if (storeError) {
      console.error('Error storing OAuth tokens:', storeError);
      
      // Log token storage failure
      await logMicrosoftActivity(supabase, user.id, 'token_storage_failed', { 
        error: storeError.message,
        timestamp: new Date().toISOString()
      });
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to store OAuth tokens',
        details: storeError
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }

    // Create user integration record
    const { error: integrationError } = await supabase
      .from('user_integrations')
      .upsert({
        user_id: user.id,
        integration_id: '43a2f5ac-8f6f-4b70-bad7-d2effb52e7fc', // Microsoft 365 integration ID
        integration_type: 'oauth',
        integration_name: 'Microsoft 365',
        status: 'active',
        settings: {
          enabled: true,
          auto_sync: true,
          sync_frequency: 'hourly'
        },
        credentials: {
          oauth_connected: true,
          last_sync: new Date().toISOString()
        }
      });

    if (integrationError) {
      console.error('Error creating user integration:', integrationError);
      // Don't fail the entire request if integration creation fails
      // The tokens are already stored, so we can still return success
    }

    // Log successful OAuth completion
    await logMicrosoftActivity(supabase, user.id, 'oauth_completed', { 
      timestamp: new Date().toISOString(),
      scopes: scope,
      expires_at: expiresAt
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'OAuth tokens exchanged and stored successfully',
      data: {
        integration: 'microsoft',
        stored: true,
        user_id: user.id,
        expires_at: expiresAt
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (err) {
    console.error('Error in Microsoft OAuth callback:', err);
    return new Response(JSON.stringify({ 
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
