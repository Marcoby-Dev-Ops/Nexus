import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase env vars');
    }
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { email, password } = await req.json();
    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Missing email or password' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user exists
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      email,
    });
    if (listError) throw listError;
    const user = users?.users?.[0];

    if (user) {
      // User exists, reset password
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password,
      });
      if (updateError) throw updateError;
      return new Response(JSON.stringify({ success: true, action: 'reset', userId: user.id }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // User does not exist, create
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (createError) throw createError;
      return new Response(JSON.stringify({ success: true, action: 'created', userId: newUser.user?.id }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 