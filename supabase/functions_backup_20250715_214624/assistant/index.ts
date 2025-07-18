// TODO: The following remote imports are required for Deno runtime and will resolve at deploy time.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

// --- Types ---
interface AssistantRequestBody {
  message?: string;
  voice?: string; // base64-encoded audio (TODO)
  file?: string;  // base64-encoded file (TODO)
  clipboard?: string; // clipboard text (TODO)
  context?: Record<string, any>; // page/domain, recent activity, etc. (TODO)
  conversationId?: string;
  metadata?: {
    userId?: string;
    agentId?: string;
  };
}

// --- Model selection (reuse from ai_ea_stream) ---
interface AIModel {
  model_name: string;
  provider: 'openai'; // Extendable for 'groq', 'anthropic', etc.
  base_url: string;
  api_key_id: string | null;
}

async function getUserModel(supabase: SupabaseClient, userId: string): Promise<AIModel> {
  const { data: preference, error } = await supabase
    .from('user_ai_model_preferences')
    .select('ai_models(*)')
    .eq('user_id', userId)
    .single();
  if (error || !preference || !preference.ai_models) {
    const { data: defaultModel, error: defaultModelError } = await supabase
      .from('ai_models')
      .select('*')
      .eq('model_name', 'gpt-4o-mini')
      .single();
    if (defaultModelError || !defaultModel) {
      throw new Error('Default model gpt-4o-mini not found in ai_models table.');
    }
    return defaultModel as AIModel;
  }
  return preference.ai_models as AIModel;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }
  // Public health check: allow unauthenticated GET
  if (req.method === 'GET' && !req.headers.get('Authorization')) {
    return new Response(JSON.stringify({ status: 'ok' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
      throw new Error('Missing one or more required environment variables.');
    }
    const sb = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } },
    });
    const body = (await req.json()) as AssistantRequestBody;
    const { message, voice, file, clipboard, context, conversationId, metadata } = body;
    // --- Multi-modal input handling ---
    // TODO: Handle voice (audio-to-text), file (summarize/extract), clipboard (parse)
    if (!message /* && !voice && !file && !clipboard */) throw new Error('At least one input type is required');
    // --- User authentication ---
    const { data: { user } } = await sb.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    // --- Model selection ---
    const model = await getUserModel(sb, user.id);
    let apiKey: string;
    if (model.api_key_id) {
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      const { data, error } = await supabaseAdmin.rpc('decrypt_api_key', {
        key_id_to_decrypt: model.api_key_id,
      });
      if (error) throw new Error(`Failed to decrypt API key: ${error.message}`);
      apiKey = data;
    } else {
      apiKey = openaiApiKey;
    }
    // --- RAG pipeline: Embed query and retrieve context ---
    // TODO: Extend to tasks, reminders, docs, CRM, calendar, etc.
    const embedRes = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: message }),
    });
    if (!embedRes.ok) throw new Error(`Failed to create embedding: ${await embedRes.text()}`);
    const embedJson = await embedRes.json();
    const queryEmbedding: number[] = embedJson.data[0].embedding;
    // --- Retrieve context from personal thoughts (extend for more sources) ---
    const { data: contextRows, error: matchErr } = await sb.rpc('match_personal_thoughts', {
      query_embedding: queryEmbedding,
      user_uuid: user.id,
      match_threshold: 0.7,
      match_count: 5,
    });
    if (matchErr) {
      console.error('[assistant] Context retrieval error:', matchErr);
      throw new Error(`Failed to retrieve context: ${matchErr.message}`);
    }
    const contextFacts = (contextRows as any[] || []).map((r) => `- ${r.content}`).join('\n');
    // --- Supervisor agent for intent detection and specialist routing (TODO) ---
    // TODO: Integrate supervisor agent for intent detection and modular action handlers
    const systemPrompt = contextFacts
      ? `You are Nexus Executive Assistant. Use ONLY the facts below.\n\nFACTS:\n${contextFacts}`
      : `You are Nexus Executive Assistant. No specific context available for this query.`;
    // --- LLM streaming response ---
    const providers = {
      openai: () => fetch(`${model.base_url}/chat/completions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model.model_name,
          stream: true,
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: message }],
          temperature: 0.7,
        }),
      })
    };
    const providerFetch = providers[model.provider];
    if (!providerFetch) {
      throw new Error(`Provider "${model.provider}" is not supported.`);
    }
    const llmResponse = await providerFetch();
    if (!llmResponse.ok || !llmResponse.body) {
      const body = await llmResponse.text();
      throw new Error(`LLM API request failed: ${body}`);
    }
    // --- Stream the response back to the client ---
    const stream = new ReadableStream({
      async start(controller) {
        const reader = llmResponse.body!.getReader();
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
        } catch (error) {
          console.error('Error while reading from LLM stream:', error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });
    return new Response(stream, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream; charset=utf-8' },
    });
  } catch (e) {
    console.error('[assistant] Error:', e);
    const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';
    return new Response(JSON.stringify({
      error: errorMessage,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}); 