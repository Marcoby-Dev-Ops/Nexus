import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface SupabaseAuthWebhook {
  type: string;
  record: any; // auth.users row
  old_record: any;
}

serve(async (req) => {
  // CORS pre-flight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: SupabaseAuthWebhook | { user_id?: string } | any = await req.json().catch(() => ({}));

    // Initialise service client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Resolve the user row
    let user = (body as SupabaseAuthWebhook).record;
    if (!user) {
      const userId = body.user_id;
      if (!userId) {
        return new Response(JSON.stringify({ error: 'No user provided' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }
      const { data: fetched, error } = await supabase.auth.admin.getUserById(userId);
      if (error || !fetched) {
        return new Response(JSON.stringify({ error: error?.message || 'User not found' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        });
      }
      user = fetched;
    }

    const provider = user?.app_metadata?.provider ?? 'email';
    const profile: Record<string, any> = { 
      id: user.id,
      user_id: user.id // Set user_id to match id
    };

    // Enrichment based on provider
    if (provider === 'azure' && user.provider_token) {
      try {
        const graph = await fetch('https://graph.microsoft.com/v1.0/me', {
          headers: { Authorization: `Bearer ${user.provider_token}` },
        });
        if (graph.ok) {
          const me = await graph.json();
          profile.full_name = me.displayName ?? user.user_metadata?.full_name ?? null;
          profile.email = me.mail || me.userPrincipalName || user.email;
          profile.job_title = me.jobTitle ?? null;
          profile.avatar_url = me.userPrincipalName
            ? `https://avatar.vercel.sh/${encodeURIComponent(me.userPrincipalName)}`
            : null;
        }
      } catch (_err) {
        // Ignore Graph errors – fallback below
      }
    }

    // Fallback enrichment for non-OAuth or failure cases
    if (!profile.full_name) {
      // Try to get full_name from user metadata first
      const metadataFullName = user.user_metadata?.full_name;
      if (metadataFullName) {
        profile.full_name = metadataFullName;
      } else {
        // Fallback to email username if no full_name in metadata
        profile.full_name = user.email?.split('@')[0] ?? 'User';
      }
    }
    if (!profile.email) profile.email = user.email;

    // Upsert into public.user_profiles (align with frontend queries)
    await supabase.from('user_profiles').upsert(profile, { onConflict: 'id' });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}); 