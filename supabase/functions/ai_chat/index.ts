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
              user_id: metadata?.userId || null,
              title: message.slice(0, 64) || 'Untitled',
              ai_messages: {
                data: [
                  {
                    user_id: metadata?.userId || null,
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
              user_id: metadata?.userId || null,
              title: message.slice(0, 64) || 'Untitled',
            })
            .select('id')
            .single();
          if (convErr) throw convErr;
          conversationId = convData.id;
        }

        const { error: msgErr } = await supabaseClient.from('ai_messages').insert({
          conversation_id: conversationId,
          user_id: metadata?.userId || null,
          role: 'user',
          content: message,
        });
        if (msgErr) throw msgErr;
      }
    } else {
      // ---- Persist USER message --------------------------------------------
      const { error } = await supabaseClient.from('ai_messages').insert({
        conversation_id: conversationId,
        user_id: metadata?.userId || null,
        role: 'user',
        content: message,
      });
      if (error) throw error;
    }

    // ---- (Optional) Audit Log ------------------------------------------------
    await supabaseClient.from('ai_audit_logs').insert({
      user_id: metadata?.userId || null,
      action: 'insert',
      table_name: 'ai_messages',
      record_id: conversationId,
      details: { role: 'user' },
    });

    // ---- Fetch user profile for personalisation ----------------------------
    let userProfile = { name: 'there', company: undefined };
    if (metadata?.userId) {
      try {
        userProfile = await getProfile(supabaseClient, metadata.userId);
      } catch (_err) {
        // keep default profile on failure
      }
    }

    // ---- Fetch recent conversation context ----------------------------------
    const { data: history, error: historyErr } = await supabaseClient
      .from('ai_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(20);

    if (historyErr) throw historyErr;

    const chatMessages = [
      {
        role: 'system',
        content:
          `You are Nex, an enterprise-grade AI business assistant embedded inside the Nexus platform.
Respond with a professional, concise tone focused on helping business users achieve productivity, strategy, and operational goals.
Address the user as "${userProfile.name}" once at the beginning of the conversation.
Reference the user's ongoing conversation and, where relevant, their company${userProfile.company ? ` (${userProfile.company})` : ''}.`,
      },
      ...(history ?? []).map((m) => ({ role: m.role, content: m.content })),
    ];

    // ---- Call OpenAI Chat Completion ----------------------------------------
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
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      throw new Error(`OpenAI error: ${errText}`);
    }

    const openaiData = await openaiRes.json();
    const aiContent = openaiData.choices?.[0]?.message?.content?.trim() || 'I\'m sorry, I could not generate a response.';
    const confidence = openaiData.choices?.[0]?.finish_reason === 'stop' ? 0.95 : 0.7;

    // ---- Persist ASSISTANT message ------------------------------------------
    await supabaseClient.from('ai_messages').insert({
      conversation_id: conversationId,
      user_id: metadata?.userId || null,
      role: 'assistant',
      content: aiContent,
    });

    // ---- Optional: create action card stub ----------------------------------
    await supabaseClient.from('ai_action_cards').insert({
      conversation_id: conversationId,
      title: 'Assistant reply',
      description: aiContent.slice(0, 140),
    });

    return new Response(
      JSON.stringify({ conversationId, message: aiContent, confidence, success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('ai_chat error', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message, success: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});