// TODO: The following remote imports are required for Deno runtime and will resolve at deploy time.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.42.5';
import { corsHeaders } from '../_shared/cors.ts';

// Environment validation
const validateEnvironment = () => {
  const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'OPENAI_API_KEY'];
  const missing = required.filter(key => !Deno.env.get(key));
  
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
};

// Error response helper
const createErrorResponse = (message: string, status: number = 400) => {
  return new Response(JSON.stringify({ 
    error: message, 
    timestamp: new Date().toISOString(),
    status 
  }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
};

// Success response helper
const createSuccessResponse = (data: any, status: number = 200) => {
  return new Response(JSON.stringify({ 
    data, 
    timestamp: new Date().toISOString(),
    status 
  }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
};

// Authentication helper
const authenticateRequest = async (req: Request) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { user: null, supabase, error: 'No authorization header' };
  }
  
  const jwt = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(jwt);
  
  if (error || !user) {
    return { user: null, supabase, error: 'Invalid token' };
  }
  
  return { user, supabase };
};

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
  try {
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
      return defaultModel as unknown as AIModel;
    }
    return preference.ai_models as unknown as AIModel;
  } catch (error) {
    console.error('Model selection error:', error);
    throw new Error('Failed to get user model preference');
  }
}

// Main handler
const handleRequest = async (req: Request, auth: { user: any; supabase: any }) => {
  const { user, supabase } = auth;
  
  try {
    const body = (await req.json()) as AssistantRequestBody;
    const { message, voice, file, clipboard, context, conversationId, metadata } = body;
    
    // --- Multi-modal input handling ---
    // TODO: Handle voice (audio-to-text), file (summarize/extract), clipboard (parse)
    if (!message /* && !voice && !file && !clipboard */) {
      return createErrorResponse('At least one input type is required', 400);
    }

    console.log(`🤖 [Assistant] Processing request for user ${user.id}`);

    // --- Model selection ---
    const model = await getUserModel(supabase, user.id);
    let apiKey: string;
    
    if (model.api_key_id) {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );
      const { data, error } = await supabaseAdmin.rpc('decrypt_api_key', {
        key_id_to_decrypt: model.api_key_id,
      });
      if (error) {
        console.error('API key decryption error:', error);
        return createErrorResponse(`Failed to decrypt API key: ${error.message}`, 500);
      }
      apiKey = data;
    } else {
      apiKey = Deno.env.get('OPENAI_API_KEY')!;
    }

    // --- RAG pipeline: Embed query and retrieve context ---
    // TODO: Extend to tasks, reminders, docs, CRM, calendar, etc.
    const embedRes = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: message }),
    });

    if (!embedRes.ok) {
      console.error('Embedding API error:', embedRes.status);
      return createErrorResponse('Failed to generate embeddings', 500);
    }

    const { data: embedding } = await embedRes.json();
    
    // --- Vector similarity search ---
    const { data: similarDocs, error: searchError } = await supabase.rpc('match_documents', {
      query_embedding: embedding[0].embedding,
      match_threshold: 0.7,
      match_count: 5,
    });

    if (searchError) {
      console.error('Vector search error:', searchError);
      return createErrorResponse('Failed to search documents', 500);
    }

    // --- Build context from retrieved documents ---
    const contextDocs = similarDocs?.map((doc: any) => doc.content).join('\n\n') || '';
    const systemPrompt = `You are a helpful AI assistant. Use the following context to answer the user's question:

Context:
${contextDocs}

User Question: ${message}

Please provide a helpful and accurate response based on the context provided.`;

    // --- Call OpenAI API ---
    const completionRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model.model_name,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!completionRes.ok) {
      console.error('OpenAI API error:', completionRes.status);
      return createErrorResponse('Failed to generate response', 500);
    }

    const completion = await completionRes.json();
    const assistantResponse = completion.choices[0].message.content;

    // --- Log conversation ---
    if (conversationId) {
      try {
        await supabase.from('conversation_messages').insert([
          {
            conversation_id: conversationId,
            user_id: user.id,
            role: 'user',
            content: message,
            created_at: new Date().toISOString(),
          },
          {
            conversation_id: conversationId,
            user_id: user.id,
            role: 'assistant',
            content: assistantResponse,
            created_at: new Date().toISOString(),
          },
        ]);
      } catch (logError) {
        console.error('Failed to log conversation:', logError);
        // Don't fail the request if logging fails
      }
    }

    console.log(`✅ [Assistant] Successfully processed request for user ${user.id}`);

    return createSuccessResponse({
      response: assistantResponse,
      context_used: contextDocs ? true : false,
      model_used: model.model_name,
      conversation_id: conversationId,
    });

  } catch (error) {
    console.error('Assistant processing error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to process assistant request',
      500
    );
  }
};

// Main serve function
serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  // Public health check: allow unauthenticated GET
  if (req.method === 'GET' && !req.headers.get('Authorization')) {
    return createSuccessResponse({ status: 'ok', service: 'assistant' });
  }
  
  try {
    // Validate environment
    validateEnvironment();
    
    // Authenticate request
    const auth = await authenticateRequest(req);
    if (auth.error) {
      return createErrorResponse(auth.error, 401);
    }
    
    // Call handler
    return await handleRequest(req, auth);
    
  } catch (error) {
    console.error('Assistant error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
}); 