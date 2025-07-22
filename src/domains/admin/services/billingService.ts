import { supabase } from '@/core/supabase';
import { logger } from '@/core/auth/logger';
import type { 
  BillingStatus, 
  StripeCustomer, 
  StripeSubscription,
  UsageBilling,
  BillingConfig 
} from '@/core/types/billing';
import type { UserLicense } from '@/core/types/licensing';

class BillingService {
  private config: BillingConfig = {
    stripePublishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: import.meta.env.VITE_STRIPE_WEBHOOK_SECRET || '',
    products: {
      free: 'prod_SSpWGQ9Asuv8JL',
      pro: 'prod_SSpWPE3A7NWmd9',
      enterprise: 'prod_SSpW2AOu6axxoY'
    },
    prices: {
      free: 'price_1RY7qtRsVFqVQ7BisNs7B2vJ',        // $0/month recurring
      pro: 'price_1RcuKcRsVFqVQ7Bi562UMbw6',         // $29/month recurring (NEWLY CREATED)
      enterprise: 'price_1RY7qFRsVFqVQ7Bicy9ySWyJ'   // $99/month recurring
    },
    paymentLinks: {
      pro: 'https://buy.stripe.com/7sY7sNeAy0XrbIFd9e9R605',
      enterprise: 'https://buy.stripe.com/14A3cxbomcG93c94CI9R606'
    }
  };

  /**
   * Validate configuration
   */
  private validateConfig(): void {
    if (!this.config.stripePublishableKey) {
      logger.warn('Stripe publishable key not configured');
    }
    if (!this.config.webhookSecret) {
      logger.warn('Stripe webhook secret not configured');
    }
  }

  /**
   * Get billing status for a user
   */
  async getBillingStatus(userId: string): Promise<BillingStatus> {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      // First, get user's license info from Supabase with proper NULL handling
      const { data: userLicense, error } = await supabase
        .from('user_licenses')
        .select('*')
        .eq('user_id', userId)
        .is('org_id', null)
        .single();

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
          const subscription = await this.getSubscription(userLicense.stripe_subscription_id);
          
          return {
            hasActiveSubscription: subscription.status === 'active',
            subscriptionStatus: subscription.status,
            currentPlan,
            billingPeriodEnd: new Date(subscription.current_period_end * 1000),
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
        billingPeriodEnd: userLicense.expires_at ? new Date(userLicense.expires_at) : undefined,
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

  /**
   * Get or create Stripe customer for a user
   */
  async getOrCreateCustomer(userId: string, email: string, name?: string): Promise<StripeCustomer> {
    try {
      if (!userId || !email) {
        throw new Error('User ID and email are required');
      }

      // Check if customer already exists in our database with proper NULL handling
      const { data: existingCustomer, error: fetchError } = await supabase
        .from('user_licenses')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .is('org_id', null)
        .single();

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
          org_id: null,
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

  /**
   * Get payment links for upgrading plans
   */
  getPaymentLinks() {
    return {
      pro: this.config.paymentLinks.pro,
      enterprise: this.config.paymentLinks.enterprise
    };
  }

  /**
   * Get usage billing information
   */
  async getUsageBilling(userId: string, period?: string): Promise<UsageBilling> {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const startDate = period || new Date().toISOString().slice(0, 7); // YYYY-MM format
      
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

      const totalMessages = usage?.reduce((sum, day) => sum + (day.message_count || 0), 0) || 0;
      
      // Get user's current plan to calculate overage
      const billingStatus = await this.getBillingStatus(userId);
      const tier = billingStatus.currentPlan;
      
      const limits = {
        free: 20,
        pro: 500,
        enterprise: 2000
      };

      const dailyLimit = limits[tier];
      const monthlyLimit = dailyLimit * 30; // Approximate
      
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

  /**
   * Handle subscription status change from webhook
   */
  async handleSubscriptionChange(subscriptionId: string): Promise<void> {
    try {
      if (!subscriptionId) {
        throw new Error('Subscription ID is required');
      }

      const subscription = await this.getSubscription(subscriptionId);
      
      // Determine tier based on price ID
      let tier: UserLicense['tier'] = 'free';
      if (subscription.items.data[0]?.price.id === this.config.prices.pro) {
        tier = 'pro';
      } else if (subscription.items.data[0]?.price.id === this.config.prices.enterprise) {
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

  /**
   * Cancel subscription at period end
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      if (!subscriptionId) {
        throw new Error('Subscription ID is required');
      }

      logger.info({ subscriptionId }, 'Canceling subscription');
      await this.callStripeEdgeFunction('cancel_subscription', {
        subscription: subscriptionId
      });
      logger.info({ subscriptionId }, 'Successfully canceled subscription');
    } catch (error) {
      logger.error({ subscriptionId, error }, 'Error canceling subscription');
      throw error;
    }
  }

  /**
   * Reactivate canceled subscription
   */
  async reactivateSubscription(subscriptionId: string): Promise<void> {
    try {
      if (!subscriptionId) {
        throw new Error('Subscription ID is required');
      }

      logger.info({ subscriptionId }, 'Reactivating subscription');
      await this.callStripeEdgeFunction('update_subscription', {
        subscription: subscriptionId,
        cancel_at_period_end: false
      });
      logger.info({ subscriptionId }, 'Successfully reactivated subscription');
    } catch (error) {
      logger.error({ subscriptionId, error }, 'Error reactivating subscription');
      throw error;
    }
  }

  /**
   * Create Stripe customer portal session for self-service billing
   */
  async createCustomerPortalSession(userId: string, returnUrl?: string): Promise<{ portalUrl: string }> {
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

  private async getSubscription(subscriptionId: string): Promise<StripeSubscription> {
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
    const [year, month] = yearMonth.split('-').map(Number);
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    return `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;
  }

  /**
   * Initialize the billing service
   */
  initialize(): void {
    this.validateConfig();
    logger.info('Billing service initialized');
  }
}

export const billingService = new BillingService(); 