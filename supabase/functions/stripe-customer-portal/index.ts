import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';
import { corsHeaders } from '../_shared/cors.ts';
import { getSecret } from '../_shared/getSecret.ts';

interface PortalRequest {
  userId: string;
  returnUrl?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    // Get Stripe secret key
    const stripeSecretKey = await getSecret('stripe_secret_key');
    if (!stripeSecretKey) {
      throw new Error('Stripe secret key not configured');
    }

    const { userId, returnUrl } = await req.json() as PortalRequest;

    if (!userId) {
      throw new Error('Missing required field: userId');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user profile with Stripe customer ID
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*, subscriptions(*)')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile) {
      throw new Error('User profile not found');
    }

    if (!userProfile.stripe_customer_id) {
      throw new Error('User does not have a Stripe customer ID. Please create a subscription first.');
    }

    // Prepare return URL
    const baseUrl = new URL(req.url).origin;
    const portalReturnUrl = returnUrl || `${baseUrl}/settings/billing`;

    // Create Stripe customer portal session
    const portalSession = await createStripePortalSession(
      stripeSecretKey,
      userProfile.stripe_customer_id,
      portalReturnUrl
    );

    // Log portal session creation
    await supabase
      .from('ai_audit_logs')
      .insert({
        org_id: userProfile.company_id,
        user_id: userId,
        event_type: 'customer_portal_accessed',
        details: {
          stripe_customer_id: userProfile.stripe_customer_id,
          portal_session_id: portalSession.id,
          return_url: portalReturnUrl,
          has_active_subscription: userProfile.subscriptions?.length > 0
        },
        created_at: new Date().toISOString()
      });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          portalUrl: portalSession.url,
          customerId: userProfile.stripe_customer_id,
          returnUrl: portalReturnUrl
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Stripe customer portal error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

async function createStripePortalSession(apiKey: string, customerId: string, returnUrl: string) {
  const response = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      customer: customerId,
      return_url: returnUrl
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Stripe portal session creation failed: ${error}`);
  }

  return response.json();
} 