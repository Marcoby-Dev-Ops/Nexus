import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StripeConfig {
  secretKey: string;
  webhookSecret: string;
}

const getStripeConfig = (): StripeConfig => {
  const secretKey = Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY environment variable is required');
  }
  
  return { secretKey, webhookSecret: webhookSecret || '' };
};

const callStripeAPI = async (endpoint: string, options: RequestInit = {}) => {
  const config = getStripeConfig();
  
  const response = await fetch(`https://api.stripe.com/v1/${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${config.secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Stripe API error: ${response.status} ${error}`);
  }

  return response.json();
};

const createCustomer = async (email: string, name?: string) => {
  const params = new URLSearchParams({ email });
  if (name) params.append('name', name);

  return callStripeAPI('customers', {
    method: 'POST',
    body: params,
  });
};

const getCustomer = async (customerId: string) => {
  return callStripeAPI(`customers/${customerId}`);
};

const listCustomers = async (email?: string, limit?: number) => {
  const params = new URLSearchParams();
  if (email) params.append('email', email);
  if (limit) params.append('limit', limit.toString());

  return callStripeAPI(`customers?${params}`);
};

const createSubscription = async (customerId: string, priceId: string, metadata?: Record<string, string>) => {
  const params = new URLSearchParams({
    customer: customerId,
    'items[0][price]': priceId,
  });

  if (metadata) {
    Object.entries(metadata).forEach(([key, value]) => {
      params.append(`metadata[${key}]`, value);
    });
  }

  return callStripeAPI('subscriptions', {
    method: 'POST',
    body: params,
  });
};

const getSubscription = async (subscriptionId: string) => {
  return callStripeAPI(`subscriptions/${subscriptionId}`);
};

const updateSubscription = async (subscriptionId: string, updates: Record<string, any>) => {
  const params = new URLSearchParams();
  
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      params.append(key, value.toString());
    }
  });

  return callStripeAPI(`subscriptions/${subscriptionId}`, {
    method: 'POST',
    body: params,
  });
};

const cancelSubscription = async (subscriptionId: string) => {
  return callStripeAPI(`subscriptions/${subscriptionId}`, {
    method: 'DELETE',
  });
};

const listSubscriptions = async (customerId?: string, status?: string, limit?: number) => {
  const params = new URLSearchParams();
  if (customerId) params.append('customer', customerId);
  if (status) params.append('status', status);
  if (limit) params.append('limit', limit.toString());

  return callStripeAPI(`subscriptions?${params}`);
};

const createPaymentIntent = async (amount: number, currency: string, customerId?: string) => {
  const params = new URLSearchParams({
    amount: amount.toString(),
    currency,
  });
  
  if (customerId) params.append('customer', customerId);

  return callStripeAPI('payment_intents', {
    method: 'POST',
    body: params,
  });
};

const listPaymentIntents = async (customerId?: string, limit?: number) => {
  const params = new URLSearchParams();
  if (customerId) params.append('customer', customerId);
  if (limit) params.append('limit', limit.toString());

  return callStripeAPI(`payment_intents?${params}`);
};

const createInvoice = async (customerId: string, daysUntilDue?: number) => {
  const params = new URLSearchParams({ customer: customerId });
  if (daysUntilDue) params.append('days_until_due', daysUntilDue.toString());

  return callStripeAPI('invoices', {
    method: 'POST',
    body: params,
  });
};

const verifyWebhookSignature = async (body: string, signature: string, webhookSecret: string) => {
  if (!webhookSecret) {
    throw new Error('Webhook secret not configured');
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(webhookSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const sigElements = signature.split(',');
  const timestamp = sigElements.find(el => el.startsWith('t='))?.substring(2);
  const expectedSig = sigElements.find(el => el.startsWith('v1='))?.substring(3);

  if (!timestamp || !expectedSig) {
    throw new Error('Invalid signature format');
  }

  const payload = `${timestamp}.${body}`;
  const payloadBuffer = encoder.encode(payload);
  const expectedSigBuffer = new Uint8Array(Buffer.from(expectedSig, 'hex'));

  const isValid = await crypto.subtle.verify('HMAC', key, expectedSigBuffer, payloadBuffer);
  
  if (!isValid) {
    throw new Error('Invalid webhook signature');
  }

  // Check timestamp to prevent replay attacks (5 minutes tolerance)
  const timestampMs = parseInt(timestamp) * 1000;
  const now = Date.now();
  const tolerance = 5 * 60 * 1000; // 5 minutes
  
  if (Math.abs(now - timestampMs) > tolerance) {
    throw new Error('Webhook timestamp too old');
  }

  return JSON.parse(body);
};

const handleWebhook = async (request: Request) => {
  const signature = request.headers.get('stripe-signature');
  const body = await request.text();
  
  if (!signature) {
    throw new Error('Missing stripe-signature header');
  }

  // Initialize Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get webhook secret and verify signature
  const config = getStripeConfig();
  const event = await verifyWebhookSignature(body, signature, config.webhookSecret);

  console.log(`Processing webhook event: ${event.type} - ${event.id}`);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      
      // Handle successful checkout - useful for waitlist conversions
      console.log(`Checkout completed for customer ${session.customer}`);
      
      // If this is a subscription, the subscription events will handle license updates
      if (session.mode === 'payment') {
        // Handle one-time payments if needed
        const { error } = await supabase
          .from('payments')
          .insert({
            stripe_payment_intent_id: session.payment_intent,
            stripe_customer_id: session.customer,
            amount: session.amount_total,
            currency: session.currency,
            status: 'succeeded',
            metadata: session.metadata,
            created_at: new Date().toISOString(),
          });

        if (error) {
          console.error('Error recording payment:', error);
        }
      }
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      
      // Determine tier based on price ID
      let tier = 'free';
      const priceId = subscription.items?.data[0]?.price?.id;
      
      if (priceId === 'price_1RXtraRsVFqVQ7Biya1sIQZI') {
        tier = 'pro';
      } else if (priceId === 'price_1RXtraRsVFqVQ7BikUOc02TQ') {
        tier = 'enterprise';
      }

      // Update user license
      const { error } = await supabase
        .from('user_licenses')
        .upsert({
          stripe_customer_id: subscription.customer,
          stripe_subscription_id: subscription.id,
          tier,
          subscription_status: subscription.status,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error updating user license:', error);
      }

      // Log subscription changes
      console.log(`Subscription ${event.type}: ${subscription.id} for customer ${subscription.customer} - Status: ${subscription.status}`);
      break;
    }
    
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object;
      
      // Update payment status and send success notifications
      console.log(`Payment succeeded for customer ${invoice.customer}, amount: ${invoice.amount_paid / 100} ${invoice.currency}`);
      
      // Record successful payment
      const { error } = await supabase
        .from('billing_events')
        .insert({
          stripe_customer_id: invoice.customer,
          stripe_invoice_id: invoice.id,
          event_type: 'payment_succeeded',
          amount: invoice.amount_paid,
          currency: invoice.currency,
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error recording billing event:', error);
      }
      break;
    }
    
    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      
      // Handle failed payment - send notifications, update status
      console.log(`Payment failed for customer ${invoice.customer}, invoice: ${invoice.id}`);
      
      // Record failed payment
      const { error } = await supabase
        .from('billing_events')
        .insert({
          stripe_customer_id: invoice.customer,
          stripe_invoice_id: invoice.id,
          event_type: 'payment_failed',
          amount: invoice.amount_due,
          currency: invoice.currency,
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error recording billing event:', error);
      }
      break;
    }

    case 'customer.created': {
      const customer = event.data.object;
      
      // Sync customer data
      console.log(`New customer created: ${customer.id} - ${customer.email}`);
      break;
    }

    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      
      // Handle successful one-time payments
      console.log(`Payment intent succeeded: ${paymentIntent.id} for customer ${paymentIntent.customer}`);
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Handle webhook
    if (req.method === 'POST' && req.headers.get('stripe-signature')) {
      return await handleWebhook(req);
    }

    // Handle API calls
    if (req.method === 'POST') {
      const { action, ...data } = await req.json();

      let result;
      
      switch (action) {
        case 'create_customer':
          result = await createCustomer(data.email, data.name);
          break;
          
        case 'get_customer':
          result = await getCustomer(data.customer);
          break;
          
        case 'list_customers':
          result = await listCustomers(data.email, data.limit);
          break;
          
        case 'create_subscription':
          result = await createSubscription(data.customer, data.price, data.metadata);
          break;
          
        case 'get_subscription':
          result = await getSubscription(data.subscription);
          break;
          
        case 'update_subscription':
          result = await updateSubscription(data.subscription, data);
          break;
          
        case 'cancel_subscription':
          result = await cancelSubscription(data.subscription);
          break;
          
        case 'list_subscriptions':
          result = await listSubscriptions(data.customer, data.status, data.limit);
          break;
          
        case 'create_payment_intent':
          result = await createPaymentIntent(data.amount, data.currency, data.customer);
          break;
          
        case 'list_payment_intents':
          result = await listPaymentIntents(data.customer, data.limit);
          break;
          
        case 'create_invoice':
          result = await createInvoice(data.customer, data.days_until_due);
          break;
          
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders 
    });
    
  } catch (error) {
    console.error('Stripe billing function error:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 