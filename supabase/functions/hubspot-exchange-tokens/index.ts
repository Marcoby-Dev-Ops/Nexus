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
    const { code, redirectUri } = await req.json()
    
    if (!code || !redirectUri) {
      return new Response(JSON.stringify({ error: 'Missing required data' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    console.log('🔧 [HubSpot Exchange Tokens] Exchanging code for tokens')

    // Get HubSpot credentials from environment
    const clientId = Deno.env.get('HUBSPOT_CLIENT_ID')
    const clientSecret = Deno.env.get('HUBSPOT_CLIENT_SECRET')
    
    if (!clientId || !clientSecret) {
      return new Response(JSON.stringify({ error: 'HubSpot credentials not configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      })
    }

    // Exchange code for tokens with HubSpot
    const tokenResponse = await fetch('https://api.hubapi.com/oauth/v1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code
      })
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('HubSpot token exchange failed:', errorText)
      return new Response(JSON.stringify({ error: `Token exchange failed: ${tokenResponse.status}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    const tokens = await tokenResponse.json()
    console.log('🔧 [HubSpot Exchange Tokens] Token exchange successful')

    // Get HubSpot portal info
    const portalResponse = await fetch('https://api.hubapi.com/account-info/v3/details', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`
      }
    })

    let portalInfo = { portalId: 'unknown', timeZone: 'UTC' }
    if (portalResponse.ok) {
      portalInfo = await portalResponse.json()
    }

    console.log('🔧 [HubSpot Exchange Tokens] Portal info retrieved')

    return new Response(JSON.stringify({ 
      success: true,
      tokens,
      portalInfo
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('HubSpot exchange tokens error:', error)
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
}) 