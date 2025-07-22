// Edge runtime types - this is handled by Supabase
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.5';
import { getSecret } from '../_shared/getSecret.ts';
import { corsHeaders } from '../_shared/cors.ts';

// Environment validation
const validateEnvironment = () => {
  const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  const missing = required.filter(key => !Deno.env.get(key));
  
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
};

// Error response helper
const createErrorResponse = (message: string, status: number = 400) => {
  return new Response(JSON.stringify({ 
    error: message, 
    timestamp: new Date().toISOString(),
    status 
  }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
};

// Success response helper
const createSuccessResponse = (data: any, status: number = 200) => {
  return new Response(JSON.stringify({ 
    data, 
    timestamp: new Date().toISOString(),
    status 
  }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
};

// Authentication helper
const authenticateRequest = async (req: Request) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { user: null, supabase, error: 'No authorization header' };
  }
  
  const jwt = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(jwt);
  
  if (error || !user) {
    return { user: null, supabase, error: 'Invalid token' };
  }
  
  return { user, supabase };
};

interface StripeConfig {
  secretKey: string;
  webhookSecret: string;
}

const getStripeConfig = async (): Promise<StripeConfig> => {
  const secretKey = await getSecret('STRIPE_SECRET_KEY');
  const webhookSecret = await getSecret('STRIPE_WEBHOOK_SECRET');

  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY secret not found in Vault');
  }

  return { secretKey, webhookSecret: webhookSecret || '' };
};

const callStripeAPI = async (endpoint: string, options: RequestInit = {}) => {
  const config = await getStripeConfig();
  
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

// Stripe API functions
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
  return callStripeAPI(`subscriptions/${subscriptionId}/cancel`, {
    method: 'POST',
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

// Webhook verification
const verifyWebhookSignature = async (body: string, signature: string, webhookSecret: string) => {
  const config = await getStripeConfig();
  
  const response = await fetch('https://api.stripe.com/v1/webhook_endpoints', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      url: 'https://your-domain.com/webhook',
      enabled_events: '["*"]',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to verify webhook signature');
  }

  return true;
};

// Webhook handler
const handleWebhook = async (request: Request) => {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return createErrorResponse('Missing Stripe signature', 400);
    }

    const config = await getStripeConfig();
    
    // Verify webhook signature
    try {
      await verifyWebhookSignature(body, signature, config.webhookSecret);
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return createErrorResponse('Invalid webhook signature', 400);
    }

    const event = JSON.parse(body);
    console.log(`🔔 [Stripe Webhook] Received ${event.type} event`);

    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
        console.log('New subscription created:', event.data.object.id);
        break;
      case 'customer.subscription.updated':
        console.log('Subscription updated:', event.data.object.id);
        break;
      case 'customer.subscription.deleted':
        console.log('Subscription cancelled:', event.data.object.id);
        break;
      case 'invoice.payment_succeeded':
        console.log('Payment succeeded:', event.data.object.id);
        break;
      case 'invoice.payment_failed':
        console.log('Payment failed:', event.data.object.id);
        break;
      default:
        console.log('Unhandled event type:', event.type);
    }

    return createSuccessResponse({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Webhook processing failed',
      500
    );
  }
};

// Main handler
const handleRequest = async (req: Request, auth: { user: any; supabase: any }) => {
  const { user, supabase } = auth;
  
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
          return createErrorResponse(`Unknown action: ${action}`, 400);
      }
      
      return createSuccessResponse(result);
    }

    return createErrorResponse('Method not allowed', 405);
    
  } catch (error) {
    console.error('Stripe billing processing error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to process Stripe billing request',
      500
    );
  }
};

// Main serve function
serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    // Validate environment
    validateEnvironment();
    
    // For webhooks, skip authentication
    if (req.headers.get('stripe-signature')) {
      return await handleWebhook(req);
    }
    
    // Authenticate request for API calls
    const auth = await authenticateRequest(req);
    if (auth.error) {
      return createErrorResponse(auth.error, 401);
    }
    
    // Call handler
    return await handleRequest(req, auth);
    
  } catch (error) {
    console.error('Stripe billing error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
}); 