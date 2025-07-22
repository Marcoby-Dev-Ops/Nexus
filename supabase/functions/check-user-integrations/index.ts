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
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { userId, action } = await req.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`🔍 [check-user-integrations] Processing request for user: ${userId}, action: ${action}`)

    switch (action) {
      case 'check':
        return await checkUserIntegrations(supabase, userId)
      case 'add-hubspot':
        return await addHubSpotIntegration(supabase, userId)
      case 'list-all':
        return await listAllIntegrations(supabase, userId)
      case 'clear':
        return await clearUserIntegrations(supabase, userId)
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Use: check, add-hubspot, list-all, clear' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }

  } catch (error) {
    console.error('❌ [check-user-integrations] Error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function checkUserIntegrations(supabase: any, userId: string) {
  console.log(`🔍 [checkUserIntegrations] Checking integrations for user: ${userId}`)
  
  try {
    // Get user integrations
    const { data: userIntegrations, error: userError } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', userId)

    if (userError) {
      console.error('❌ [checkUserIntegrations] Database error:', userError)
      throw userError
    }

    // Get integration definitions
    const { data: integrationDefs, error: defError } = await supabase
      .from('integrations')
      .select('*')

    if (defError) {
      console.error('❌ [checkUserIntegrations] Integration definitions error:', defError)
      throw defError
    }

    console.log(`✅ [checkUserIntegrations] Found ${userIntegrations?.length || 0} integrations for user`)

    return new Response(
      JSON.stringify({
        success: true,
        userId,
        integrations: userIntegrations || [],
        integrationDefinitions: integrationDefs || [],
        count: userIntegrations?.length || 0,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ [checkUserIntegrations] Error:', error)
    throw error
  }
}

async function addHubSpotIntegration(supabase: any, userId: string) {
  console.log(`🔧 [addHubSpotIntegration] Adding HubSpot integration for user: ${userId}`)
  
  // Get app URL from environment
  const appUrl = Deno.env.get('NEXT_PUBLIC_APP_URL') || 'https://nexus.marcoby.com'
  
  try {
    // Check if HubSpot integration already exists
    const { data: existingIntegration, error: checkError } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('integration_name', 'HubSpot')
      .maybeSingle()

    if (checkError) {
      console.error('❌ [addHubSpotIntegration] Check error:', checkError)
      throw checkError
    }

    if (existingIntegration) {
      console.log(`ℹ️ [addHubSpotIntegration] HubSpot integration already exists for user`)
      return new Response(
        JSON.stringify({
          success: true,
          message: 'HubSpot integration already exists',
          integration: existingIntegration
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Calculate expiration time (24 hours from now)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    // Store tokens in oauth_tokens table (like Microsoft 365)
    const { data: tokenData, error: tokenError } = await supabase
      .from('oauth_tokens')
      .upsert({
        user_id: userId,
        integration_slug: 'hubspot',
        access_token: 'mock_access_token', // Will be replaced by real OAuth flow
        refresh_token: 'mock_refresh_token', // Will be replaced by real OAuth flow
        expires_at: expiresAt,
        scope: 'oauth crm.lists.read crm.objects.companies.read crm.objects.contacts.read crm.objects.deals.read',
        token_type: 'Bearer',
      }, {
        onConflict: 'user_id,integration_slug'
      })
      .select()

    if (tokenError) {
      console.error('❌ [addHubSpotIntegration] Token storage error:', tokenError)
      throw tokenError
    }

    // Add HubSpot integration to user_integrations table
    const hubspotIntegration = {
      user_id: userId,
              integration_id: 'f71bb76b-3e42-44dc-aa80-1a6b8cdb74a4', // HubSpot UUID
      integration_name: 'HubSpot',
      integration_type: 'oauth',
      status: 'active',
      settings: {
        enabled: true,
        auto_sync: true,
        sync_frequency: 'hourly',
        portal_id: 'mock_portal_id',
        portal_timezone: 'UTC',
                          redirect_uri: `${appUrl}/integrations/hubspot/callback`,
        features_enabled: ['contacts', 'deals', 'companies', 'marketing', 'analytics'],
        setup_completed_at: new Date().toISOString(),
        capabilities: [
          'CRM Data Sync',
          'Sales Pipeline Tracking',
          'Marketing Analytics',
          'Lead Management',
          'Contact Management',
          'Deal Tracking',
          'Revenue Analytics'
        ]
      },
      credentials: {
        oauth_connected: true,
        last_sync: new Date().toISOString()
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: newIntegration, error: insertError } = await supabase
      .from('user_integrations')
      .insert(hubspotIntegration)
      .select()
      .single()

    if (insertError) {
      console.error('❌ [addHubSpotIntegration] Insert error:', insertError)
      throw insertError
    }

    console.log(`✅ [addHubSpotIntegration] Successfully added HubSpot integration`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'HubSpot integration added successfully (both oauth_tokens and user_integrations)',
        integration: newIntegration,
        tokens: tokenData
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ [addHubSpotIntegration] Error:', error)
    throw error
  }
}

async function listAllIntegrations(supabase: any, userId: string) {
  console.log(`📋 [listAllIntegrations] Listing all integrations for user: ${userId}`)
  
  try {
    const { data, error } = await supabase
      .from('user_integrations')
      .select(`
        *,
        integrations (
          id,
          name,
          slug,
          description,
          category
        )
      `)
      .eq('user_id', userId)

    if (error) {
      console.error('❌ [listAllIntegrations] Database error:', error)
      throw error
    }

    console.log(`✅ [listAllIntegrations] Found ${data?.length || 0} integrations`)

    return new Response(
      JSON.stringify({
        success: true,
        userId,
        integrations: data || [],
        count: data?.length || 0,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ [listAllIntegrations] Error:', error)
    throw error
  }
}

async function clearUserIntegrations(supabase: any, userId: string) {
  console.log(`🗑️ [clearUserIntegrations] Clearing integrations for user: ${userId}`)
  
  try {
    const { error } = await supabase
      .from('user_integrations')
      .delete()
      .eq('user_id', userId)

    if (error) {
      console.error('❌ [clearUserIntegrations] Delete error:', error)
      throw error
    }

    console.log(`✅ [clearUserIntegrations] Successfully cleared integrations`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'User integrations cleared successfully',
        userId
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ [clearUserIntegrations] Error:', error)
    throw error
  }
} 