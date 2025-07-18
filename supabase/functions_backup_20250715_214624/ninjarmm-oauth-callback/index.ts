import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

// NinjaRMM region-specific base URLs
const REGION_URLS = {
  'us': 'https://app.ninjarmm.com',
  'eu': 'https://eu.ninjarmm.com',
  'oc': 'https://oc.ninjarmm.com',
  'ca': 'https://ca.ninjarmm.com'
}

interface NinjaRmmTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string
  scope: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    let code, state, error, region, userId;
    
    if (req.method === 'POST') {
      // Handle POST request from client with JSON body
      const body = await req.json()
      code = body.code
      state = body.state
      region = body.region
      userId = body.userId
    } else {
      // Handle GET request (direct OAuth callback)
      const url = new URL(req.url)
      code = url.searchParams.get('code')
      state = url.searchParams.get('state')
      error = url.searchParams.get('error')
    }

    if (error) {
      console.error('NinjaRMM OAuth error:', error)
      return new Response(
        `<!DOCTYPE html>
        <html>
          <head><title>NinjaRMM Connection Failed</title></head>
          <body style="font-family: system-ui; padding: 40px; text-align: center;">
            <h1>Connection Failed</h1>
            <p>Failed to connect to NinjaRMM: ${error}</p>
            <p><a href="/integrations">Return to Integrations</a></p>
            <script>setTimeout(() => window.close(), 3000);</script>
          </body>
        </html>`,
        { headers: { 'Content-Type': 'text/html' } }
      )
    }

    if (!code || !state) {
      throw new Error('Missing authorization code or state parameter')
    }

    // Parse state to get user ID and region if not provided in POST body
    if (!userId || !region) {
      let parsedUserId, timestamp, parsedRegion;
      
      if (state.includes('|')) {
        // New format: userId|timestamp|region
        const stateParts = state.split('|');
        parsedUserId = stateParts[0];
        timestamp = stateParts[1];
        parsedRegion = stateParts.length >= 3 ? stateParts[2] : 'us';
      } else {
        // Old format with hyphens - need to be more careful with UUID parsing
        const stateParts = state.split('-');
        
        if (stateParts.length >= 6) {
          // UUID format: 8-4-4-4-12 + timestamp + optional region
          const uuidParts = stateParts.slice(0, 5);
          parsedUserId = uuidParts.join('-');
          timestamp = stateParts[5];
          parsedRegion = stateParts.length > 6 ? stateParts[6] : 'us';
        } else {
          // Fallback: treat as old format
          parsedUserId = stateParts[0];
          timestamp = stateParts[1];
          parsedRegion = stateParts.length >= 3 ? stateParts[2] : 'us';
        }
      }
      
      userId = userId || parsedUserId;
      region = region || parsedRegion;
    }
    
    if (!userId) {
      throw new Error('Invalid state parameter - could not extract user ID')
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Exchange authorization code for access token
    const baseUrl = REGION_URLS[region as keyof typeof REGION_URLS] || REGION_URLS.us
    const clientId = Deno.env.get('NINJARMM_CLIENT_ID')
    const clientSecret = Deno.env.get('NINJARMM_CLIENT_SECRET')
    const redirectUri = `${new URL(req.url).origin}/functions/v1/ninjarmm-oauth-callback`

    if (!clientId || !clientSecret) {
      throw new Error('NinjaRMM client credentials not configured')
    }

    const tokenResponse = await fetch(`${baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code: code,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token exchange failed:', errorText)
      throw new Error(`Token exchange failed: ${tokenResponse.status}`)
    }

    const tokenData: NinjaRmmTokenResponse = await tokenResponse.json()

    // Get NinjaRMM integration ID
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('id')
      .eq('slug', 'ninjarmm')
      .single()

    if (integrationError || !integration) {
      throw new Error('NinjaRMM integration not found in database')
    }

    // Store integration in database
    const { error: upsertError } = await supabase
      .from('user_integrations')
      .upsert({
        user_id: userId,
        integration_id: integration.id,
        config: {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
          scope: tokenData.scope,
          region: region,
          token_type: tokenData.token_type,
        },
        status: 'active',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,integration_id'
      })

    if (upsertError) {
      console.error('Failed to store integration:', upsertError)
      throw new Error('Failed to store integration')
    }

    // Return appropriate response based on request method
    if (req.method === 'POST') {
      // Return JSON response for client requests
      return new Response(
        JSON.stringify({ success: true, message: 'NinjaRMM connected successfully' }),
        { 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      )
    } else {
      // Return HTML page for direct OAuth callbacks
      return new Response(
        `<!DOCTYPE html>
        <html>
          <head><title>NinjaRMM Connected</title></head>
          <body style="font-family: system-ui; padding: 40px; text-align: center;">
            <h1>✅ NinjaRMM Connected Successfully!</h1>
            <p>Your NinjaRMM account has been connected to Nexus.</p>
            <p>You can now close this window and return to the integrations page.</p>
            <script>
              setTimeout(() => {
                if (window.opener) {
                  window.opener.location.reload();
                }
                window.close();
              }, 2000);
            </script>
          </body>
        </html>`,
        { 
          headers: { 
            'Content-Type': 'text/html',
            ...corsHeaders 
          } 
        }
      )
    }

  } catch (error) {
    console.error('NinjaRMM OAuth callback error:', error)
    
    if (req.method === 'POST') {
      // Return JSON error for client requests
      return new Response(
        JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      )
    } else {
      // Return HTML error page for direct OAuth callbacks
      return new Response(
        `<!DOCTYPE html>
        <html>
          <head><title>NinjaRMM Connection Error</title></head>
          <body style="font-family: system-ui; padding: 40px; text-align: center;">
            <h1>❌ Connection Failed</h1>
            <p>Failed to connect NinjaRMM: ${error.message}</p>
            <p><a href="/integrations">Return to Integrations</a></p>
            <script>setTimeout(() => window.close(), 5000);</script>
          </body>
        </html>`,
        { 
          headers: { 
            'Content-Type': 'text/html',
            ...corsHeaders 
          } 
        }
      )
    }
  }
}) 