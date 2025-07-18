import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';
import { corsHeaders } from '../_shared/cors.ts';

interface RequestBody {
  message: string;
  conversationId?: string;
  metadata?: {
    userId?: string;
    agentId?: string;
  };
}

// Define a type for our model configuration
interface AIModel {
  model_name: string;
  provider: 'openai'; // Extendable for 'groq', 'anthropic', etc.
  base_url: string;
  api_key_id: string | null;
}

// Fetches the user's preferred model or falls back to a default
async function getUserModel(supabase: SupabaseClient, userId: string): Promise<AIModel> {
  const { data: preference, error } = await supabase
    .from('user_ai_model_preferences')
    .select('ai_models(*)')
    .eq('user_id', userId)
    .single();

  if (error || !preference || !preference.ai_models) {
    // Fallback to a default model if no preference is set or found
    const { data: defaultModel, error: defaultModelError } = await supabase
      .from('ai_models')
      .select('*')
      .eq('model_name', 'gpt-4o-mini') // A sensible, high-quality default
      .single();
    
    if (defaultModelError || !defaultModel) {
      throw new Error('Default model gpt-4o-mini not found in ai_models table.');
    }
    return defaultModel as AIModel;
  }

  return preference.ai_models as AIModel;
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
      throw new Error('Missing one or more required environment variables.');
    }

    // Create a client with the user's auth context to perform user-level queries.
    const sb = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } },
    });
    
    const { message, conversationId, metadata } = (await req.json()) as RequestBody;
    if (!message) throw new Error('message is a required field');

    const { data: { user } } = await sb.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get the user's selected model or the default
    const model = await getUserModel(sb, user.id);
    
    let apiKey: string;
    if (model.api_key_id) {
      // User is bringing their own key. We must use the admin client to call the decryption function.
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      const { data, error } = await supabaseAdmin.rpc('decrypt_api_key', {
        key_id_to_decrypt: model.api_key_id,
      });

      if (error) throw new Error(`Failed to decrypt API key: ${error.message}`);
      apiKey = data;
    } else {
      // Fallback to the system-wide key from environment variables.
      apiKey = openaiApiKey;
    }

    // 1) Embed the user's query
    const embedRes = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: message }),
    });
    if (!embedRes.ok) throw new Error(`Failed to create embedding: ${await embedRes.text()}`);
    const embedJson = await embedRes.json();
    const queryEmbedding: number[] = embedJson.data[0].embedding;

    // 2) Retrieve context from personal thoughts
    const { data: contextRows, error: matchErr } = await sb.rpc('match_personal_thoughts', {
      query_embedding: queryEmbedding,
      user_uuid: user.id,
      match_threshold: 0.7, // Similarity threshold for relevant context
      match_count: 5,
    });
    if (matchErr) {
      console.error('[ai_ea_stream] Context retrieval error:', matchErr);
      throw new Error(`Failed to retrieve context: ${matchErr.message}`);
    }
    
    const context = (contextRows as any[] || []).map((r) => `- ${r.content}`).join('\n');
    const systemPrompt = context 
      ? `You are Nexus Executive Assistant. Use ONLY the facts below.\n\nFACTS:\n${context}`
      : `You are Nexus Executive Assistant. No specific context available for this query.`;

    // 3) Call the selected provider to stream the chat completion
    // Provider dispatch map (currently only supports OpenAI)
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

    // 4) Stream the response back to the client
    const stream = new ReadableStream({
      async start(controller) {
        const reader = llmResponse.body!.getReader();
        const decoder = new TextDecoder();
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            // Note: No need to re-encode, Deno serves Uint8Array directly.
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
    console.error('[ai_ea_stream] Error:', e);
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