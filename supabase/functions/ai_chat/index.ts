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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const openrouterApiKey = Deno.env.get('OPENROUTER_API_KEY');

    if (!supabaseUrl || !supabaseServiceKey || (!openaiApiKey && !openrouterApiKey)) {
      throw new Error('Missing required environment variables');
    }

    const isOpenRouter = Boolean(openrouterApiKey) || (openaiApiKey?.startsWith('sk-or-'));

    const llmApiKey = isOpenRouter ? (openrouterApiKey || openaiApiKey) : openaiApiKey!;
    const llmUrl = isOpenRouter ? 'https://openrouter.ai/api/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions';
    const llmModelDefault = isOpenRouter ? 'o3-mini-high' : 'o3-mini-high';

    const { message, conversationId: rawConversationId, metadata } = await req.json();

    if (!message || typeof message !== 'string') throw new Error('Invalid message');

    let userId = metadata?.userId as string | undefined;

    if (!userId) {
      const authHeader = req.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const jwt = authHeader.replace('Bearer ', '');
        const { data: { user }, error } = await createClient(supabaseUrl, supabaseServiceKey).auth.getUser(jwt);
        if (!error && user?.id) userId = user.id;
      }
    }

    // ensure metadata object
    const cleanMetadata = { ...(metadata || {}), userId };

    // Determine if this response should use the higher-tier model
    const isFinal = metadata?.conversation_stage === 'resolution';
    const llmModel = isFinal ? 'o3' : llmModelDefault;

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    let conversationId: string | undefined = rawConversationId;

    // If a conversationId was supplied, make sure it still exists (it might have been cleaned up)
    if (conversationId) {
      const { data: convRow, error: convErr } = await supabaseClient
        .from('ai_conversations')
        .select('id')
        .eq('id', conversationId)
        .single();
      if (convErr || !convRow) {
        conversationId = undefined; // treat as new
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
        const { data: docs } = await supabaseClient.rpc('match_documents', {
          query_embedding: embedding,
          match_threshold: 0.5,
          match_count: 5,
        });
        if (docs && docs.length) {
          ragContext = (docs as any[]).map((d) => d.content).join('\n\n');
        }
      }
    } catch (_ragErr) {
      // Fail silently – RAG is best-effort and should never block the chat
    }

    const chatMessages = [
      {
        role: 'system',
        content:
          `You are Nex, an enterprise-grade AI business assistant embedded inside the Nexus platform.
Respond with a professional, concise tone focused on helping business users achieve productivity, strategy, and operational goals.
Address the user as "${userProfile.name}" once at the beginning of the conversation.
Reference the user's ongoing conversation and, where relevant, their company${userProfile.company ? ` (${userProfile.company})` : ''}.

${ragContext ? `Institutional knowledge that may help answer:\n${ragContext}` : ''}`,
      },
      ...summaryChunks.map((c) => ({ role: 'system', content: `[SUMMARY]\n${c}` })),
      ...(history ?? []).map((m) => ({ role: m.role, content: m.content })),
    ];

    const streaming = isStreamingRequest(req);

    // ---- Call OpenAI Chat Completion (stream or full)------------
    const openaiRes = await fetch(llmUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${llmApiKey}`,
      },
      body: JSON.stringify({
        model: llmModel,
        messages: chatMessages,
        temperature: 0.7,
        stream: streaming,
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      throw new Error(`OpenAI error: ${errText}`);
    }

    if (streaming && openaiRes.body) {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      const stream = new ReadableStream({
        async start(controller) {
          for await (const chunk of openaiRes.body!) {
            buffer += decoder.decode(chunk, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed) continue;
              if (trimmed.startsWith('data:')) {
                const data = trimmed.replace(/^data:\s*/, '');
                if (data === '[DONE]') {
                  controller.close();
                  // Persist full assistant message asynchronously (fire and forget)
                  (async () => {
                    try {
                      await supabaseClient.from('ai_messages').insert({
                        conversation_id: conversationId,
                        user_id: userId || null,
                        role: 'assistant',
                        content: fullContent,
                      });
                    } catch (_err) {/* ignore */}
                  })();
                  return;
                }
                try {
                  const json = JSON.parse(data);
                  const delta = json.choices?.[0]?.delta?.content;
                  if (delta) {
                    fullContent += delta;
                    controller.enqueue(encoder.encode(delta));
                  }
                } catch (_err) {
                  // ignore parse errors
                }
              }
            }
          }
        },
      });

      return new Response(stream, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store',
          'Transfer-Encoding': 'chunked',
          'x-conversation-id': conversationId,
        },
        status: 200,
      });
    }

    // ---- Non-stream response (existing behaviour) ---------------
    const openaiData = await openaiRes.json();
    const aiContent = openaiData.choices?.[0]?.message?.content?.trim() || 'I\'m sorry, I could not generate a response.';
    const confidence = openaiData.choices?.[0]?.finish_reason === 'stop' ? 0.95 : 0.7;

    // Persist assistant message
    await supabaseClient.from('ai_messages').insert({
      conversation_id: conversationId,
      user_id: userId || null,
      role: 'assistant',
      content: aiContent,
    });

    // Optional: action card stub
    await supabaseClient.from('ai_action_cards').insert({
      conversation_id: conversationId,
      title: 'Assistant reply',
      description: aiContent.slice(0, 140),
    });

    // Fire-and-forget summariser (runs if thresholds met)
    (async () => {
      try {
        await fetch(`${supabaseUrl}/functions/v1/ai_conversation_summariser`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId }),
        });
      } catch (_e) { /* ignore */ }
    })();

    return new Response(
      JSON.stringify({ conversationId, message: aiContent, confidence, success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-conversation-id': conversationId }, status: 200 },
    );
  } catch (error) {
    console.error('ai_chat error', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message, success: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});