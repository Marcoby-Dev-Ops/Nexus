import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';
import { corsHeaders } from '../_shared/cors.ts';

/*
 * Cron-driven worker (set in Supabase dashboard → Schedule = "0 2 * * *")
 * Rolls up yesterday's audit log events into ai_metrics_daily per org.
 * Currently tracks:
 *   – chat_message_sent
 *   – first_action
 */

serve(async (req) => {
  // Allow manual trigger via HTTP + handle CORS pre-flight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Yesterday range (UTC)
    const end = new Date();
    end.setUTCHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setUTCDate(end.getUTCDate() - 1);

    // Pull raw logs
    const { data: logs, error } = await supabase
      .from('ai_audit_logs')
      .select('user_id, action, details')
      .gte('created_at', start.toISOString())
      .lt('created_at', end.toISOString());
    if (error) throw error;

    // Aggregate
    const byUser: Record<string, { chat_messages: number; actions: number }> = {};
    (logs ?? []).forEach((row: any) => {
      const uid = row.user_id ?? 'unknown';
      if (!byUser[uid]) byUser[uid] = { chat_messages: 0, actions: 0 };
      if (row.action === 'chat_message_sent') byUser[uid].chat_messages += 1;
      if (row.action === 'first_action') byUser[uid].actions += 1;
    });

    // Upsert one row per user
    const inserts = Object.entries(byUser).map(([user_id, counts]) => ({
      user_id,
      date: start.toISOString().slice(0, 10), // YYYY-MM-DD
      chat_messages: counts.chat_messages,
      actions: counts.actions,
    }));

    if (inserts.length > 0) {
      const { error: insErr } = await supabase.from('ai_metrics_daily').upsert(inserts, { onConflict: 'user_id, date' });
      if (insErr) throw insErr;
    }

    return new Response(JSON.stringify({ processed: inserts.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    console.error('[ai_metrics_daily] error', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}); 