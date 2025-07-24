import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers that work with credentials mode
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://nexus.marcoby.net',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
}

interface ApiRequest {
  action: 'get-oauth-tokens' | 'refresh-oauth-tokens' | 'list-integrations' | 'remove-integration'
  provider?: string
  integrationId?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Debug: Log all headers
    console.log('API Manager: Request headers:', Object.fromEntries(req.headers.entries()))

    // Get the user from the request
    const authHeader = req.headers.get('authorization')
    console.log('API Manager: Authorization header present:', !!authHeader)
    console.log('API Manager: Authorization header value:', authHeader ? authHeader.substring(0, 20) + '...' : 'null')
    
    if (!authHeader) {
      console.log('API Manager: No authorization header found')
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract the token from Bearer header
    const token = authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : authHeader
    console.log('API Manager: Extracted token length:', token.length)
    
    if (!token) {
      console.log('API Manager: No token found in authorization header')
      return new Response(
        JSON.stringify({ error: 'No token found in authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the user's JWT with better error handling
    console.log('API Manager: Attempting to verify JWT...')
    let user;
    let userError: any;
    
    try {
      const result = await supabaseAdmin.auth.getUser(token)
      user = result.data.user
      userError = result.error
    } catch (error) {
      console.log('API Manager: JWT verification threw exception:', error)
      userError = error
    }
    
    console.log('API Manager: JWT verification result:', { 
      hasUser: !!user, 
      userId: user?.id,
      error: userError?.message,
      errorCode: userError?.status
    })
    
    if (userError || !user) {
      console.log('API Manager: JWT verification failed:', userError?.message)
      
      // Provide more specific error messages
      let errorMessage = 'Invalid token'
      if (userError?.message?.includes('expired')) {
        errorMessage = 'Token expired'
      } else if (userError?.message?.includes('invalid')) {
        errorMessage = 'Invalid token format'
      } else if (userError?.status === 401) {
        errorMessage = 'Unauthorized - invalid token'
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('API Manager: User authenticated successfully:', user.id)

    // Parse request body
    const body: ApiRequest = await req.json()
    const { action, provider, integrationId } = body

    console.log('API Manager: Request body:', { action, provider, integrationId })

    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Action parameter required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    switch (action) {
      case 'get-oauth-tokens': {
        if (!provider) {
          return new Response(
            JSON.stringify({ error: 'Provider parameter required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log('API Manager: Fetching OAuth tokens for provider:', provider)

        const { data: tokens, error: tokenError } = await supabaseAdmin
          .from('oauth_tokens')
          .select('access_token, refresh_token, expires_at')
          .eq('user_id', user.id)
          .eq('integration_slug', provider)
          .single()

        console.log('API Manager: Token fetch result:', { 
          hasTokens: !!tokens, 
          error: tokenError?.message 
        })

        if (tokenError) {
          return new Response(
            JSON.stringify({ error: `Token fetch error: ${tokenError.message}` }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (!tokens) {
          return new Response(
            JSON.stringify({ error: `No ${provider} tokens found for user` }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Check if token is expired
        const now = new Date()
        const expiresAt = tokens.expires_at ? new Date(tokens.expires_at) : null

        if (expiresAt && now >= expiresAt) {
          return new Response(
            JSON.stringify({ error: `${provider} token is expired` }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log('API Manager: Successfully returning tokens for provider:', provider)
        return new Response(
          JSON.stringify({ data: tokens }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'refresh-oauth-tokens': {
        if (!provider) {
          return new Response(
            JSON.stringify({ error: 'Provider parameter required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Get current tokens
        const { data: currentTokens, error: fetchError } = await supabaseAdmin
          .from('oauth_tokens')
          .select('refresh_token')
          .eq('user_id', user.id)
          .eq('integration_slug', provider)
          .single()

        if (fetchError || !currentTokens?.refresh_token) {
          return new Response(
            JSON.stringify({ error: 'No refresh token found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // For SPA applications, token refresh must happen in the browser
        // Server-side refresh is not supported for Single-Page Application client types
        return new Response(
          JSON.stringify({ 
            error: `Token refresh requires re-authentication for ${provider}. Please reconnect your account.`,
            requiresReauth: true
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

        // For other providers, return error indicating manual re-authentication needed
        return new Response(
          JSON.stringify({ error: `Token refresh not implemented for ${provider}. Please re-authenticate.` }),
          { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'list-integrations': {
        const { data: integrations, error: integrationError } = await supabaseAdmin
          .from('user_integrations')
          .select(`
            id,
            integration_name,
            integration_type,
            created_at,
            oauth_tokens!inner(integration_slug)
          `)
          .eq('user_id', user.id)

        if (integrationError) {
          return new Response(
            JSON.stringify({ error: `Integration fetch error: ${integrationError.message}` }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ data: integrations }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'remove-integration': {
        if (!integrationId) {
          return new Response(
            JSON.stringify({ error: 'Integration ID parameter required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Get integration details first
        const { data: integration, error: fetchError } = await supabaseAdmin
          .from('user_integrations')
          .select('integration_name')
          .eq('id', integrationId)
          .eq('user_id', user.id)
          .single()

        if (fetchError || !integration) {
          return new Response(
            JSON.stringify({ error: 'Integration not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Delete OAuth tokens first (foreign key constraint)
        const { error: tokenDeleteError } = await supabaseAdmin
          .from('oauth_tokens')
          .delete()
          .eq('user_id', user.id)
          .eq('integration_slug', integration.integration_name.toLowerCase().replace(/\s+/g, '-'))

        if (tokenDeleteError) {
          return new Response(
            JSON.stringify({ error: `Token deletion error: ${tokenDeleteError.message}` }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Delete user integration
        const { error: integrationDeleteError } = await supabaseAdmin
          .from('user_integrations')
          .delete()
          .eq('id', integrationId)
          .eq('user_id', user.id)

        if (integrationDeleteError) {
          return new Response(
            JSON.stringify({ error: `Integration deletion error: ${integrationDeleteError.message}` }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ message: 'Integration removed successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    return new Response(
      JSON.stringify({ error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 