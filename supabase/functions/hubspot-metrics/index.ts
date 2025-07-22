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

    // Check if token is expired and refresh if needed
    let accessToken = tokenData.access_token
    if (tokenData.expires_at && new Date(tokenData.expires_at) <= new Date()) {
      // Token is expired, refresh it
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
      }
    }

    // Fetch HubSpot data
    const metrics = await fetchHubSpotMetrics(accessToken)

    return new Response(
      JSON.stringify(metrics),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('HubSpot metrics error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch HubSpot metrics' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function fetchHubSpotMetrics(accessToken: string) {
  try {
    // Fetch contacts, companies, and deals in parallel
    const [contactsResponse, companiesResponse, dealsResponse] = await Promise.all([
      fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=100&properties=email,firstname,lastname,company,lifecyclestage,createdate', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }),
      fetch('https://api.hubapi.com/crm/v3/objects/companies?limit=100&properties=name,domain,industry,numberofemployees,annualrevenue', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }),
      fetch('https://api.hubapi.com/crm/v3/objects/deals?limit=100&properties=dealname,amount,dealstage,closedate,pipeline,hs_is_closed_won', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }),
    ])

    if (!contactsResponse.ok || !companiesResponse.ok || !dealsResponse.ok) {
      throw new Error('Failed to fetch HubSpot data')
    }

    const [contactsData, companiesData, dealsData] = await Promise.all([
      contactsResponse.json(),
      companiesResponse.json(),
      dealsResponse.json(),
    ])

    const contacts = contactsData.results || []
    const companies = companiesData.results || []
    const deals = dealsData.results || []

    // Calculate metrics
    const totalDealValue = deals.reduce((sum: number, deal: any) => {
      return sum + parseFloat(deal.properties.amount || '0')
    }, 0)

    const closedWonDeals = deals.filter((deal: any) => 
      deal.properties.hs_is_closed_won === 'true'
    )

    const thisMonth = new Date()
    thisMonth.setDate(1)
    thisMonth.setHours(0, 0, 0, 0)

    const newContactsThisMonth = contacts.filter((contact: any) => {
      const createdDate = new Date(contact.properties.createdate)
      return createdDate >= thisMonth
    }).length

    const industryCounts = companies.reduce((acc: Record<string, number>, company: any) => {
      const industry = company.properties.industry || 'Unknown'
      acc[industry] = (acc[industry] || 0) + 1
      return acc
    }, {})

    const topIndustries = Object.entries(industryCounts)
      .map(([industry, count]) => ({ industry, count }))
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 5)

    const dealsByStage = deals.reduce((acc: Record<string, number>, deal: any) => {
      const stage = deal.properties.dealstage || 'Unknown'
      acc[stage] = (acc[stage] || 0) + 1
      return acc
    }, {})

    const totalRevenue = closedWonDeals.reduce((sum: number, deal: any) => {
      return sum + parseFloat(deal.properties.amount || '0')
    }, 0)

    const averageCustomerValue = companies.length > 0 ? 
      totalRevenue / companies.length : 0

    const topCustomers = companies
      .map((company: any) => ({
        name: company.properties.name || 'Unknown',
        value: parseFloat(company.properties.annualrevenue || '0')
      }))
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, 10)

    return {
      success: true,
      metrics: {
        salesPipeline: {
          totalDeals: deals.length,
          totalValue: totalDealValue,
          averageDealSize: deals.length > 0 ? totalDealValue / deals.length : 0,
          conversionRate: deals.length > 0 ? (closedWonDeals.length / deals.length) * 100 : 0,
          dealsByStage
        },
        customerInsights: {
          totalContacts: contacts.length,
          totalCompanies: companies.length,
          newContactsThisMonth,
          topIndustries
        },
        revenueAnalytics: {
          totalRevenue,
          monthlyRecurringRevenue: totalRevenue / 12, // Simplified calculation
          averageCustomerValue,
          topCustomers
        }
      },
      data: {
        contactsCount: contacts.length,
        companiesCount: companies.length,
        dealsCount: deals.length,
        lastUpdated: new Date().toISOString()
      }
    }

  } catch (error) {
    console.error('Error fetching HubSpot metrics:', error)
    throw error
  }
} 