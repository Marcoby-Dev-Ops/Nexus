import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';
import { generateRegistrationOptions } from 'jsr:@simplewebauthn/server@13.1.1';
import { isoUint8Array, isoBase64URL } from 'jsr:@simplewebauthn/server@13.1.1/helpers';
import { corsHeaders } from './cors.ts';

interface RequestBody {
  userId?: string;
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
    const { userId, friendlyName } = body;

    if (!userId) {
      throw new Error('`userId` is required');
    }

    // -------------------------------------------------------------------
    // Build passkey registration options using WebAuthn specs
    // -------------------------------------------------------------------
    const options = generateRegistrationOptions({
      rpName: 'Nexus',
      rpID: 'nexus.ai',
      userID: isoUint8Array.fromUTF8String(userId),
      userName: userId,
      userDisplayName: friendlyName || userId,
      supportedAlgorithmIDs: [-7, -257],
      attestationType: 'none',
      authenticatorSelection: {
        userVerification: 'preferred',
      },
    });

    console.log('Generated registration options');

    // -----------------------------------------------------------------
    // Persist challenge for later verification
    // -----------------------------------------------------------------
    const challengeB64 =
      typeof options.challenge === 'string'
        ? options.challenge
        : isoBase64URL.fromBuffer(options.challenge as Uint8Array);

    const { error: upsertError } = await supabaseAdmin
      .from('ai_passkey_challenges')
      .upsert({ user_id: userId, challenge: challengeB64 })
      .eq('user_id', userId);

    if (upsertError) throw upsertError;

    // -----------------------------------------------------------------
    // Return a JSON-safe version of the options (all strings)
    // -----------------------------------------------------------------
    const userIdB64 = options.user?.id
      ? isoBase64URL.fromBuffer(options.user.id as Uint8Array)
      : isoBase64URL.fromBuffer(isoUint8Array.fromUTF8String(userId));

    const safeOptions = {
      ...options,
      challenge: challengeB64,
      user: {
        id: userIdB64,
        name: options.user?.name ?? userId,
        displayName: options.user?.displayName ?? friendlyName ?? userId,
      },
      pubKeyCredParams: options.pubKeyCredParams || [
        { alg: -7, type: 'public-key' },
        { alg: -257, type: 'public-key' }
      ],
      timeout: options.timeout || 60000,
      attestation: options.attestation || 'none',
      authenticatorSelection: options.authenticatorSelection || {
        userVerification: 'preferred'
      },
      rp: options.rp || {
        name: 'Nexus',
        id: 'nexus.ai'
      }
    };

    return new Response(JSON.stringify(safeOptions), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('register-challenge error', error);
    return new Response(JSON.stringify({ error: (error as Error).message ?? 'unknown error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
}); 