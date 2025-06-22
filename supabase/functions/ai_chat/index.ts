import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';
import { corsHeaders } from './cors.ts';

// Simple in-memory cache for user profile to avoid extra DB calls per request (clears on cold start)
const profileCache = new Map<string, { name: string; company?: string }>();

async function getProfile(supabaseClient: any, userId: string) {
  if (profileCache.has(userId)) return profileCache.get(userId)!;

  // Fetch from auth.users metadata instead of a separate table
  const { data, error } = await supabaseClient.auth.admin.getUserById(userId);

  if (error || !data) {
    profileCache.set(userId, { name: 'there' });
    return { name: 'there' };
  }

  const profile = {
    name: (data.user_metadata?.full_name as string | undefined) || data.email || 'there',
    company: (data.user_metadata?.company as string | undefined) || undefined,
  };
  profileCache.set(userId, profile);
  return profile;
}

// === STREAMING CONFIG =========================================
const isStreamingRequest = (req: Request): boolean => {
  const url = new URL(req.url);
  return url.searchParams.get('stream') === '1' || req.headers.get('accept')?.includes('text/event-stream');
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // --- 1. Environment and Supabase Client Setup ---
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const openrouterApiKey = Deno.env.get('OPENROUTER_API_KEY');

    if (!supabaseUrl || !supabaseServiceKey || (!openaiApiKey && !openrouterApiKey)) {
      throw new Error('Missing required environment variables');
    }
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // --- 2. User Authentication ---
    let userId: string | undefined;
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const jwt = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await supabaseClient.auth.getUser(jwt);
      if (!error && user?.id) userId = user.id;
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    
    // --- 3. Handle GET request to load a conversation ---
    if (req.method === 'GET') {
      const url = new URL(req.url);
      // Example URL: /.../ai_chat/123e4567-e89b-12d3-a456-426614174000
      const conversationId = url.pathname.split('/').pop();

      if (!conversationId || conversationId === 'ai_chat') {
        return new Response(JSON.stringify({ error: 'Missing or invalid conversationId' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }

      // Verify user has access to this conversation
      const { data: convData, error: convErr } = await supabaseClient
        .from('ai_conversations')
        .select('id, title, created_at, updated_at')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single();

      if (convErr || !convData) {
        return new Response(JSON.stringify({ error: 'Conversation not found or access denied' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        });
      }

      const { data: messages, error: messagesError } = await supabaseClient
        .from('ai_messages')
        .select('id, role, content, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        throw messagesError;
      }

      const conversation = {
        ...convData,
        messages: messages || [],
      };

      return new Response(JSON.stringify(conversation), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // --- 4. Handle POST request for streaming chat completion ---
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
    }

    const isOpenRouter = Boolean(openrouterApiKey) || (openaiApiKey?.startsWith('sk-or-'));
    const llmApiKey = isOpenRouter ? (openrouterApiKey || openaiApiKey) : openaiApiKey!;
    const llmUrl = isOpenRouter ? 'https://openrouter.ai/api/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions';
    const llmModelDefault = isOpenRouter ? 'o3-mini-high' : 'o3-mini-high';

    const { message, conversationId: rawConversationId, metadata } = await req.json();

    if (!message || typeof message !== 'string') throw new Error('Invalid message');

    // ensure metadata object, injecting the verified userId
    const cleanMetadata = { ...(metadata || {}), userId };

    // Determine if this response should use the higher-tier model
    const isFinal = metadata?.conversation_stage === 'resolution';
    const llmModel = isFinal ? 'o3' : llmModelDefault;

    let conversationId: string | undefined = rawConversationId;

    // If a conversationId was supplied, make sure it still exists and belongs to the user
    if (conversationId) {
      const { data: convRow, error: convErr } = await supabaseClient
        .from('ai_conversations')
        .select('id')
        .eq('id', conversationId)
        .eq('user_id', userId) // Security Fix: Prevent users from accessing other users' conversations
        .single();
      if (convErr || !convRow) {
        conversationId = undefined; // treat as new if not found or not owned by user
      }
    }

    if (!conversationId) {
      // Attempt atomic nested insert (conversation + first user message)
      try {
        const { data, error } = await supabaseClient
          .from('ai_conversations')
          .insert(
            {
              user_id: userId || null,
              title: message.slice(0, 64) || 'Untitled',
              ai_messages: {
                data: [
                  {
                    user_id: userId || null,
                    role: 'user',
                    content: message,
                  },
                ],
              },
            } as any,
          )
          .select('id')
          .single();

        if (error) throw error;
        conversationId = data.id;
      } catch (nestedErr: any) {
        // Fallback: create conversation then insert message separately
        if (!conversationId) {
          const { data: convData, error: convErr } = await supabaseClient
            .from('ai_conversations')
            .insert({
              user_id: userId || null,
              title: message.slice(0, 64) || 'Untitled',
            })
            .select('id')
            .single();
          if (convErr) throw convErr;
          conversationId = convData.id;
        }

        const { error: msgErr } = await supabaseClient.from('ai_messages').insert({
          conversation_id: conversationId,
          user_id: userId || null,
          role: 'user',
          content: message,
        });
        if (msgErr) throw msgErr;
      }
    } else {
      // ---- Persist USER message --------------------------------------------
      const { error } = await supabaseClient.from('ai_messages').insert({
        conversation_id: conversationId,
        user_id: userId || null,
        role: 'user',
        content: message,
      });
      if (error) throw error;
    }

    // ---- (Optional) Audit Log ------------------------------------------------
    await supabaseClient.from('ai_audit_logs').insert({
      user_id: userId || null,
      action: 'insert',
      table_name: 'ai_messages',
      record_id: conversationId,
      details: { role: 'user' },
    });

    // ---- Fetch user profile & recent history in parallel -------------------
    const [profileRes, historyRes, convRowRes] = await Promise.all([
      (async () => {
        if (!userId) return { name: 'there', company: undefined };
        try {
          return await getProfile(supabaseClient, userId);
        } catch (_e) {
          return { name: 'there', company: undefined };
        }
      })(),
      (async () => {
        const { data, error } = await supabaseClient
          .from('ai_messages')
          .select('role, content')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })
          .limit(10); // trim for performance
        if (error) throw error;
        return data;
      })(),
      (async () => {
        const { data, error } = await supabaseClient
          .from('ai_conversations')
          .select('summary_chunks')
          .eq('id', conversationId)
          .single();
        if (error) return { summary_chunks: [] } as any;
        return data;
      })(),
    ]);

    const userProfile = profileRes;
    const history = historyRes;
    const summaryChunks: string[] = (convRowRes?.summary_chunks as unknown as string[]) || [];

    // === RAG CONTEXT USING VECTOR SEARCH ==================================
    let ragContext = '';
    try {
      // Generate SHA-256 checksum of the message for cache lookup
      const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(message));
      const checksum = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      // Attempt to retrieve cached embedding first (cost control – Pillar 9)
      let embedding: number[] | null = null;
      const { data: cachedRow } = await supabaseClient
        .from('ai_embedding_cache')
        .select('embedding')
        .eq('checksum', checksum)
        .single();

      if (cachedRow?.embedding) {
        embedding = cachedRow.embedding as unknown as number[];
      }

      // Cache miss → call OpenAI embeddings endpoint (text-embedding-3-small)
      if (!embedding && openaiApiKey) {
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
        if (embedRes.ok) {
          const embedJson = await embedRes.json();
          embedding = embedJson.data?.[0]?.embedding;

          // Persist to cache asynchronously – ignore errors
          if (embedding) {
            await supabaseClient
              .from('ai_embedding_cache')
              .insert({ checksum, content: message, embedding })
              .select('id');
          }
        }
      }

      // When we have an embedding vector, perform similarity search
      if (embedding) {
        // --- Knowledge documents ---
        const { data: docs } = await supabaseClient.rpc('match_documents', {
          query_embedding: embedding,
          match_threshold: 0.5,
          match_count: 5,
        });

        let knowledgeChunks = '';
        if (docs && docs.length) {
          knowledgeChunks = (docs as any[]).map((d) => d.content).join('\n\n');
        }

        // --- Personal thoughts (Second Brain) ---
        let personalChunks = '';
        if (userId) {
          const { data: thoughts } = await supabaseClient.rpc('match_personal_thoughts', {
            query_embedding: embedding,
            user_uuid: userId,
            match_threshold: 0.4,
            match_count: 3,
          });
          if (thoughts && thoughts.length) {
            personalChunks = (thoughts as any[])
              .map((t) => `• ${t.content}`)
              .join('\n');
          }
        }

        ragContext = [
          knowledgeChunks ? `Knowledge docs:\n${knowledgeChunks}` : '',
          personalChunks ? `Personal thoughts:\n${personalChunks}` : '',
        ]
          .filter(Boolean)
          .join('\n\n');
      }
    } catch (e: any) {
      console.error('RAG Error:', e.message);
    }
    
    // === SYSTEM MESSAGE & FINAL PAYLOAD =================================
    const systemMessage = getSystemMessage(userProfile, ragContext, summaryChunks);
    const headers = { ...corsHeaders, 'Content-Type': 'text/event-stream', 'X-Content-Type-Options': 'nosniff' };
    
    // === RESPONSE HANDLING (STREAMING VS. NON-STREAMING) =================
    if (isStreamingRequest(req)) {
      const stream = new ReadableStream({
        async start(controller) {
          const onProgress = (chunk: string) => {
            try {
              controller.enqueue(createDataChunk(chunk));
            } catch (e) {
              // Ignore abort errors
            }
          };

          try {
            const aiResponseContent = await getAIResponse(
              llmUrl,
              llmApiKey,
              llmModel,
              systemMessage,
              history,
              onProgress,
            );
            
            // Persist the full AI response message at the end of the stream
            await supabaseClient.from('ai_messages').insert({
              conversation_id: conversationId,
              user_id: userId,
              role: 'assistant',
              content: aiResponseContent,
            });

          } catch (e: any) {
            console.error('LLM or persistence error:', e);
            controller.enqueue(createErrorChunk(e.message));
          } finally {
            controller.close();
          }
        },
      });
      return new Response(stream, { headers });
    } else {
      // Handle non-streaming request
      try {
        const aiResponseContent = await getAIResponse(
          llmUrl,
          llmApiKey,
          llmModel,
          systemMessage,
          history,
          () => {}, // no-op for progress
        );

        // Persist the full AI response message
        const { data: aiMsg, error: aiMsgErr } = await supabaseClient.from('ai_messages').insert({
          conversation_id: conversationId,
          user_id: userId,
          role: 'assistant',
          content: aiResponseContent,
        }).select().single();

        if (aiMsgErr) throw aiMsgErr;
        
        return new Response(
          JSON.stringify({ success: true, message: aiMsg }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
        );

      } catch (e: any) {
        console.error('LLM or persistence error:', e);
        return new Response(
          JSON.stringify({ success: false, error: e.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
        );
      }
    }
  } catch (error) {
    console.error('ai_chat error', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message, success: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});