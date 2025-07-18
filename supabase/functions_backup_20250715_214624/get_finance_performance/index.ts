import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

const MOCK_FINANCIAL_STATS = [
  {
    id: 'revenue',
    title: 'Revenue',
    value: '$147,891.29',
    change: '+12.5%',
    trend: 'up',
  },
  {
    id: 'expenses',
    title: 'Expenses',
    value: '$43,128.94',
    change: '+2.3%',
    trend: 'up',
  },
  {
    id: 'profit',
    title: 'Net Profit',
    value: '$104,762.35',
    change: '+15.8%',
    trend: 'up',
  },
  {
    id: 'runway',
    title: 'Cash Runway',
    value: '9.2 months',
    change: '-0.8 months',
    trend: 'down',
  }
];

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    return new Response(JSON.stringify({ stats: MOCK_FINANCIAL_STATS }), {
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