import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')

    // Handle OAuth error
    if (error) {
      console.error('HubSpot OAuth error:', error)
      return Response.redirect(`${Deno.env.get('NEXT_PUBLIC_APP_URL')}/integrations?error=hubspot_auth_failed`)
    }

    if (!code || !state) {
      return Response.redirect(`${Deno.env.get('NEXT_PUBLIC_APP_URL')}/integrations?error=missing_code`)
    }

    // Verify state parameter
    try {
      const stateData = JSON.parse(atob(state))
      if (stateData.service !== 'hubspot') {
        throw new Error('Invalid state parameter')
      }
    } catch (e) {
      return Response.redirect(`${Deno.env.get('NEXT_PUBLIC_APP_URL')}/integrations?error=invalid_state`)
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://api.hubapi.com/oauth/v1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: Deno.env.get('HUBSPOT_CLIENT_ID')!,
        client_secret: Deno.env.get('HUBSPOT_CLIENT_SECRET')!,
        redirect_uri: `${Deno.env.get('NEXT_PUBLIC_APP_URL')}/integrations/hubspot/callback`,
        code
      })
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token exchange failed:', errorText)
      return Response.redirect(`${Deno.env.get('NEXT_PUBLIC_APP_URL')}/integrations?error=token_exchange_failed`)
    }

    const tokens = await tokenResponse.json()

    // Get portal info
    const portalResponse = await fetch('https://api.hubapi.com/account-info/v3/details', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`
      }
    })

    let portalInfo = { portalId: 'unknown', timeZone: 'UTC' }
    if (portalResponse.ok) {
      portalInfo = await portalResponse.json()
    }

    // Get user session from Authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return Response.redirect(`${Deno.env.get('NEXT_PUBLIC_APP_URL')}/integrations?error=unauthorized`)
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user from session
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      return Response.redirect(`${Deno.env.get('NEXT_PUBLIC_APP_URL')}/integrations?error=user_not_found`)
    }

    // Store the integration
    const { error: integrationError } = await supabaseClient
      .from('user_integrations')
      .upsert({
        user_id: user.id,
        integration_slug: 'hubspot',
        status: 'active',
        credentials: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: Date.now() + (tokens.expires_in * 1000),
          client_id: Deno.env.get('HUBSPOT_CLIENT_ID')
        },
        config: {
          portal_id: portalInfo.portalId,
          portal_timezone: portalInfo.timeZone,
          redirect_uri: `${Deno.env.get('NEXT_PUBLIC_APP_URL')}/integrations/hubspot/callback`,
          scopes: tokens.scope?.split(' ') || [],
          connected_at: new Date().toISOString()
        },
        metadata: {
          portal_info: portalInfo,
          token_type: tokens.token_type || 'bearer'
        }
      }, {
        onConflict: 'user_id,integration_slug'
      })

    if (integrationError) {
      console.error('Failed to store integration:', integrationError)
      return Response.redirect(`${Deno.env.get('NEXT_PUBLIC_APP_URL')}/integrations?error=storage_failed`)
    }

    // Redirect to success page
    return Response.redirect(`${Deno.env.get('NEXT_PUBLIC_APP_URL')}/integrations?success=hubspot_connected`)

  } catch (error) {
    console.error('HubSpot callback error:', error)
    return Response.redirect(`${Deno.env.get('NEXT_PUBLIC_APP_URL')}/integrations?error=callback_failed`)
  }
}) 