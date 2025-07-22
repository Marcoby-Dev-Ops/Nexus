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

    console.log(`🔧 [HubSpot Sync] Starting sync for user: ${userId}`)

    // Get HubSpot tokens for the user
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from('oauth_tokens')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', userId)
      .eq('integration_slug', 'hubspot')
      .single()

    console.log(`🔧 [HubSpot Sync] Token lookup result:`, { 
      hasTokenData: !!tokenData, 
      hasTokenError: !!tokenError,
      tokenError: tokenError?.message 
    })

    if (tokenError || !tokenData) {
      console.error('🔧 [HubSpot Sync] Token error:', tokenError)
      return new Response(
        JSON.stringify({ error: 'HubSpot integration not found or tokens not available' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`🔧 [HubSpot Sync] Found token for user, expires at: ${tokenData.expires_at}`)

    // Check if token is expired and refresh if needed
    let accessToken = tokenData.access_token
    if (tokenData.expires_at && new Date(tokenData.expires_at) <= new Date()) {
      console.log('🔧 [HubSpot Sync] Token expired, refreshing...')
      
      const refreshResponse = await fetch('https://api.hubapi.com/oauth/v1/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: Deno.env.get('HUBSPOT_CLIENT_ID')!,
          client_secret: Deno.env.get('HUBSPOT_CLIENT_SECRET')!,
          refresh_token: tokenData.refresh_token,
        }),
      })

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json()
        accessToken = refreshData.access_token

        // Update tokens in database
        await supabaseClient
          .from('oauth_tokens')
          .update({
            access_token: refreshData.access_token,
            refresh_token: refreshData.refresh_token || tokenData.refresh_token,
            expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
          })
          .eq('user_id', userId)
          .eq('integration_slug', 'hubspot')
        
        console.log('🔧 [HubSpot Sync] Token refreshed successfully')
      }
    }

    // Test the access token with a simple API call
    console.log('🔧 [HubSpot Sync] Testing access token...')
    const testResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=1', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })
    
    console.log(`🔧 [HubSpot Sync] Test API response: ${testResponse.status}`)
    if (!testResponse.ok) {
      const errorText = await testResponse.text()
      console.error('🔧 [HubSpot Sync] Token test failed:', errorText)
      throw new Error(`Access token test failed: ${testResponse.status} - ${errorText}`)
    }
    
    console.log('🔧 [HubSpot Sync] Access token is valid')

    // Sync data from HubSpot
    const syncResult = await syncHubSpotData(supabaseClient, accessToken, userId)

    // Update integration last sync time
    await supabaseClient
      .from('user_integrations')
      .update({
        credentials: {
          oauth_connected: true,
          last_sync: new Date().toISOString()
        }
      })
      .eq('user_id', userId)
      .eq('integration_name', 'HubSpot')

    console.log(`🔧 [HubSpot Sync] Sync completed successfully for user: ${userId}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'HubSpot data synced successfully',
        ...syncResult
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('HubSpot sync error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to sync HubSpot data' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function syncHubSpotData(supabaseClient: any, accessToken: string, userId: string) {
  let contactsSynced = 0
  let companiesSynced = 0
  let dealsSynced = 0
  const errors: string[] = []

  try {
    // Fetch data from HubSpot one at a time to isolate issues
    console.log('🔧 [HubSpot Sync] Fetching contacts from HubSpot API...')
    
    const contactsResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=10&properties=email,firstname,lastname,company,lifecyclestage,createdate,phone,associatedcompanyid', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })
    
    console.log(`🔧 [HubSpot Sync] Contacts API response: ${contactsResponse.status}`)
    
    if (!contactsResponse.ok) {
      const errorText = await contactsResponse.text()
      console.error('Contacts API error:', errorText)
      throw new Error(`Failed to fetch contacts: ${contactsResponse.status} - ${errorText}`)
    }

    console.log('🔧 [HubSpot Sync] Fetching companies from HubSpot API...')
    
    const companiesResponse = await fetch('https://api.hubapi.com/crm/v3/objects/companies?limit=10&properties=name,domain,industry,numberofemployees,annualrevenue,website,description', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })
    
    console.log(`🔧 [HubSpot Sync] Companies API response: ${companiesResponse.status}`)
    
    if (!companiesResponse.ok) {
      const errorText = await companiesResponse.text()
      console.error('Companies API error:', errorText)
      throw new Error(`Failed to fetch companies: ${companiesResponse.status} - ${errorText}`)
    }

    console.log('🔧 [HubSpot Sync] Fetching deals from HubSpot API...')
    
    const dealsResponse = await fetch('https://api.hubapi.com/crm/v3/objects/deals?limit=10&properties=dealname,amount,dealstage,closedate,pipeline,hs_is_closed_won,associatedcompanyid', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })
    
    console.log(`🔧 [HubSpot Sync] Deals API response: ${dealsResponse.status}`)
    
    if (!dealsResponse.ok) {
      const errorText = await dealsResponse.text()
      console.error('Deals API error:', errorText)
      throw new Error(`Failed to fetch deals: ${dealsResponse.status} - ${errorText}`)
    }

    const [contactsData, companiesData, dealsData] = await Promise.all([
      contactsResponse.json(),
      companiesResponse.json(),
      dealsResponse.json(),
    ])

    const contacts = contactsData.results || []
    const companies = companiesData.results || []
    const deals = dealsData.results || []

    console.log(`🔧 [HubSpot Sync] Fetched ${contacts.length} contacts, ${companies.length} companies, ${deals.length} deals`)

    // Sync companies first (contacts reference companies)
    for (const company of companies) {
      try {
        // Map employee count to valid size values
        const getCompanySize = (employeeCount: string | number) => {
          const count = parseInt(employeeCount as string) || 0
          if (count === 0) return 'startup'
          if (count <= 10) return 'small'
          if (count <= 50) return 'medium'
          if (count <= 200) return 'large'
          return 'enterprise'
        }

        const companyData = {
          name: company.properties.name || 'Unknown Company',
          domain: company.properties.domain || `hubspot-id-${company.id}`,
          industry: company.properties.industry || 'Unknown',
          size: getCompanySize(company.properties.numberofemployees),
          description: company.properties.description,
          website: company.properties.website,
          hubspotid: company.id,
          updated_at: new Date().toISOString()
        }

        const { error: upsertError } = await supabaseClient
          .from('companies')
          .upsert(companyData, {
            onConflict: 'hubspotid'
          })

        if (upsertError) {
          console.error('Failed to upsert company:', upsertError)
          errors.push(`Company ${company.id}: ${upsertError.message}`)
        } else {
          companiesSynced++
        }
      } catch (error: any) {
        console.error(`Error syncing company ${company.id}:`, error)
        errors.push(`Company ${company.id}: ${error.message}`)
      }
    }

    // Sync contacts
    for (const contact of contacts) {
      try {
        // Find associated company
        let companyId = null
        if (contact.properties.associatedcompanyid) {
          const { data: company } = await supabaseClient
            .from('companies')
            .select('id')
            .eq('hubspotid', contact.properties.associatedcompanyid)
            .single()
          
          if (company) {
            companyId = company.id
          }
        }

        const contactData = {
          email: contact.properties.email,
          first_name: contact.properties.firstname,
          last_name: contact.properties.lastname,
          phone: contact.properties.phone,
          company_id: companyId,
          user_id: userId,
          hubspotid: contact.id,
          updated_at: new Date().toISOString()
        }

        const { error: upsertError } = await supabaseClient
          .from('contacts')
          .upsert(contactData, {
            onConflict: 'hubspotid'
          })

        if (upsertError) {
          console.error('Failed to upsert contact:', upsertError)
          errors.push(`Contact ${contact.id}: ${upsertError.message}`)
        } else {
          contactsSynced++
        }
      } catch (error: any) {
        console.error(`Error syncing contact ${contact.id}:`, error)
        errors.push(`Contact ${contact.id}: ${error.message}`)
      }
    }

    // Sync deals (optional - if deals table exists)
    try {
      const { data: dealsTableExists } = await supabaseClient
        .from('deals')
        .select('id')
        .limit(1)

      if (dealsTableExists !== null) {
        for (const deal of deals) {
          try {
            // Find associated company
            let companyId = null
            if (deal.properties.associatedcompanyid) {
              const { data: company } = await supabaseClient
                .from('companies')
                .select('id')
                .eq('hubspotid', deal.properties.associatedcompanyid)
                .single()
              
              if (company) {
                companyId = company.id
              }
            }

            const dealData = {
              title: deal.properties.dealname || 'Unnamed Deal',
              value: parseFloat(deal.properties.amount || '0'),
              stage: deal.properties.dealstage || 'Unknown',
              expected_close_date: deal.properties.closedate ? new Date(deal.properties.closedate).toISOString() : null,
              company_id: companyId,
              hubspotid: deal.id,
              updated_at: new Date().toISOString()
            }

            const { error: upsertError } = await supabaseClient
              .from('deals')
              .upsert(dealData, {
                onConflict: 'hubspotid'
              })

            if (upsertError) {
              console.error('Failed to upsert deal:', upsertError)
              errors.push(`Deal ${deal.id}: ${upsertError.message}`)
            } else {
              dealsSynced++
            }
          } catch (error: any) {
            console.error(`Error syncing deal ${deal.id}:`, error)
            errors.push(`Deal ${deal.id}: ${error.message}`)
          }
        }
      }
    } catch (error: any) {
      console.log('Deals table does not exist, skipping deals sync')
    }

    console.log(`🔧 [HubSpot Sync] Sync completed: ${contactsSynced} contacts, ${companiesSynced} companies, ${dealsSynced} deals`)

    return {
      contactsSynced,
      companiesSynced,
      dealsSynced,
      errors
    }

  } catch (error) {
    console.error('Error in syncHubSpotData:', error)
    throw error
  }
} 