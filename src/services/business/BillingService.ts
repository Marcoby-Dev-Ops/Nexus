import { z } from 'zod';
import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import type { CrudServiceInterface, ServiceConfig } from '@/core/services/interfaces';
import { supabase } from '@/lib/supabase';
import { logger } from '@/shared/utils/logger.ts';

// Billing Plan Schema
export const BillingPlanSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  price: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  interval: z.enum(['monthly', 'yearly', 'one-time']),
  features: z.array(z.string()).optional(),
  is_active: z.boolean().default(true),
  max_users: z.number().positive().optional(),
  max_storage_gb: z.number().positive().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type BillingPlan = z.infer<typeof BillingPlanSchema>;

// Subscription Schema
export const SubscriptionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  company_id: z.string().uuid(),
  plan_id: z.string().uuid(),
  status: z.enum(['active', 'canceled', 'past_due', 'unpaid', 'trialing']),
  current_period_start: z.string().datetime(),
  current_period_end: z.string().datetime(),
  cancel_at_period_end: z.boolean().default(false),
  canceled_at: z.string().datetime().optional(),
  trial_start: z.string().datetime().optional(),
  trial_end: z.string().datetime().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Subscription = z.infer<typeof SubscriptionSchema>;

// Invoice Schema
export const InvoiceSchema = z.object({
  id: z.string().uuid(),
  subscription_id: z.string().uuid(),
  user_id: z.string().uuid(),
  company_id: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  status: z.enum(['draft', 'open', 'paid', 'uncollectible', 'void']),
  billing_reason: z.enum(['subscription_cycle', 'subscription_update', 'manual', 'upcoming']),
  hosted_invoice_url: z.string().url().optional(),
  invoice_pdf: z.string().url().optional(),
  due_date: z.string().datetime().optional(),
  paid_at: z.string().datetime().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Invoice = z.infer<typeof InvoiceSchema>;

// Payment Method Schema
export const PaymentMethodSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  company_id: z.string().uuid(),
  type: z.enum(['card', 'bank_account', 'paypal']),
  brand: z.string().optional(),
  last4: z.string().length(4).optional(),
  exp_month: z.number().min(1).max(12).optional(),
  exp_year: z.number().min(2020).optional(),
  is_default: z.boolean().default(false),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

// Billing Usage Schema
export const BillingUsageSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  company_id: z.string().uuid(),
  subscription_id: z.string().uuid(),
  metric: z.string(),
  quantity: z.number().nonnegative(),
  period_start: z.string().datetime(),
  period_end: z.string().datetime(),
  created_at: z.string().datetime(),
});

export type BillingUsage = z.infer<typeof BillingUsageSchema>;

// Billing Status Schema
export const BillingStatusSchema = z.object({
  hasActiveSubscription: z.boolean(),
  currentPlan: z.enum(['free', 'pro', 'enterprise']),
  subscriptionStatus: z.string().optional(),
  billingPeriodEnd: z.string().optional(),
  cancelAtPeriodEnd: z.boolean(),
});

// Usage Billing Schema
export const UsageBillingSchema = z.object({
  period: z.string(),
  totalMessages: z.number(),
  totalCost: z.number(),
  breakdown: z.object({
    free: z.number(),
    overageMessages: z.number(),
    overageCost: z.number(),
  }),
});

// Stripe Customer Schema
export const StripeCustomerSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().optional(),
  created: z.number(),
  livemode: z.boolean(),
});

// Stripe Subscription Schema
export const StripeSubscriptionSchema = z.object({
  id: z.string(),
  customer: z.string(),
  status: z.string(),
  current_period_end: z.number(),
  cancel_at_period_end: z.boolean(),
  items: z.object({
    data: z.array(z.object({
      price: z.object({
        id: z.string(),
      }),
    })),
  }),
});

export type BillingStatus = z.infer<typeof BillingStatusSchema>;
export type UsageBilling = z.infer<typeof UsageBillingSchema>;
export type StripeCustomer = z.infer<typeof StripeCustomerSchema>;
export type StripeSubscription = z.infer<typeof StripeSubscriptionSchema>;

// Service Configuration
const billingServiceConfig: ServiceConfig = {
  tableName: 'billing_plans', // Default table, will be overridden per operation
  schema: BillingPlanSchema,
  cacheEnabled: true,
  cacheTTL: 300, // 5 minutes
  enableLogging: true,
};

/**
 * BillingService - Handles all billing-related operations
 *
 * Features:
 * - Plan management (CRUD operations)
 * - Subscription management
 * - Invoice handling
 * - Payment method management
 * - Usage tracking
 * - Billing analytics
 * - Stripe integration
 * - Customer portal
 */
export class BillingService extends BaseService implements CrudServiceInterface<BillingPlan> {
  protected config = billingServiceConfig;

  private stripeConfig = {
    stripePublishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: import.meta.env.VITE_STRIPE_WEBHOOK_SECRET || '',
    products: {
      free: 'prod_SSpWGQ9Asuv8JL',
      pro: 'prod_SSpWPE3A7NWmd9',
      enterprise: 'prod_SSpW2AOu6axxoY'
    },
    prices: {
      free: 'price_1RY7qtRsVFqVQ7BisNs7B2vJ',
      pro: 'price_1RcuKcRsVFqVQ7Bi562UMbw6',
      enterprise: 'price_1RY7qFRsVFqVQ7Bicy9ySWyJ'
    },
    paymentLinks: {
      pro: 'https://buy.stripe.com/7sY7sNeAy0XrbIFd9e9R605',
      enterprise: 'https://buy.stripe.com/14A3cxbomcG93c94CI9R606'
    }
  };

  constructor() {
    super();
  }

  // CRUD Methods required by CrudServiceInterface
  async get(id: string): Promise<ServiceResponse<BillingPlan>> {
    this.logMethodCall('get', { id });
    return this.executeDbOperation(async () => {
      const { data, error } = await supabase
        .from(this.config.tableName)
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      const validatedData = this.config.schema.parse(data);
      return { data: validatedData, error: null };
    }, `get ${this.config.tableName} ${id}`);
  }

  async create(data: Partial<BillingPlan>): Promise<ServiceResponse<BillingPlan>> {
    this.logMethodCall('create', { data });
    return this.executeDbOperation(async () => {
      const { data: result, error } = await supabase
        .from(this.config.tableName)
        .insert({
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      if (error) throw error;
      const validatedData = this.config.schema.parse(result);
      return { data: validatedData, error: null };
    }, `create ${this.config.tableName}`);
  }

  async update(id: string, data: Partial<BillingPlan>): Promise<ServiceResponse<BillingPlan>> {
    this.logMethodCall('update', { id, data });
    return this.executeDbOperation(async () => {
      const { data: result, error } = await supabase
        .from(this.config.tableName)
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      const validatedData = this.config.schema.parse(result);
      return { data: validatedData, error: null };
    }, `update ${this.config.tableName} ${id}`);
  }

  async delete(id: string): Promise<ServiceResponse<boolean>> {
    this.logMethodCall('delete', { id });
    return this.executeDbOperation(async () => {
      const { error } = await supabase
        .from(this.config.tableName)
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { data: true, error: null };
    }, `delete ${this.config.tableName} ${id}`);
  }

  async list(filters?: Record<string, any>): Promise<ServiceResponse<BillingPlan[]>> {
    this.logMethodCall('list', { filters });
    return this.executeDbOperation(async () => {
      let query = supabase
        .from(this.config.tableName)
        .select('*');
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }
      const { data, error } = await query;
      if (error) throw error;
      const validatedData = data.map(item => this.config.schema.parse(item));
      return { data: validatedData, error: null };
    }, `list ${this.config.tableName}`);
  }

  // Subscription Management
  async getSubscription(subscriptionId: string) {
    this.config.tableName = 'subscriptions';
    this.config.schema = SubscriptionSchema;
    return this.get(subscriptionId);
  }

  async listSubscriptions(filters?: Record<string, any>) {
    this.config.tableName = 'subscriptions';
    this.config.schema = SubscriptionSchema;
    return this.list(filters);
  }

  async createSubscription(subscription: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>) {
    this.config.tableName = 'subscriptions';
    this.config.schema = SubscriptionSchema;
    return this.create(subscription);
  }

  async updateSubscription(subscriptionId: string, updates: Partial<Subscription>) {
    this.config.tableName = 'subscriptions';
    this.config.schema = SubscriptionSchema;
    return this.update(subscriptionId, updates);
  }

  async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean = true) {
    this.config.tableName = 'subscriptions';
    this.config.schema = SubscriptionSchema;
    return this.update(subscriptionId, {
      cancel_at_period_end: cancelAtPeriodEnd,
      canceled_at: cancelAtPeriodEnd ? new Date().toISOString() : undefined,
    });
  }

  // Invoice Management
  async getInvoice(invoiceId: string) {
    this.config.tableName = 'invoices';
    this.config.schema = InvoiceSchema;
    return this.get(invoiceId);
  }

  async listInvoices(filters?: Record<string, any>) {
    this.config.tableName = 'invoices';
    this.config.schema = InvoiceSchema;
    return this.list(filters);
  }

  async createInvoice(invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>) {
    this.config.tableName = 'invoices';
    this.config.schema = InvoiceSchema;
    return this.create(invoice);
  }

  // Payment Method Management
  async getPaymentMethod(paymentMethodId: string) {
    this.config.tableName = 'payment_methods';
    this.config.schema = PaymentMethodSchema;
    return this.get(paymentMethodId);
  }

  async listPaymentMethods(filters?: Record<string, any>) {
    this.config.tableName = 'payment_methods';
    this.config.schema = PaymentMethodSchema;
    return this.list(filters);
  }

  async createPaymentMethod(paymentMethod: Omit<PaymentMethod, 'id' | 'created_at' | 'updated_at'>) {
    this.config.tableName = 'payment_methods';
    this.config.schema = PaymentMethodSchema;
    return this.create(paymentMethod);
  }

  async updatePaymentMethod(paymentMethodId: string, updates: Partial<PaymentMethod>) {
    this.config.tableName = 'payment_methods';
    this.config.schema = PaymentMethodSchema;
    return this.update(paymentMethodId, updates);
  }

  async deletePaymentMethod(paymentMethodId: string) {
    this.config.tableName = 'payment_methods';
    this.config.schema = PaymentMethodSchema;
    return this.delete(paymentMethodId);
  }

  // Usage Tracking
  async getUsage(usageId: string) {
    this.config.tableName = 'billing_usage';
    this.config.schema = BillingUsageSchema;
    return this.get(usageId);
  }

  async listUsage(filters?: Record<string, any>) {
    this.config.tableName = 'billing_usage';
    this.config.schema = BillingUsageSchema;
    return this.list(filters);
  }

  async createUsage(usage: Omit<BillingUsage, 'id' | 'created_at'>) {
    this.config.tableName = 'billing_usage';
    this.config.schema = BillingUsageSchema;
    return this.create(usage);
  }

  // Billing Analytics
  async getBillingAnalytics(companyId: string, period: 'month' | 'quarter' | 'year' = 'month') {
    this.config.tableName = 'subscriptions';
    this.config.schema = SubscriptionSchema;
    
    const subscriptions = await this.list({ company_id: companyId });
    const invoices = await this.listInvoices({ company_id: companyId });
    
    // Calculate analytics
    const totalRevenue = invoices.data?.reduce((sum, invoice) => 
      invoice.status === 'paid' ? sum + invoice.amount : sum, 0) || 0;
    
    const activeSubscriptions = subscriptions.data?.filter(sub => 
      sub.status === 'active' || sub.status === 'trialing').length || 0;
    
    const churnRate = this.calculateChurnRate(subscriptions.data || []);
    
    return {
      data: {
        totalRevenue,
        activeSubscriptions,
        churnRate,
        period,
        currency: 'USD'
      },
      error: null,
      success: true
    };
  }

  private calculateChurnRate(subscriptions: Subscription[]): number {
    const totalSubscriptions = subscriptions.length;
    const canceledSubscriptions = subscriptions.filter(sub => 
      sub.status === 'canceled').length;
    
    return totalSubscriptions > 0 ? (canceledSubscriptions / totalSubscriptions) * 100 : 0;
  }

  // Webhook Handling
  async handleWebhook(event: string, data: any) {
    this.logMethodCall('handleWebhook', { event, data });
    
    switch (event) {
      case 'invoice.payment_succeeded':
        return this.handlePaymentSucceeded(data);
      case 'invoice.payment_failed':
        return this.handlePaymentFailed(data);
      case 'customer.subscription.updated':
        return this.handleSubscriptionUpdated(data);
      case 'customer.subscription.deleted':
        return this.handleSubscriptionDeleted(data);
      default:
        console.warn(`Unhandled webhook event: ${event}`);
        return { data: null, error: null, success: true };
    }
  }

  private async handlePaymentSucceeded(data: any) {
    // Update invoice status
    if (data.invoice?.id) {
      await this.updateInvoice(data.invoice.id, {
        status: 'paid',
        paid_at: new Date().toISOString()
      });
    }
    
    return { data: null, error: null, success: true };
  }

  private async handlePaymentFailed(data: any) {
    // Update invoice status
    if (data.invoice?.id) {
      await this.updateInvoice(data.invoice.id, {
        status: 'uncollectible'
      });
    }
    
    return { data: null, error: null, success: true };
  }

  private async handleSubscriptionUpdated(data: any) {
    // Update subscription
    if (data.subscription?.id) {
      await this.updateSubscription(data.subscription.id, {
        status: data.subscription.status,
        current_period_start: data.subscription.current_period_start,
        current_period_end: data.subscription.current_period_end,
        cancel_at_period_end: data.subscription.cancel_at_period_end
      });
    }
    
    return { data: null, error: null, success: true };
  }

  private async handleSubscriptionDeleted(data: any) {
    // Update subscription status
    if (data.subscription?.id) {
      await this.updateSubscription(data.subscription.id, {
        status: 'canceled',
        canceled_at: new Date().toISOString()
      });
    }
    
    return { data: null, error: null, success: true };
  }

  private async updateInvoice(invoiceId: string, updates: Partial<Invoice>) {
    this.config.tableName = 'invoices';
    this.config.schema = InvoiceSchema;
    return this.update(invoiceId, updates);
  }

  // Stripe Integration Methods
  async getBillingStatus(userId: string): Promise<BillingStatus> {
    this.logMethodCall('getBillingStatus', { userId });
    
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      // Get user's license info from Supabase
      const { data: userLicenses, error } = await supabase
        .from('user_licenses')
        .select('*')
        .eq('user_id', userId);
      
      const userLicense = userLicenses?.[0] || null;

      if (error && error.code !== 'PGRST116') {
        logger.error({ userId, error }, 'Failed to fetch user license');
        throw error;
      }

      // Default to free tier if no license found
      if (!userLicense) {
        logger.debug({ userId }, 'No license found, defaulting to free tier');
        return {
          hasActiveSubscription: false,
          currentPlan: 'free',
          subscriptionStatus: undefined,
          billingPeriodEnd: undefined,
          cancelAtPeriodEnd: false
        };
      }

      const currentPlan = userLicense.tier as 'free' | 'pro' | 'enterprise';
      
      // If it's a paid plan, get Stripe subscription details
      if (currentPlan !== 'free' && userLicense.stripe_subscription_id) {
        try {
          const subscription = await this.getStripeSubscription(userLicense.stripe_subscription_id);
          
          return {
            hasActiveSubscription: subscription.status === 'active',
            subscriptionStatus: subscription.status,
            currentPlan,
            billingPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
            cancelAtPeriodEnd: subscription.cancel_at_period_end
          };
        } catch (error) {
          logger.error({ userId, subscriptionId: userLicense.stripe_subscription_id, error }, 'Error fetching Stripe subscription');
          // Fallback to database info if Stripe call fails
        }
      }

      return {
        hasActiveSubscription: currentPlan !== 'free',
        currentPlan,
        subscriptionStatus: currentPlan !== 'free' ? 'active' : undefined,
        billingPeriodEnd: userLicense.expires_at ? new Date(userLicense.expires_at).toISOString() : undefined,
        cancelAtPeriodEnd: false
      };
    } catch (error) {
      logger.error({ userId, error }, 'Error getting billing status');
      // Return safe default
      return {
        hasActiveSubscription: false,
        currentPlan: 'free',
        subscriptionStatus: undefined,
        billingPeriodEnd: undefined,
        cancelAtPeriodEnd: false
      };
    }
  }

  async getOrCreateCustomer(userId: string, email: string, name?: string): Promise<StripeCustomer> {
    this.logMethodCall('getOrCreateCustomer', { userId, email });
    
    try {
      if (!userId || !email) {
        throw new Error('User ID and email are required');
      }

      // Check if customer already exists in our database
      const { data: existingCustomers, error: fetchError } = await supabase
        .from('user_licenses')
        .select('stripe_customer_id')
        .eq('user_id', userId);
      
      const existingCustomer = existingCustomers?.[0] || null;

      if (fetchError && fetchError.code !== 'PGRST116') {
        logger.error({ userId, error: fetchError }, 'Failed to fetch existing customer');
        throw fetchError;
      }

      if (existingCustomer?.stripe_customer_id) {
        // Fetch from Stripe to ensure it still exists
        try {
          const customer = await this.getCustomer(existingCustomer.stripe_customer_id);
          logger.debug({ userId, customerId: customer.id }, 'Found existing Stripe customer');
          return customer;
        } catch (error) {
          logger.warn({ userId, customerId: existingCustomer.stripe_customer_id, error }, 'Stripe customer not found, creating new one');
        }
      }

      // Create new customer via Supabase Edge Function
      const customer = await this.createCustomer(email, name);
      
      // Store customer ID in our database
      const { error: upsertError } = await supabase
        .from('user_licenses')
        .upsert({
          user_id: userId,
          stripe_customer_id: customer.id,
          tier: 'free',
          updated_at: new Date().toISOString()
        });

      if (upsertError) {
        logger.error({ userId, customerId: customer.id, error: upsertError }, 'Failed to store customer ID in database');
      } else {
        logger.debug({ userId, customerId: customer.id }, 'Successfully created and stored new Stripe customer');
      }

      return customer;
    } catch (error) {
      logger.error({ userId, email, error }, 'Error getting or creating customer');
      throw error;
    }
  }

  getPaymentLinks() {
    return {
      pro: this.stripeConfig.paymentLinks.pro,
      enterprise: this.stripeConfig.paymentLinks.enterprise
    };
  }

  async getUsageBilling(userId: string, period?: string): Promise<UsageBilling> {
    this.logMethodCall('getUsageBilling', { userId, period });
    
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      // Ensure period is in YYYY-MM format
      let startDate: string;
      if (period) {
        if (period === 'current') {
          startDate = new Date().toISOString().slice(0, 7);
        } else if (!/^\d{4}-\d{2}$/.test(period)) {
          throw new Error('Period must be in YYYY-MM format');
        } else {
          startDate = period;
        }
      } else {
        startDate = new Date().toISOString().slice(0, 7);
      }
      
      // Query with proper NULL handling for org_id
      const { data: usage, error } = await supabase
        .from('chat_usage_tracking')
        .select('*')
        .eq('user_id', userId)
        .is('org_id', null)
        .gte('date', `${startDate}-01`)
        .lt('date', this.getNextMonth(startDate));

      if (error) {
        logger.error({ userId, period, error }, 'Failed to fetch usage data');
        throw error;
      }

      const totalMessages = usage?.reduce((sum, day) => sum + (day.messages_sent || 0), 0) || 0;
      
      // Get user's current plan to calculate overage
      const billingStatus = await this.getBillingStatus(userId);
      const tier = billingStatus.currentPlan;
      
      const limits = {
        free: 20,
        pro: 500,
        enterprise: 2000
      };

      const dailyLimit = limits[tier];
      const monthlyLimit = dailyLimit * 30;
      
      const overageMessages = Math.max(0, totalMessages - monthlyLimit);
      const overageCost = overageMessages * 0.01; // $0.01 per overage message

      logger.debug({ 
        userId, 
        period, 
        totalMessages, 
        tier, 
        monthlyLimit, 
        overageMessages, 
        overageCost 
      }, 'Calculated usage billing');

      return {
        period: startDate,
        totalMessages,
        totalCost: overageCost,
        breakdown: {
          free: Math.min(totalMessages, monthlyLimit),
          overageMessages,
          overageCost
        }
      };
    } catch (error) {
      logger.error({ userId, period, error }, 'Error getting usage billing');
      return {
        period: period || new Date().toISOString().slice(0, 7),
        totalMessages: 0,
        totalCost: 0,
        breakdown: {
          free: 0,
          overageMessages: 0,
          overageCost: 0
        }
      };
    }
  }

  async handleSubscriptionChange(subscriptionId: string): Promise<void> {
    this.logMethodCall('handleSubscriptionChange', { subscriptionId });
    
    try {
      if (!subscriptionId) {
        throw new Error('Subscription ID is required');
      }

              const subscription = await this.getStripeSubscription(subscriptionId);
      
      // Determine tier based on price ID
      let tier: 'free' | 'pro' | 'enterprise' = 'free';
      if (subscription.items.data[0]?.price.id === this.stripeConfig.prices.pro) {
        tier = 'pro';
      } else if (subscription.items.data[0]?.price.id === this.stripeConfig.prices.enterprise) {
        tier = 'enterprise';
      }

      logger.info({ 
        subscriptionId, 
        tier, 
        status: subscription.status, 
        customerId: subscription.customer 
      }, 'Processing subscription change');

      // Update user license in database
      const { error } = await supabase
        .from('user_licenses')
        .update({
          tier,
          stripe_subscription_id: subscriptionId,
          subscription_status: subscription.status,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('stripe_customer_id', subscription.customer);

      if (error) {
        logger.error({ subscriptionId, error }, 'Error updating user license');
        throw error;
      }

      logger.info({ subscriptionId, tier }, 'Successfully updated user license');
    } catch (error) {
      logger.error({ subscriptionId, error }, 'Error handling subscription change');
      throw error;
    }
  }

  async cancelSubscriptionViaStripe(subscriptionId: string): Promise<void> {
    this.logMethodCall('cancelSubscriptionViaStripe', { subscriptionId });
    
    try {
      if (!subscriptionId) {
        throw new Error('Subscription ID is required');
      }

      logger.info({ subscriptionId }, 'Canceling subscription via Stripe');
      await this.callStripeEdgeFunction('cancel_subscription', {
        subscription: subscriptionId
      });
      logger.info({ subscriptionId }, 'Successfully canceled subscription via Stripe');
    } catch (error) {
      logger.error({ subscriptionId, error }, 'Error canceling subscription via Stripe');
      throw error;
    }
  }

  async reactivateSubscription(subscriptionId: string): Promise<void> {
    this.logMethodCall('reactivateSubscription', { subscriptionId });
    
    try {
      if (!subscriptionId) {
        throw new Error('Subscription ID is required');
      }

      logger.info({ subscriptionId }, 'Reactivating subscription');
      await this.callStripeEdgeFunction('update_subscription', {
        subscription: subscriptionId,
        cancelat_period_end: false
      });
      logger.info({ subscriptionId }, 'Successfully reactivated subscription');
    } catch (error) {
      logger.error({ subscriptionId, error }, 'Error reactivating subscription');
      throw error;
    }
  }

  async createCustomerPortalSession(userId: string, returnUrl?: string): Promise<{ portalUrl: string }> {
    this.logMethodCall('createCustomerPortalSession', { userId });
    
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      logger.info({ userId }, 'Creating customer portal session');
      const { data, error } = await supabase.functions.invoke('stripe-customer-portal', {
        body: {
          userId,
          returnUrl: returnUrl || `${window.location.origin}/settings/billing`
        }
      });

      if (error) {
        logger.error({ userId, error }, 'Customer portal creation failed');
        throw new Error(`Customer portal creation failed: ${error.message}`);
      }

      logger.info({ userId }, 'Successfully created customer portal session');
      return {
        portalUrl: data.data.portalUrl
      };
    } catch (error) {
      logger.error({ userId, error }, 'Error creating customer portal session');
      throw error;
    }
  }

  // Private helper methods
  private async createCustomer(email: string, name?: string): Promise<StripeCustomer> {
    return this.callStripeEdgeFunction('create_customer', { email, name });
  }

  private async getCustomer(customerId: string): Promise<StripeCustomer> {
    return this.callStripeEdgeFunction('get_customer', { customer: customerId });
  }

  private async getStripeSubscription(subscriptionId: string): Promise<StripeSubscription> {
    return this.callStripeEdgeFunction('get_subscription', { subscription: subscriptionId });
  }

  private async callStripeEdgeFunction(action: string, data: any): Promise<any> {
    try {
      const { data: result, error } = await supabase.functions.invoke('stripe-billing', {
        body: { action, ...data }
      });

      if (error) {
        logger.error({ action, data, error }, 'Stripe edge function call failed');
        throw new Error(`Stripe ${action} failed: ${error.message}`);
      }

      return result;
    } catch (error) {
      logger.error({ action, data, error }, 'Error calling Stripe edge function');
      throw error;
    }
  }

  private getNextMonth(yearMonth: string): string {
    try {
      const [year, month] = yearMonth.split('-').map(Number);
      
      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        throw new Error(`Invalid year-month format: ${yearMonth}`);
      }
      
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      
      return `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;
    } catch (error) {
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return nextMonth.toISOString().slice(0, 10);
    }
  }
}

// Export singleton instance
export const billingService = new BillingService(); 
