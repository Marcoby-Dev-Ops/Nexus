import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

const MOCK_SUGGESTIONS = {
  sales: [
    {
      title: 'Follow up with High-Intent Leads',
      description: '3 leads have shown high purchase intent but have not been contacted in over 48 hours.',
      actionLabel: 'View Leads',
    },
    {
      title: 'Update Stale Deal Information',
      description: '5 deals in the proposal stage have not been updated in over two weeks.',
      actionLabel: 'Review Deals',
    },
  ],
  finance: [
    {
      title: 'Review Uncategorized Expenses',
      description: 'There are 12 recent expenses that need to be categorized for accurate reporting.',
      actionLabel: 'Categorize Expenses',
    },
    {
      title: 'Analyze Q2 Burn Rate',
      description: 'Your burn rate is 15% higher than projected for Q2. Consider reviewing recent spending.',
      actionLabel: 'View Report',
    },
  ],
  operations: [
    {
      title: 'Optimize Inventory Levels',
      description: 'Product SKU #12345 has low stock and high demand, risking a stockout.',
      actionLabel: 'Adjust Inventory',
    },
  ],
  default: [
    {
      title: 'No specific suggestions',
      description: 'No specific suggestions are available for this department at this time.',
      actionLabel: 'Explore',
    },
  ],
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { departmentId } = await req.json();
    const suggestions = MOCK_SUGGESTIONS[departmentId] || MOCK_SUGGESTIONS.default;

    return new Response(JSON.stringify({ suggestions }), {
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
