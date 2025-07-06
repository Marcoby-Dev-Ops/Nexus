import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

const MOCK_PERFORMANCE_METRICS = [
  {
    id: 'revenue',
    title: 'Revenue',
    value: '$246,389',
    change: '+12.3%',
    trend: 'up',
  },
  {
    id: 'deals',
    title: 'Deals Closed',
    value: '27',
    change: '+4',
    trend: 'up',
  },
  {
    id: 'conversion',
    title: 'Conversion Rate',
    value: '24.8%',
    change: '+2.1%',
    trend: 'up',
  },
  {
    id: 'leads',
    title: 'New Leads',
    value: '109',
    change: '-12',
    trend: 'down',
  }
];

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    return new Response(JSON.stringify({ metrics: MOCK_PERFORMANCE_METRICS }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
}); 