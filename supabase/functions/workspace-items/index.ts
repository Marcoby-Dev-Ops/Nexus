import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';
import { corsHeaders } from '../_shared/cors';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const workspaceId = url.searchParams.get('workspaceId');
    if (!workspaceId) {
      return new Response('workspaceId query parameter is required', { status: 400, headers: corsHeaders });
    }

    if (req.method === 'GET') {
      const { data, error } = await supabaseClient
        .from('workspace_items')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('updated_at', { ascending: false });
      if (error) throw error;

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
  } catch (err) {
    console.error(err);
    return new Response(err instanceof Error ? err.message : String(err), {
      status: 500,
      headers: corsHeaders,
    });
  }
}); 