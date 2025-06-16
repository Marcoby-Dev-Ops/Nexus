import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

interface Payload { conversationId: string }

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { status: 200 });
    }

    const { conversationId } = await req.json() as Payload;
    if (!conversationId) throw new Error('conversationId required');

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
      throw new Error('Missing env');
    }

    const sb = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch conversation row (to get current summary_chunks)
    const { data: conv, error: convErr } = await sb
      .from('ai_conversations')
      .select('id, summary_chunks')
      .eq('id', conversationId)
      .single();
    if (convErr || !conv) throw convErr || new Error('Conversation not found');

    const existingChunks: unknown[] = conv.summary_chunks || [];

    // Count total messages in conversation
    const { count: totalMessages, error: countErr } = await sb
      .from('ai_messages')
      .select('id', { count: 'exact', head: true })
      .eq('conversation_id', conversationId);
    if (countErr) throw countErr;

    const expectedChunks = Math.floor((totalMessages || 0) / 20);
    if (expectedChunks <= existingChunks.length) {
      return new Response(JSON.stringify({ skipped: true }), { status: 200 });
    }

    // Need to summarise last 20 messages
    const { data: msgs, error: msgsErr } = await sb
      .from('ai_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (msgsErr) throw msgsErr;

    const transcript = msgs!.reverse().map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');

    const prompt = `Summarise the following business conversation segment in <=150 tokens, focusing on facts, decisions, and open questions.\n\n${transcript}`;

    const openRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'o3-mini-high',
        messages: [
          { role: 'system', content: 'You are a helpful summariser.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 180,
        temperature: 0.4,
      }),
    });

    if (!openRes.ok) {
      const txt = await openRes.text();
      throw new Error(`OpenAI error ${txt}`);
    }

    const openJson = await openRes.json();
    const summary = openJson.choices?.[0]?.message?.content?.trim();
    if (!summary) throw new Error('No summary');

    const newChunks = [...existingChunks, summary];
    const { error: updErr } = await sb
      .from('ai_conversations')
      .update({ summary_chunks: newChunks })
      .eq('id', conversationId);
    if (updErr) throw updErr;

    return new Response(JSON.stringify({ summary, success: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500 });
  }
}); 