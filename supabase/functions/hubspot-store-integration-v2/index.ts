import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration')
    }
    
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Authenticate the request
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      })
    }

    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwt)
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      })
    }

    // Parse request body
    const { userId, tokens, portalInfo } = await req.json()
    
    console.log('🔧 [HubSpot Store Integration V2] Received data:', {
      hasUserId: !!userId,
      hasTokens: !!tokens,
      hasPortalInfo: !!portalInfo,
      portalInfoKeys: portalInfo ? Object.keys(portalInfo) : [],
      tokensKeys: tokens ? Object.keys(tokens) : []
    })
    
    if (!userId || !tokens) {
      return new Response(JSON.stringify({ error: 'Missing required data' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    console.log('🔧 [HubSpot Store Integration V2] Storing integration for user:', userId)

    // Calculate expiration time
    const expiresAt = tokens.expires_in 
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null;

    // Store tokens in oauth_tokens table
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from('oauth_tokens')
      .upsert({
        user_id: userId,
        integration_slug: 'hubspot',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt,
        scope: tokens.scope,
        token_type: tokens.token_type || 'Bearer',
      }, {
        onConflict: 'user_id,integration_slug'
      })
      .select()

    if (tokenError) {
      console.error('Error storing OAuth tokens:', tokenError)
      return new Response(JSON.stringify({ error: 'Failed to store tokens' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      })
    }

    console.log('🔧 [HubSpot Store Integration V2] Tokens stored successfully')

    // Store the integration in user_integrations table
    // First, check if integration already exists
    const { data: existingIntegration } = await supabaseClient
      .from('user_integrations')
      .select('id')
      .eq('user_id', userId)
      .eq('integration_id', 'f71bb76b-3e42-44dc-aa80-1a6b8cdb74a4')
      .maybeSingle()

    const integrationData = {
      user_id: userId,
      integration_id: 'f71bb76b-3e42-44dc-aa80-1a6b8cdb74a4', // HubSpot CRM integration UUID
      integration_name: 'HubSpot',
      integration_type: 'oauth',
      status: 'active',
      settings: {
        enabled: true,
        auto_sync: true,
        sync_frequency: 'hourly',
        portal_id: portalInfo?.portalId || 'unknown',
        portal_timezone: portalInfo?.timeZone || 'UTC',
        redirect_uri: `${req.headers.get('origin')}/integrations/hubspot/callback`,
        scopes: tokens.scope?.split(' ') || [],
        connected_at: new Date().toISOString()
      },
      credentials: {
        oauth_connected: true,
        last_sync: new Date().toISOString()
      },
      metadata: {
        portal_info: portalInfo || {},
        token_type: tokens.token_type || 'bearer'
      }
    }

    let integrationError
    if (existingIntegration) {
      console.log('🔧 [HubSpot Store Integration V2] Updating existing integration')
      // Update existing integration
      const { error } = await supabaseClient
        .from('user_integrations')
        .update(integrationData)
        .eq('id', existingIntegration.id)
      integrationError = error
    } else {
      console.log('🔧 [HubSpot Store Integration V2] Creating new integration')
      // Insert new integration
      const { error } = await supabaseClient
        .from('user_integrations')
        .insert(integrationData)
      integrationError = error
    }

    if (integrationError) {
      console.error('Failed to store integration:', integrationError)
      return new Response(JSON.stringify({ error: 'Failed to store integration' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      })
    }

    console.log('🔧 [HubSpot Store Integration V2] Integration stored successfully for user:', userId)

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'HubSpot integration stored successfully' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('HubSpot store integration error:', error)
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
}) 