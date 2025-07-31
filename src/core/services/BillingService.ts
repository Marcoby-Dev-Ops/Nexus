import { z } from 'zod';
import { UnifiedService } from './UnifiedService';
import { ServiceConfig } from './interfaces';

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
 */
export class BillingService extends UnifiedService<BillingPlan> {
  protected config = billingServiceConfig;

  // Plan Management
  async getPlan(planId: string) {
    return this.get(planId);
  }

  async listPlans(filters?: Record<string, any>) {
    return this.list(filters);
  }

  async createPlan(plan: Omit<BillingPlan, 'id' | 'created_at' | 'updated_at'>) {
    return this.create(plan);
  }

  async updatePlan(planId: string, updates: Partial<BillingPlan>) {
    return this.update(planId, updates);
  }

  async deletePlan(planId: string) {
    return this.delete(planId);
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
}

// Create and export service instance
export const billingService = new BillingService(); 