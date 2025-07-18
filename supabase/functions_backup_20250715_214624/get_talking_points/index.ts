import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { opportunity } = await req.json();

    const mockTalkingPoints = [
      `Mention their recent expansion into the European market.`,
      `Ask about the challenges they're facing with their current solution.`,
      `Highlight how our product can help them achieve their Q3 goals.`,
      `Reference their CEO's latest blog post about the future of their industry.`,
    ];

    return new Response(JSON.stringify({ talkingPoints: mockTalkingPoints }), {
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