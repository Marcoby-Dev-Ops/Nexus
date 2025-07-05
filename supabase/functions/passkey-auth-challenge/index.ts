import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';
import { generateAuthenticationOptions } from 'jsr:@simplewebauthn/server@13.1.1';
import { corsHeaders } from '../_shared/cors.ts';

interface RequestBody {
  userId?: string;
  email?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    let { userId, email } = (await req.json()) as RequestBody;
    if (!userId) {
      if (!email) throw new Error('`userId` or `email` is required');
      
      // Look up user by email using the new `listUsers` method
      const { data: { users }, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ email });
      if (listErr) throw listErr;
      if (!users || users.length === 0) throw new Error('User not found');
      userId = users[0].id;
    }

    // Fetch registered passkeys for allowCredentials
    const { data: passkeys, error: pkErr } = await supabaseAdmin
      .from('ai_passkeys')
      .select('credential_id, device_type')
      .eq('user_id', userId);
    if (pkErr) throw pkErr;

    const allowCredentials = (passkeys || []).map((pk) => ({
      id: pk.credential_id,
      type: 'public-key',
      // We omit transports to keep payload small; browser will match.
    }));

    const options = generateAuthenticationOptions({
      rpID: 'nexus.ai',
      userVerification: 'preferred',
      allowCredentials,
    });

    // Persist challenge for verification
    const { error: challengeErr } = await supabaseAdmin
      .from('ai_passkey_challenges')
      .upsert({ user_id: userId, challenge: options.challenge })
      .eq('user_id', userId);
    if (challengeErr) throw challengeErr;

    return new Response(JSON.stringify({ ...options, userId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
    );
  }
}); 