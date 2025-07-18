export interface StripeCustomer {
  id: string;
  email: string;
  name?: string;
  created: number;
  metadata: Record<string, string>;
}

export interface StripePrice {
  id: string;
  product: string;
  unit_amount: number;
  currency: string;
  type: 'one_time' | 'recurring';
  recurring?: {
    interval: 'month' | 'year' | 'week' | 'day';
    interval_count: number;
  };
  active: boolean;
}

export interface StripeProduct {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  default_price?: string;
  metadata: Record<string, string>;
}

export interface StripeSubscription {
  id: string;
  customer: string;
  status: 'active' | 'past_due' | 'unpaid' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'trialing';
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  items: {
    data: Array<{
      id: string;
      price: StripePrice;
      quantity: number;
    }>;
  };
  metadata: Record<string, string>;
}

export interface PaymentLink {
  id: string;
  url: string;
  active: boolean;
  metadata: Record<string, string>;
}

export interface BillingConfig {
  stripePublishableKey: string;
  webhookSecret: string;
  products: {
    free: string;
    pro: string;
    enterprise: string;
  };
  prices: {
    free: string;
    pro: string;
    enterprise: string;
  };
  paymentLinks: {
    pro: string;
    enterprise: string;
  };
}

export interface BillingStatus {
  hasActiveSubscription: boolean;
  subscriptionStatus?: StripeSubscription['status'];
  currentPlan: 'free' | 'pro' | 'enterprise';
  billingPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  paymentMethod?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
}

export interface UsageBilling {
  period: string;
  totalMessages: number;
  totalCost: number;
  breakdown: {
    free: number;
    overageMessages: number;
    overageCost: number;
  };
} 