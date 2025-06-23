import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';
import { corsHeaders } from '../_shared/cors.ts';
import { getSecret } from '../_shared/getSecret.ts';

interface CheckoutRequest {
  priceId: string;
  userId: string;
  planType: 'pro' | 'enterprise';
  billingCycle: 'month' | 'year';
  trialDays?: number;
  successUrl?: string;
  cancelUrl?: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
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

    // Get Stripe secret key
    const stripeSecretKey = await getSecret('stripe_secret_key');
    if (!stripeSecretKey) {
      throw new Error('Stripe secret key not configured');
    }

    const {
      priceId,
      userId,
      planType,
      billingCycle,
      trialDays = 14,
      successUrl,
      cancelUrl,
      customerEmail,
      metadata = {}
    } = await req.json() as CheckoutRequest;

    if (!priceId || !userId || !planType) {
      throw new Error('Missing required fields: priceId, userId, planType');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user profile and company info
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*, companies(*)')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile) {
      throw new Error('User profile not found');
    }

    // Check if user already has an active subscription
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (existingSubscription) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'User already has an active subscription'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // Prepare Stripe customer data
    let stripeCustomerId = userProfile.stripe_customer_id;

    if (!stripeCustomerId) {
      // Create Stripe customer
      const customerData = {
        email: customerEmail || userProfile.email,
        name: userProfile.display_name || `${userProfile.first_name} ${userProfile.last_name}`.trim(),
        metadata: {
          user_id: userId,
          company_id: userProfile.company_id || '',
          plan_type: planType,
          source: 'nexus_app'
        }
      };

      const customerResponse = await createStripeCustomer(stripeSecretKey, customerData);
      stripeCustomerId = customerResponse.id;

      // Save Stripe customer ID to user profile
      await supabase
        .from('user_profiles')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', userId);
    }

    // Prepare checkout session data
    const baseUrl = new URL(req.url).origin;
    const checkoutData = {
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: successUrl || `${baseUrl}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${baseUrl}/pricing?checkout=cancelled`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      subscription_data: {
        trial_period_days: trialDays,
        metadata: {
          user_id: userId,
          company_id: userProfile.company_id || '',
          plan_type: planType,
          billing_cycle: billingCycle,
          source: 'nexus_pricing_page',
          ...metadata
        }
      },
      metadata: {
        user_id: userId,
        company_id: userProfile.company_id || '',
        plan_type: planType,
        billing_cycle: billingCycle
      }
    };

    // Create Stripe checkout session
    const session = await createStripeCheckoutSession(stripeSecretKey, checkoutData);

    // Log checkout session creation
    await supabase
      .from('ai_audit_logs')
      .insert({
        org_id: userProfile.company_id,
        user_id: userId,
        event_type: 'checkout_session_created',
        details: {
          stripe_session_id: session.id,
          plan_type: planType,
          billing_cycle: billingCycle,
          trial_days: trialDays,
          amount: session.amount_total
        },
        created_at: new Date().toISOString()
      });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          sessionId: session.id,
          checkoutUrl: session.url,
          customer: stripeCustomerId,
          planType,
          billingCycle,
          trialDays
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Stripe checkout session error:', error);
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

async function createStripeCustomer(apiKey: string, customerData: any) {
  const response = await fetch('https://api.stripe.com/v1/customers', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      email: customerData.email,
      name: customerData.name,
      'metadata[user_id]': customerData.metadata.user_id,
      'metadata[company_id]': customerData.metadata.company_id,
      'metadata[plan_type]': customerData.metadata.plan_type,
      'metadata[source]': customerData.metadata.source
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Stripe customer creation failed: ${error}`);
  }

  return response.json();
}

async function createStripeCheckoutSession(apiKey: string, sessionData: any) {
  const params = new URLSearchParams({
    'payment_method_types[0]': 'card',
    customer: sessionData.customer,
    'line_items[0][price]': sessionData.line_items[0].price,
    'line_items[0][quantity]': sessionData.line_items[0].quantity.toString(),
    mode: sessionData.mode,
    success_url: sessionData.success_url,
    cancel_url: sessionData.cancel_url,
    allow_promotion_codes: sessionData.allow_promotion_codes.toString(),
    billing_address_collection: sessionData.billing_address_collection,
    'subscription_data[trial_period_days]': sessionData.subscription_data.trial_period_days.toString(),
    'metadata[user_id]': sessionData.metadata.user_id,
    'metadata[company_id]': sessionData.metadata.company_id,
    'metadata[plan_type]': sessionData.metadata.plan_type,
    'metadata[billing_cycle]': sessionData.metadata.billing_cycle
  });

  // Add subscription metadata
  Object.entries(sessionData.subscription_data.metadata).forEach(([key, value]) => {
    params.append(`subscription_data[metadata][${key}]`, value as string);
  });

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Stripe checkout session creation failed: ${error}`);
  }

  return response.json();
} 