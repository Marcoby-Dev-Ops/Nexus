import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { message, conversationId, metadata } = await req.json();
    if (!message || typeof message !== 'string') {
      throw new Error('Invalid message');
    }
    if (!conversationId || typeof conversationId !== 'string') {
      throw new Error('Invalid conversationId');
    }

    // TODO: implement supervisor routing logic
    const response = {
      content: `Supervisor routing stub received: ${message}`,
      confidence: 0.95
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message, success: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}); 