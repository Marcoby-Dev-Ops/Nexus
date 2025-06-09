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

  // Parse webhook event (simplified - in production you'd verify signature)
  const event = JSON.parse(body);

  switch (event.type) {
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
      break;
    }
    
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object;
      
      // Log successful payment
      console.log(`Payment succeeded for customer ${invoice.customer}`);
      break;
    }
    
    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      
      // Handle failed payment
      console.log(`Payment failed for customer ${invoice.customer}`);
      break;
    }
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