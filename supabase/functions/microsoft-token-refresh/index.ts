import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TokenRefreshRequest {
  refresh_token: string;
  user_id: string;
}

interface TokenRefreshResponse {
  success: boolean;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
}

/**
 * Refresh Microsoft 365 OAuth tokens
 */
async function refreshMicrosoftTokens(refreshToken: string): Promise<TokenRefreshResponse> {
  try {
    const clientId = Deno.env.get('MICROSOFT_CLIENT_ID');
    if (!clientId) {
      throw new Error('Microsoft client ID not configured');
    }

    const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
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

    const tokenData = await response.json();
    return {
      success: true,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
    };
  } catch (error) {
    console.error('Microsoft token refresh error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update tokens in the database
 */
async function updateTokensInDatabase(
  supabase: any,
  userId: string,
  tokenData: TokenRefreshResponse
): Promise<boolean> {
  try {
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null;

    const { error } = await supabase
      .from('oauth_tokens')
      .upsert({
        user_id: userId,
        integration_slug: 'microsoft',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt,
        token_type: 'Bearer',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,integration_slug'
      });

    if (error) {
      console.error('Error updating tokens in database:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating tokens:', error);
    return false;
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    // Parse request body
    const { refresh_token, user_id }: TokenRefreshRequest = await req.json();

    if (!refresh_token || !user_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing refresh_token or user_id'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Refresh the tokens
    const refreshResult = await refreshMicrosoftTokens(refresh_token);

    if (!refreshResult.success) {
      return new Response(JSON.stringify({
        success: false,
        error: refreshResult.error
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update tokens in database
    const updateSuccess = await updateTokensInDatabase(supabase, user_id, refreshResult);

    if (!updateSuccess) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to update tokens in database'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Tokens refreshed successfully',
      data: {
        access_token: refreshResult.access_token,
        expires_in: refreshResult.expires_in,
        updated_at: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('Error in Microsoft token refresh:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 