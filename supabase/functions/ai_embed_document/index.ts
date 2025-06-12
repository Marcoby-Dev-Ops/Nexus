import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiApiKey = Deno.env.get('AI_OPENAI_API_KEY');

    if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
      throw new Error('Missing required environment variables');
    }

    const { documentId, content, metadata } = await req.json();
    if (!documentId || !content) {
      throw new Error('Invalid payload');
    }

    // ---- Embedding Cache ----------------------------------------------------
    const encoder = new TextEncoder();
    const data = encoder.encode(content.trim().toLowerCase());
    const digest = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(digest));
    const checksum = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: cachedRow } = await supabaseClient
      .from('ai_embedding_cache')
      .select('embedding')
      .eq('checksum', checksum)
      .single();

    let embedding: number[] | null = cachedRow?.embedding || null;

    if (!embedding) {
      const embedRes = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: 'text-embedding-3-small', input: content }),
      });
      if (!embedRes.ok) throw new Error(`Embedding API error: ${embedRes.status}`);
      const embedJson = await embedRes.json();
      embedding = embedJson.data?.[0]?.embedding;
      if (!embedding) throw new Error('Failed to generate embedding');

      await supabaseClient
        .from('ai_embedding_cache')
        .insert({ checksum, content, embedding })
        .select('id');
    }

    // Persist vector document
    const { error } = await supabaseClient
      .from('ai_vector_documents')
      .insert({ document_id: documentId, content, content_embedding: embedding, metadata });
    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message, success: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}); 