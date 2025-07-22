import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)

    // Get user ID from request
    const { userId } = await req.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`🔧 [HubSpot Test] Testing for user: ${userId}`)

    // Get HubSpot tokens for the user
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from('oauth_tokens')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', userId)
      .eq('integration_slug', 'hubspot')
      .single()

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ error: 'HubSpot integration not found or tokens not available' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`🔧 [HubSpot Test] Found token, expires at: ${tokenData.expires_at}`)

    // Test the access token
    const accessToken = tokenData.access_token
    
    console.log('🔧 [HubSpot Test] Testing contacts API...')
    const contactsResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=1', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })
    
    console.log(`🔧 [HubSpot Test] Contacts API response: ${contactsResponse.status}`)
    
    if (!contactsResponse.ok) {
      const errorText = await contactsResponse.text()
      console.error('🔧 [HubSpot Test] Contacts API error:', errorText)
      return new Response(
        JSON.stringify({ 
          error: `Contacts API failed: ${contactsResponse.status}`,
          details: errorText
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const contactsData = await contactsResponse.json()
    console.log(`🔧 [HubSpot Test] Contacts data:`, contactsData)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'HubSpot API test successful',
        contactsCount: contactsData.results?.length || 0,
        status: contactsResponse.status
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('HubSpot test error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to test HubSpot API' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 