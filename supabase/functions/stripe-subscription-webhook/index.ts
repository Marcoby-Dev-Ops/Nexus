import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';
import { corsHeaders } from '../_shared/cors.ts';
import { getSecret } from '../_shared/getSecret.ts';

interface StripeEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
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

    // Get Stripe webhook secret
    const webhookSecret = await getSecret('stripe_webhook_secret');
    if (!webhookSecret) {
      throw new Error('Stripe webhook secret not configured');
    }

    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      throw new Error('Missing Stripe signature');
    }

    const body = await req.text();
    
    // Verify webhook signature
    const event = await verifyStripeSignature(body, signature, webhookSecret);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Processing Stripe webhook: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(supabase, event.data.object);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(supabase, event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(supabase, event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(supabase, event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(supabase, event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(supabase, event.data.object);
        break;

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(supabase, event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Log webhook event
    await supabase
      .from('ai_audit_logs')
      .insert({
        org_id: null, // Will be updated by handlers if applicable
        user_id: null,
        event_type: 'stripe_webhook_processed',
        details: {
          stripe_event_id: event.id,
          stripe_event_type: event.type,
          processed_at: new Date().toISOString()
        },
        created_at: new Date().toISOString()
      });

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Stripe webhook error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});

async function verifyStripeSignature(body: string, signature: string, secret: string): Promise<StripeEvent> {
  // Extract timestamp and signature from header
  const elements = signature.split(',');
  const timestamp = elements.find(e => e.startsWith('t='))?.split('=')[1];
  const sig = elements.find(e => e.startsWith('v1='))?.split('=')[1];

  if (!timestamp || !sig) {
    throw new Error('Invalid signature format');
  }

  // Create signature payload
  const payload = timestamp + '.' + body;
  
  // Compute expected signature
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature_bytes = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const expected_sig = Array.from(new Uint8Array(signature_bytes))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Compare signatures
  if (expected_sig !== sig) {
    throw new Error('Invalid signature');
  }

  // Check timestamp (prevent replay attacks)
  const webhookTimestamp = parseInt(timestamp) * 1000;
  const now = Date.now();
  const tolerance = 5 * 60 * 1000; // 5 minutes

  if (now - webhookTimestamp > tolerance) {
    throw new Error('Timestamp too old');
  }

  return JSON.parse(body);
}

async function handleCheckoutCompleted(supabase: any, session: any) {
  console.log('Processing checkout.session.completed', session.id);
  
  const userId = session.metadata?.user_id;
  const companyId = session.metadata?.company_id;

  if (!userId) {
    console.warn('No user_id in checkout session metadata');
    return;
  }

  // Update user profile with subscription start
  await supabase
    .from('user_profiles')
    .update({
      subscription_status: 'trialing',
      trial_started_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  // Log successful checkout
  await supabase
    .from('ai_audit_logs')
    .insert({
      org_id: companyId,
      user_id: userId,
      event_type: 'checkout_completed',
      details: {
        stripe_session_id: session.id,
        customer_id: session.customer,
        amount_total: session.amount_total,
        payment_status: session.payment_status
      },
      created_at: new Date().toISOString()
    });
}

async function handleSubscriptionCreated(supabase: any, subscription: any) {
  console.log('Processing customer.subscription.created', subscription.id);
  
  const userId = subscription.metadata?.user_id;
  const companyId = subscription.metadata?.company_id;
  const planType = subscription.metadata?.plan_type;

  if (!userId) {
    console.warn('No user_id in subscription metadata');
    return;
  }

  // Create or update subscription record
  const subscriptionData = {
    user_id: userId,
    company_id: companyId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer,
    status: subscription.status,
    plan_type: planType,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
    trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
    cancel_at_period_end: subscription.cancel_at_period_end,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  await supabase
    .from('subscriptions')
    .upsert(subscriptionData, { onConflict: 'stripe_subscription_id' });

  // Update user profile
  await supabase
    .from('user_profiles')
    .update({
      subscription_status: subscription.status,
      plan_type: planType,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);
}

async function handleSubscriptionUpdated(supabase: any, subscription: any) {
  console.log('Processing customer.subscription.updated', subscription.id);
  
  const userId = subscription.metadata?.user_id;
  const planType = subscription.metadata?.plan_type;

  // Update subscription record
  await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);

  // Update user profile if user_id is available
  if (userId) {
    await supabase
      .from('user_profiles')
      .update({
        subscription_status: subscription.status,
        plan_type: planType,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
  }
}

async function handleSubscriptionDeleted(supabase: any, subscription: any) {
  console.log('Processing customer.subscription.deleted', subscription.id);
  
  const userId = subscription.metadata?.user_id;

  // Update subscription record
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);

  // Update user profile if user_id is available
  if (userId) {
    await supabase
      .from('user_profiles')
      .update({
        subscription_status: 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
  }
}

async function handlePaymentSucceeded(supabase: any, invoice: any) {
  console.log('Processing invoice.payment_succeeded', invoice.id);
  
  const subscriptionId = invoice.subscription;
  
  if (subscriptionId) {
    // Update subscription with successful payment
    await supabase
      .from('subscriptions')
      .update({
        last_payment_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscriptionId);
  }
}

async function handlePaymentFailed(supabase: any, invoice: any) {
  console.log('Processing invoice.payment_failed', invoice.id);
  
  const subscriptionId = invoice.subscription;
  
  if (subscriptionId) {
    // Update subscription with failed payment
    await supabase
      .from('subscriptions')
      .update({
        payment_failed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscriptionId);

    // Log payment failure for follow-up
    await supabase
      .from('ai_audit_logs')
      .insert({
        org_id: null,
        user_id: null,
        event_type: 'payment_failed',
        details: {
          stripe_invoice_id: invoice.id,
          stripe_subscription_id: subscriptionId,
          amount_due: invoice.amount_due,
          attempt_count: invoice.attempt_count
        },
        created_at: new Date().toISOString()
      });
  }
}

async function handleTrialWillEnd(supabase: any, subscription: any) {
  console.log('Processing customer.subscription.trial_will_end', subscription.id);
  
  const userId = subscription.metadata?.user_id;
  const companyId = subscription.metadata?.company_id;

  // Log trial ending for follow-up campaigns
  await supabase
    .from('ai_audit_logs')
    .insert({
      org_id: companyId,
      user_id: userId,
      event_type: 'trial_will_end',
      details: {
        stripe_subscription_id: subscription.id,
        trial_end: new Date(subscription.trial_end * 1000).toISOString(),
        days_remaining: Math.ceil((subscription.trial_end * 1000 - Date.now()) / (1000 * 60 * 60 * 24))
      },
      created_at: new Date().toISOString()
    });
} 