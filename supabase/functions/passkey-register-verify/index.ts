import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';
import { verifyRegistrationResponse } from 'jsr:@simplewebauthn/server@13.1.1';
import { corsHeaders } from '../_shared/cors.ts';

interface RequestBody {
  userId?: string;
  attestationResponse?: any;
  friendlyName?: string;
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

    const body: RequestBody = await req.json();
    const { userId, attestationResponse, friendlyName } = body;

    if (!userId || !attestationResponse) {
      throw new Error('`userId` and `attestationResponse` are required');
    }

    // Retrieve stored challenge
    const { data: challengeRow, error: challengeErr } = await supabaseAdmin
      .from('ai_passkey_challenges')
      .select('challenge')
      .eq('user_id', userId)
      .single();

    if (challengeErr || !challengeRow) {
      throw new Error('Registration challenge not found');
    }

    // -------------------------------------------------------------------
    // Verify the registration response
    // -------------------------------------------------------------------
    const verification = await verifyRegistrationResponse({
      response: attestationResponse,
      expectedChallenge: challengeRow.challenge,
      expectedOrigin: 'https://app.nexus.ai',
      expectedRPID: 'nexus.ai',
    });

    if (!verification.verified || !verification.registrationInfo) {
      throw new Error('Passkey registration verification failed');
    }

    const { credentialPublicKey, credentialID, counter } = verification.registrationInfo;

    // Persist passkey record
    const { error: insertErr } = await supabaseAdmin.from('ai_passkeys').insert({
      credential_id: credentialID,
      user_id: userId,
      public_key: credentialPublicKey,
      counter,
      device_type: 'multi_device',
      friendly_name: friendlyName ?? null,
    });

    if (insertErr) throw insertErr;

    // Clean up challenge row
    await supabaseAdmin.from('ai_passkey_challenges').delete().eq('user_id', userId);

    return new Response(JSON.stringify({ verified: true }), {
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