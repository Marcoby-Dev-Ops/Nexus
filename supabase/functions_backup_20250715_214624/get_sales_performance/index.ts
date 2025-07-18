import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.5';
import { corsHeadersWithOrigin as corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const sb = createClient(SUPABASE_URL, SERVICE_KEY);

serve(async (req: Request) => {
  const origin = req.headers.get('Origin');

  // Handle CORS pre-flight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(origin), status: 200 });
  }

  try {
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!jwt) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    const { user, error: authErr } = await sb.auth.getUser(jwt);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    // Get company id
    const { data: profile } = await sb
      .from('user_profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      return new Response(JSON.stringify({ error: 'No company' }), {
        status: 400,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    // Fetch sales metrics for the company
    // Revenue, Deals Closed, Conversion Rate, New Leads (last 30 days)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Revenue (Closed Won deals this month and last month)
    const { data: currentDeals, error: dealsError } = await sb
      .from('deals')
      .select('amount, status, created_at')
      .eq('company_id', profile.company_id)
      .eq('status', 'closed_won')
      .gte('created_at', startOfMonth.toISOString());
    if (dealsError) throw dealsError;
    const currentRevenue = (currentDeals?.reduce((sum: number, d: { amount?: number }) => sum + (d.amount || 0), 0)) || 0;

    const { data: prevDeals, error: prevDealsError } = await sb
      .from('deals')
      .select('amount, status, created_at')
      .eq('company_id', profile.company_id)
      .eq('status', 'closed_won')
      .gte('created_at', startOfPrevMonth.toISOString())
      .lte('created_at', endOfPrevMonth.toISOString());
    if (prevDealsError) throw prevDealsError;
    const prevRevenue = (prevDeals?.reduce((sum: number, d: { amount?: number }) => sum + (d.amount || 0), 0)) || 0;
    const revenueChange = prevRevenue === 0 ? 0 : ((currentRevenue - prevRevenue) / prevRevenue) * 100;

    // Deals Closed (this month and last month)
    const dealsClosed = currentDeals?.length || 0;
    const prevDealsClosed = prevDeals?.length || 0;
    const dealsClosedChange = prevDealsClosed === 0 ? 0 : ((dealsClosed - prevDealsClosed) / prevDealsClosed) * 100;

    // Conversion Rate (last 30 days)
    const { data: allDeals, error: allDealsError } = await sb
      .from('deals')
      .select('status, created_at')
      .eq('company_id', profile.company_id)
      .gte('created_at', last30Days.toISOString());
    if (allDealsError) throw allDealsError;
    const closedWon = allDeals?.filter((d: { status?: string }) => d.status === 'closed_won').length || 0;
    const totalDeals = allDeals?.length || 0;
    const conversionRate = totalDeals === 0 ? 0 : (closedWon / totalDeals) * 100;
    // Compare to previous 30 days
    const prev30Start = new Date(last30Days.getTime() - 30 * 24 * 60 * 60 * 1000);
    const { data: prevAllDeals, error: prevAllDealsError } = await sb
      .from('deals')
      .select('status, created_at')
      .eq('company_id', profile.company_id)
      .gte('created_at', prev30Start.toISOString())
      .lt('created_at', last30Days.toISOString());
    if (prevAllDealsError) throw prevAllDealsError;
    const prevClosedWon = prevAllDeals?.filter((d: { status?: string }) => d.status === 'closed_won').length || 0;
    const prevTotalDeals = prevAllDeals?.length || 0;
    const prevConversionRate = prevTotalDeals === 0 ? 0 : (prevClosedWon / prevTotalDeals) * 100;
    const conversionChange = prevConversionRate === 0 ? 0 : (conversionRate - prevConversionRate);

    // New Leads (contacts created in last 30 days and previous 30 days)
    const { data: leads, error: leadsError } = await sb
      .from('contacts')
      .select('id, created_at')
      .eq('company_id', profile.company_id)
      .gte('created_at', last30Days.toISOString());
    if (leadsError) throw leadsError;
    const newLeads = leads?.length || 0;
    const { data: prevLeads, error: prevLeadsError } = await sb
      .from('contacts')
      .select('id, created_at')
      .eq('company_id', profile.company_id)
      .gte('created_at', prev30Start.toISOString())
      .lt('created_at', last30Days.toISOString());
    if (prevLeadsError) throw prevLeadsError;
    const prevNewLeads = prevLeads?.length || 0;
    const leadsChange = prevNewLeads === 0 ? 0 : ((newLeads - prevNewLeads) / prevNewLeads) * 100;

    // Format metrics for frontend
    const metrics = [
      {
        id: 'revenue',
        title: 'Revenue',
        value: `$${currentRevenue.toLocaleString()}`,
        change: `${revenueChange >= 0 ? '+' : ''}${revenueChange.toFixed(1)}%`,
        trend: revenueChange >= 0 ? 'up' : 'down',
      },
      {
        id: 'deals',
        title: 'Deals Closed',
        value: `${dealsClosed}`,
        change: `${dealsClosedChange >= 0 ? '+' : ''}${dealsClosedChange.toFixed(0)}`,
        trend: dealsClosedChange >= 0 ? 'up' : 'down',
      },
      {
        id: 'conversion',
        title: 'Conversion Rate',
        value: `${conversionRate.toFixed(1)}%`,
        change: `${conversionChange >= 0 ? '+' : ''}${conversionChange.toFixed(1)}%`,
        trend: conversionChange >= 0 ? 'up' : 'down',
      },
      {
        id: 'leads',
        title: 'New Leads',
        value: `${newLeads}`,
        change: `${leadsChange >= 0 ? '+' : ''}${leadsChange.toFixed(0)}`,
        trend: leadsChange >= 0 ? 'up' : 'down',
      },
    ];

    return new Response(JSON.stringify({ metrics }), {
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error(error);
    const errMsg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errMsg }), {
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      status: 400,
    });
  }
}); 