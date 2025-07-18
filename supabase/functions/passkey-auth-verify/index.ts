import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';
import { verifyAuthenticationResponse } from 'jsr:@simplewebauthn/server@13.1.1';
import { corsHeaders } from '../_shared/cors.ts';

interface RequestBody {
  userId?: string;
  assertionResponse?: any;
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

    const { userId, assertionResponse } = (await req.json()) as RequestBody;
    if (!userId || !assertionResponse) throw new Error('`userId` and `assertionResponse` are required');

    // Retrieve challenge
    const { data: challRow, error: challErr } = await supabaseAdmin
      .from('ai_passkey_challenges')
      .select('challenge')
      .eq('user_id', userId)
      .single();
    if (challErr || !challRow) throw new Error('Challenge not found');

    // Fetch passkeys to find matching credentialID for signature counter
    const { data: passkeys, error: pkErr } = await supabaseAdmin
      .from('ai_passkeys')
      .select('credential_id, public_key, counter')
      .eq('user_id', userId);
    if (pkErr) throw pkErr;

    const cred = (passkeys || []).find((p) => p.credential_id === assertionResponse.id);
    if (!cred) throw new Error('Passkey not found');

    const verification = await verifyAuthenticationResponse({
      response: assertionResponse,
      expectedChallenge: challRow.challenge,
      expectedOrigin: 'https://app.nexus.ai',
      expectedRPID: 'nexus.ai',
      authenticator: {
        credentialID: cred.credential_id,
        credentialPublicKey: cred.public_key,
        counter: cred.counter || 0,
      },
    });

    if (!verification.verified) {
      return new Response(JSON.stringify({ verified: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Update counter
    const { authenticationInfo } = verification;
    if (authenticationInfo?.newCounter !== undefined) {
      await supabaseAdmin
        .from('ai_passkeys')
        .update({ counter: authenticationInfo.newCounter })
        .eq('credential_id', cred.credential_id);
    }

    // Clean up challenge
    await supabaseAdmin.from('ai_passkey_challenges').delete().eq('user_id', userId);

    // Get user data for session establishment
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (userError || !userData.user) {
      throw new Error('User not found');
    }

    // Generate a one-time sign-in token for the user
    const { data: tokenData, error: tokenError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: userData.user.email!,
    });

    if (tokenError || !tokenData) {
      console.error('Failed to generate magic link:', tokenError);
      // Fallback: just return verification success
      return new Response(JSON.stringify({ 
        verified: true,
        user: { id: userId, email: userData.user.email }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Extract the access token from the magic link URL
    const url = new URL(tokenData.properties.action_link);
    const accessToken = url.searchParams.get('access_token');
    const refreshToken = url.searchParams.get('refresh_token');

    return new Response(JSON.stringify({ 
      verified: true,
      user: { id: userId, email: userData.user.email },
      access_token: accessToken,
      refresh_token: refreshToken
    }), {
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