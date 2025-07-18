import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { thought_ids, merge_data, user_id } = await req.json();
    if (!Array.isArray(thought_ids) || thought_ids.length < 2) {
      return new Response(JSON.stringify({ error: 'At least two thought_ids required' }), { status: 400 });
    }
    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id required' }), { status: 400 });
    }

    // Fetch all thoughts to merge
    const { data: thoughts, error: fetchError } = await supabase
      .from('thoughts')
      .select('*')
      .in('id', thought_ids);
    if (fetchError || !thoughts || thoughts.length < 2) {
      return new Response(JSON.stringify({ error: 'Could not fetch thoughts to merge' }), { status: 404 });
    }

    // Merge logic: combine content, tags, relationships, etc.
    // For now, just concatenate content and merge tags as an example
    const mergedContent = thoughts.map((t: any) => t.content).join('\n---\n');
    const mergedTags = Array.from(new Set(thoughts.flatMap((t: any) => t.main_sub_categories || [])));
    const mergedAIInsights = Object.assign({}, ...thoughts.map((t: any) => t.ai_insights || {}));

    // Use merge_data to override/extend merged fields
    const mergedThought = {
      ...thoughts[0], // Use the first as base
      ...merge_data,
      content: merge_data?.content || mergedContent,
      main_sub_categories: merge_data?.main_sub_categories || mergedTags,
      ai_insights: merge_data?.ai_insights || mergedAIInsights,
      updated_by: user_id,
      last_updated: new Date().toISOString(),
    };

    // Insert merged thought
    const { data: inserted, error: insertError } = await supabase
      .from('thoughts')
      .insert([mergedThought])
      .select()
      .single();
    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), { status: 500 });
    }

    // Optionally: delete old thoughts (except the merged one)
    const idsToDelete = thoughts.map((t: any) => t.id).filter((id: string) => id !== inserted.id);
    if (idsToDelete.length > 0) {
      await supabase.from('thoughts').delete().in('id', idsToDelete);
    }

    return new Response(JSON.stringify({ merged: inserted }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
});
