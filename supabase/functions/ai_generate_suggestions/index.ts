import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';
import { corsHeaders } from './cors.ts';

interface KpiSnapshot {
  value: {
    amount: number;
    currency: string;
    [key: string]: unknown;
  };
  captured_at: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Setup - Environment variables and Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
      throw new Error('Missing required environment variables');
    }
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Authentication
    const authHeader = req.headers.get('authorization');
    const jwt = authHeader?.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(jwt);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    // 3. Input validation
    const { departmentId } = await req.json();
    if (!departmentId) {
      return new Response(JSON.stringify({ error: 'departmentId is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    // 4. Fetch KPI data for the department
    const since = new Date();
    since.setMonth(since.getMonth() - 12);
    const { data: kpiData, error: kpiError } = await supabaseClient
      .from('ai_kpi_snapshots')
      .select('kpi_id, value, captured_at')
      .eq('department_id', departmentId)
      .gte('captured_at', since.toISOString());

    if (kpiError) throw kpiError;

    // 5. Construct a prompt for the LLM
    const prompt = `
      You are an expert business analyst AI for the Nexus platform.
      A user is looking at their ${departmentId} department dashboard.
      Based on the following raw KPI data from the last 12 months, generate 2-3 concise, actionable suggestions.
      Present the output as a valid JSON array of objects, where each object has "title", "description", and "actionLabel" keys.
      Do not include any other text or explanation in your response.

      KPI Data:
      ${JSON.stringify(kpiData, null, 2)}
    `;

    // 6. Call the LLM (OpenAI)
    const llmRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        response_format: { type: "json_object" },
      }),
    });

    if (!llmRes.ok) {
      const errorBody = await llmRes.text();
      throw new Error(`LLM API request failed: ${errorBody}`);
    }

    const llmJson = await llmRes.json();
    const suggestionsText = llmJson.choices[0].message.content;

    // 7. Parse and return the suggestions
    try {
        const suggestions = JSON.parse(suggestionsText);
        return new Response(JSON.stringify(suggestions), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (parseError) {
        console.error("Failed to parse suggestions from LLM:", suggestionsText);
        throw new Error('Failed to parse suggestions from AI response.');
    }

  } catch (e) {
    console.error(e);
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
