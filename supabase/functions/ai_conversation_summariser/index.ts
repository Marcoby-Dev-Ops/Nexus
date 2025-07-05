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

    // === New: Fetch all assessment questions to guide extraction ===
    const { data: assessmentQuestions, error: questionsError } = await sb
      .from('AssessmentQuestion')
      .select('id, prompt, target_field, action_type');
    
    if (questionsError) {
      // Log the error but don't block the summarization process
      console.error("Error fetching assessment questions:", questionsError.message);
    }

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
        model: 'gpt-4o-mini',
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

    // === New: Dynamically build extraction prompt from assessment questions ===
    const profileFieldsToExtract = (assessmentQuestions || [])
      .filter(q => q.action_type === 'UPDATE_PROFILE' && q.target_field)
      .map(q => `* "${q.target_field}": (Description: ${q.prompt})`);

    const legacyFields = ['tagline', 'mission_statement', 'vision_statement', 'motto'];
    const allFieldsToExtract = [...new Set([...legacyFields, ...profileFieldsToExtract.map(f => f.split('"')[1])])];

    const extractPrompt = `From the conversation transcript, extract values for the following fields. Return a single JSON object with keys for ONLY the fields you find confident values for. If none, return empty JSON. Do NOT wrap in markdown.

Fields to extract:
${allFieldsToExtract.map(f => `- ${f}`).join('\n')}

Transcript:
${transcript}`;

    const extractRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You extract structured data.' },
          { role: 'user', content: extractPrompt },
        ],
        max_tokens: 120,
        temperature: 0,
      }),
    });

    let extracted: Record<string, string> = {};
    if (extractRes.ok) {
      try {
        const exJson = await extractRes.json();
        const raw = exJson.choices?.[0]?.message?.content?.trim();
        extracted = raw ? JSON.parse(raw) : {};
      } catch (_) {
        extracted = {};
      }
    }

    // Upsert if we have extracted fields
    if (Object.keys(extracted).length) {
      // Identify company via first user in conversation -> user_profiles
      const { data: firstMsg } = await sb
        .from('ai_messages')
        .select('user_id')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (firstMsg?.user_id) {
        const { data: prof } = await sb
          .from('user_profiles')
          .select('company_id')
          .eq('id', firstMsg.user_id)
          .single();

        if (prof?.company_id) {
          // Separate data for different tables
          const companyProfileUpdates: Record<string, any> = {};
          const aiProfileUpdates: Record<string, any> = {};
          const assessmentResponsesToUpsert: any[] = [];

          for (const key in extracted) {
            const question = (assessmentQuestions || []).find(q => q.target_field === key);
            if (question) {
              companyProfileUpdates[key] = extracted[key];
              assessmentResponsesToUpsert.push({
                company_id: prof.company_id,
                question_id: question.id,
                user_id: firstMsg.user_id,
                value: String(extracted[key]),
                // We let the DB trigger calculate the score
              });
            } else if (legacyFields.includes(key)) {
              aiProfileUpdates[key] = extracted[key];
            }
          }

          // Perform updates
          if (Object.keys(companyProfileUpdates).length > 0) {
            await sb.from('Company').update(companyProfileUpdates).eq('id', prof.company_id);
          }
          if (Object.keys(aiProfileUpdates).length > 0) {
            await sb.from('ai_company_profiles').upsert({ company_id: prof.company_id, ...aiProfileUpdates });
          }
          if (assessmentResponsesToUpsert.length > 0) {
            await sb.from('AssessmentResponse').upsert(assessmentResponsesToUpsert, { onConflict: 'company_id, question_id' });
          }

          // Determine which fields are still missing for action cards
          const neededFields: [string, string][] = [
            ['mission_statement', 'define-mission'],
            ['vision_statement', 'define-vision'],
            ['tagline', 'define-mission'],
            ['value_proposition', 'define-value-proposition'],
            ['goals', 'set-goals']
          ];

          const { data: profileRow } = await sb
            .from('ai_company_profiles')
            .select('*')
            .eq('company_id', prof.company_id)
            .single();

          for (const [field, templateSlug] of neededFields) {
            if (!profileRow?.[field]) {
              // Check if card already exists for this conversation & template
              const { count } = await sb
                .from('ai_action_cards')
                .select('id', { count: 'exact', head: true })
                .eq('conversation_id', conversationId)
                .contains('metadata', { field });

              if (!count || count === 0) {
                // Fetch template
                const { data: template } = await sb
                  .from('ai_action_card_templates')
                  .select('*')
                  .eq('slug', templateSlug)
                  .single();

                if (template) {
                  await sb.from('ai_action_cards').insert({
                    conversation_id: conversationId,
                    title: template.title,
                    description: template.description,
                    actions: template.template_data->'actions',
                    metadata: { field, template_slug: templateSlug }
                  });
                }
              }
            }
          }

          // Fire embedding function asynchronously
          fetch(`${supabaseUrl}/functions/v1/ai_embed_company_profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseServiceKey}` },
            body: JSON.stringify({ company_id: prof.company_id })
          }).catch(() => {});
        }
      }
    }

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