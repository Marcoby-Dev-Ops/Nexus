import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';
import { corsHeaders } from '../_shared/cors.ts';

interface RequestBody {
  userId: string;
  message: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
      throw new Error('Missing environment variables');
    }

    const sb = createClient(supabaseUrl, supabaseServiceKey);
    const { userId, message } = (await req.json()) as RequestBody;
    if (!userId || !message) throw new Error('userId and message required');

    // 1) Embed the query
    const embedRes = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: message,
      }),
    });
    const embedJson = await embedRes.json();
    const queryEmbedding: number[] = embedJson.data[0].embedding;

    // 2) Fetch top K similar vectors (thoughts + personal memories)
    const { data: matches, error: matchErr } = await sb.rpc('match_personal_thoughts', {
      query_embedding: queryEmbedding,
      match_count: 6,
      match_user_id: userId,
    });
    if (matchErr) throw matchErr;

    const contextBlocks: string[] = (matches as any[]).map((m) => `- ${m.content}`);

    // 3) Build prompt
    const prompt = `You are Nexus, the user's knowledge assistant. Use ONLY the facts below to answer or propose next steps.\n\n` +
      `FACTS:\n${contextBlocks.join('\n')}\n\nUSER: ${message}`;

    // 4) Chat completion
    const chatRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'o3-mini-high',
        messages: [
          { role: 'system', content: prompt },
        ],
        temperature: 0.7,
      }),
    });
    const chatJson = await chatRes.json();
    const answer = chatJson.choices[0].message.content;

    return new Response(JSON.stringify({ answer }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
    );
  }
}); 