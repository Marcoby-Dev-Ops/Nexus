import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.10';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface RouterResponse {
  content: unknown;
  confidence: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();

    if (!message || typeof message !== 'string') {
      throw new Error('Invalid or missing "message"');
    }

    // Very naive intent classification – replace with real model later
    const lower = message.toLowerCase();
    let res: RouterResponse;

    if (lower.includes('kpi') || lower.includes('metric')) {
      // Fetch Operations metrics view (expects one row)
      const { data, error } = await supabase
        .from('department_metrics_view')
        .select('*')
        .eq('department', 'operations')
        .maybeSingle();

      if (error) throw error;

      res = {
        content: data ?? { note: 'No metrics available' },
        confidence: 0.9,
      };
    } else {
      res = {
        content: `Sorry, I don't have a tool for that yet. Message received: ${message}`,
        confidence: 0.2,
      };
    }

    return new Response(JSON.stringify(res), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('ai_agent_router error', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
    );
  }
}); 