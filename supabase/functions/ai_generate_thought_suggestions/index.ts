import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';
import { corsHeaders } from '../_shared/cors.ts';

interface Payload {
  thoughtId: string;
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
      throw new Error('Missing required environment variables');
    }

    const sb = createClient(supabaseUrl, supabaseServiceKey);

    // Auth (optional — we just trust service role key)

    const { thoughtId } = (await req.json()) as Payload;
    if (!thoughtId) throw new Error('thoughtId is required');

    // Fetch the thought
    const { data: thought, error: thoughtErr } = await sb
      .from('thoughts')
      .select('*')
      .eq('id', thoughtId)
      .single();
    if (thoughtErr) throw thoughtErr;

    // Fetch user integrations
    const { data: integrations } = await sb
      .from('user_integrations')
      .select('provider,status')
      .eq('user_id', thought.user_id)
      .eq('status', 'connected');

    const connected = integrations?.map((i: any) => i.provider) ?? [];
    const integrationCtx = connected.length
      ? `The user has connected the following tools: ${connected.join(', ')}.`
      : 'The user has no marketing integrations connected.';

    // Build prompt
    const prompt = `You are an AI marketing strategist in Nexus.
${integrationCtx}
Analyse the user's thought and propose up to 5 actionable initiatives. Each initiative must be possible with the available tools.
Provide your output as valid JSON array where each element has: title, description, recommended_tool (string), first_task (string).
Do not wrap your answer in markdown.

User Thought: "${thought.content}"`;

    // Call OpenAI
    const llmRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'o3-mini-high',
        messages: [{ role: 'system', content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!llmRes.ok) {
      const body = await llmRes.text();
      throw new Error(`LLM call failed: ${body}`);
    }

    const llmJson = await llmRes.json();
    const content = llmJson.choices?.[0]?.message?.content ?? '[]';
    let suggestions: any[] = [];
    try {
      suggestions = JSON.parse(content);
    } catch (_) {
      suggestions = [];
    }

    // Persist suggestions as ideas & tasks
    for (const sug of suggestions) {
      const { title, description, first_task } = sug;
      if (!title) continue;
      // insert idea
      const { data: ideaRow } = await sb
        .from('thoughts')
        .insert({
          user_id: thought.user_id,
          content: title + (description ? ` - ${description}` : ''),
          category: 'idea',
          status: 'concept',
          parent_idea_id: thoughtId,
          ai_insights: sug,
        })
        .select()
        .single();

      if (first_task) {
        await sb.from('thoughts').insert({
          user_id: thought.user_id,
          content: first_task,
          category: 'task',
          status: 'not_started',
          parent_idea_id: ideaRow.id,
        });
      }
    }

    return new Response(JSON.stringify({ success: true, suggestions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: (e as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}); 