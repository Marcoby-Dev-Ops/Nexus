import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { code, state } = await req.json();
    if (!code || !state) {
      return new Response(JSON.stringify({ error: 'Missing code or state' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Get env vars
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const redirectUri = Deno.env.get('GOOGLE_REDIRECT_URI');
    if (!clientId || !clientSecret || !redirectUri) {
      return new Response(JSON.stringify({ error: 'Missing Google OAuth env vars' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      return new Response(JSON.stringify({ error: 'Token exchange failed', details: err }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    const tokenData = await tokenRes.json();
    const { access_token, refresh_token, id_token, expires_in } = tokenData;

    // Get user profile
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!profileRes.ok) {
      const err = await profileRes.text();
      return new Response(JSON.stringify({ error: 'Profile fetch failed', details: err }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    const profile = await profileRes.json();

    // Upsert into oauth_tokens (pseudo-code, replace with your DB logic)
    // You may need to use Supabase client or direct SQL here
    // Example:
    // await supabase.from('oauth_tokens').upsert({
    //   user_id: state.user_id,
    //   provider: 'google',
    //   access_token, refresh_token, id_token, expires_in,
    //   profile_id: profile.id, email: profile.email, name: profile.name, picture: profile.picture
    // });

    // For now, just return the tokens and profile
    return new Response(JSON.stringify({
      success: true,
      tokens: { access_token, refresh_token, id_token, expires_in },
      profile,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}); 