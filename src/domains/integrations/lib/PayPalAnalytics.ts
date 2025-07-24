/**
 * PayPal Analytics Service
 * Provides access to PayPal transaction data for insights and analysis
 */

export interface PayPalTransaction {
  id: string;
  transactiontype: string;
  status: string;
  amount: {
    currencycode: string;
    value: string;
  };
  payee: {
    emailaddress: string;
    merchantid: string;
  };
  payer: {
    emailaddress: string;
    payerid: string;
    name: {
      givenname: string;
      surname: string;
    };
  };
  time: string;
  custom_id?: string;
  description?: string;
  paypal_fee?: {
    currencycode: string;
    value: string;
  };
  exchange_rate?: string;
  transaction_id?: string;
  order_id?: string;
  payment_id?: string;
}

export interface PayPalAnalyticsData {
  totalRevenue: number;
  totalTransactions: number;
  averageTransactionValue: number;
  currencyBreakdown: Record<string, number>;
  transactionTypeBreakdown: Record<string, number>;
  statusBreakdown: Record<string, number>;
  recentTransactions: PayPalTransaction[];
  periodStart: string;
  periodEnd: string;
}

export interface PayPalAnalyticsSummary {
  period: string;
  revenue: number;
  transactions: number;
  averageValue: number;
  currency: string;
}

export class PayPalAnalyticsService {
  private baseUrl: string;
  private clientId: string;
  private clientSecret: string;
  private supabase: any;

  constructor() {
    this.baseUrl = import.meta.env.VITE_PAYPAL_ENV === 'live'
      ? 'https: //api.paypal.com'
      : 'https://api.sandbox.paypal.com';
    this.clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
    this.clientSecret = import.meta.env.VITE_PAYPAL_CLIENT_SECRET;
  }

  private async initializeSupabase() {
    if (!this.supabase) {
      const { supabase } = await import('@/core/supabase');
      this.supabase = supabase;
    }
    return this.supabase;
  }

  private async getAccessToken(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${this.clientId}:${this.clientSecret}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new Error(`Failed to get access token: ${response.status}`);
    }

    const data = await response.json();
    return data.access_token;
  }

  async fetchTransactions(startDate: string, endDate: string): Promise<PayPalTransaction[]> {
    const accessToken = await this.getAccessToken();
    
    const response = await fetch(
      `${this.baseUrl}/v1/reporting/transactions?start_date=${startDate}&end_date=${endDate}&fields=transaction_info,payer_info,shipping_info,auction_info,incentive_info,store_info`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch transactions: ${response.status}`);
    }

    const data = await response.json();
    return data.transaction_details || [];
  }

  async storeTransactions(transactions: PayPalTransaction[], userId: string, integrationId: string): Promise<void> {
    const supabase = await this.initializeSupabase();
    
    const transactionData = transactions.map(tx => ({
      userid: userId,
      integrationid: integrationId,
      paypaltransaction_id: tx.id,
      paypalorder_id: tx.order_id,
      paypalpayment_id: tx.payment_id,
      transactiontype: tx.transaction_type,
      status: tx.status,
      amount: parseFloat(tx.amount.value),
      currency: tx.amount.currency_code,
      description: tx.description,
      payeremail: tx.payer?.email_address,
      payername: tx.payer?.name ? `${tx.payer.name.given_name} ${tx.payer.name.surname}` : null,
      payeeemail: tx.payee?.email_address,
      payeename: tx.payee?.merchant_id,
      paypalfee: tx.paypal_fee ? parseFloat(tx.paypal_fee.value) : null,
      paypalfee_currency: tx.paypal_fee?.currency_code || 'USD',
      exchangerate: tx.exchange_rate ? parseFloat(tx.exchange_rate) : null,
      transactiondate: new Date(tx.time).toISOString(),
      rawdata: tx
    }));

    const { error } = await supabase
      .from('paypal_transactions')
      .upsert(transactionData, {
        onConflict: 'user_id,paypal_transaction_id'
      });

    if (error) {
      throw new Error(`Failed to store transactions: ${error.message}`);
    }
  }

  async storeAnalytics(analytics: PayPalAnalyticsData, userId: string, integrationId: string): Promise<void> {
    const supabase = await this.initializeSupabase();
    
    const analyticsData = {
      userid: userId,
      integrationid: integrationId,
      periodstart: analytics.periodStart,
      periodend: analytics.periodEnd,
      periodtype: 'custom',
      totalrevenue: analytics.totalRevenue,
      totaltransactions: analytics.totalTransactions,
      averagetransaction_value: analytics.averageTransactionValue,
      currencybreakdown: analytics.currencyBreakdown,
      transactiontype_breakdown: analytics.transactionTypeBreakdown,
      statusbreakdown: analytics.statusBreakdown,
      rawdata: analytics
    };

    const { error } = await supabase
      .from('paypal_analytics')
      .upsert(analyticsData, {
        onConflict: 'user_id,integration_id,period_start,period_end,period_type'
      });

    if (error) {
      throw new Error(`Failed to store analytics: ${error.message}`);
    }
  }

  async getStoredTransactions(userId: string, integrationId: string, startDate?: string, endDate?: string): Promise<PayPalTransaction[]> {
    const supabase = await this.initializeSupabase();
    
    let query = supabase
      .from('paypal_transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('integration_id', integrationId);

    if (startDate) {
      query = query.gte('transaction_date', startDate);
    }
    if (endDate) {
      query = query.lte('transaction_date', endDate);
    }

    const { data, error } = await query.order('transaction_date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch stored transactions: ${error.message}`);
    }

    return data.map((row: any) => ({
      id: row.paypal_transaction_id,
      transactiontype: row.transaction_type,
      status: row.status,
      amount: {
        currencycode: row.currency,
        value: row.amount.toString()
      },
      payee: {
        emailaddress: row.payee_email,
        merchantid: row.payee_name
      },
      payer: {
        emailaddress: row.payer_email,
        payerid: '',
        name: {
          givenname: row.payer_name?.split(' ')[0] || '',
          surname: row.payer_name?.split(' ').slice(1).join(' ') || ''
        }
      },
      time: row.transaction_date,
      description: row.description,
      paypalfee: row.paypal_fee ? {
        currencycode: row.paypal_fee_currency,
        value: row.paypal_fee.toString()
      } : undefined,
      exchangerate: row.exchange_rate?.toString(),
      rawdata: row.raw_data
    }));
  }

  async getStoredAnalytics(userId: string, integrationId: string, periodType: string = 'custom'): Promise<PayPalAnalyticsData[]> {
    const supabase = await this.initializeSupabase();
    
    const { data, error } = await supabase
      .from('paypal_analytics')
      .select('*')
      .eq('user_id', userId)
      .eq('integration_id', integrationId)
      .eq('period_type', periodType)
      .order('period_start', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch stored analytics: ${error.message}`);
    }

    return data.map((row: any) => ({
      totalRevenue: row.total_revenue,
      totalTransactions: row.total_transactions,
      averageTransactionValue: row.average_transaction_value,
      currencyBreakdown: row.currency_breakdown || {},
      transactionTypeBreakdown: row.transaction_type_breakdown || {},
      statusBreakdown: row.status_breakdown || {},
      recentTransactions: [],
      periodStart: row.period_start,
      periodEnd: row.period_end
    }));
  }

  calculateAnalytics(transactions: PayPalTransaction[]): PayPalAnalyticsData {
    const totalRevenue = transactions.reduce((sum, tx) => {
      return sum + parseFloat(tx.amount.value);
    }, 0);

    const totalTransactions = transactions.length;
    const averageTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions: 0;

    const currencyBreakdown: Record<string, number> = {};
    const transactionTypeBreakdown: Record<string, number> = {};
    const statusBreakdown: Record<string, number> = {};

    transactions.forEach(tx => {
      const currency = tx.amount.currency_code;
      const amount = parseFloat(tx.amount.value);
      currencyBreakdown[currency] = (currencyBreakdown[currency] || 0) + amount;

      const type = tx.transaction_type;
      transactionTypeBreakdown[type] = (transactionTypeBreakdown[type] || 0) + 1;

      const status = tx.status;
      statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
    });

    return {
      totalRevenue,
      totalTransactions,
      averageTransactionValue,
      currencyBreakdown,
      transactionTypeBreakdown,
      statusBreakdown,
      recentTransactions: transactions.slice(0, 10),
      periodStart: transactions.length > 0 ? transactions[transactions.length - 1].time : '',
      periodEnd: transactions.length > 0 ? transactions[0].time : ''
    };
  }

  async getAnalytics(startDate: string, endDate: string, userId: string, integrationId: string): Promise<PayPalAnalyticsData> {
    try {
      // First try to get stored data
      const storedTransactions = await this.getStoredTransactions(userId, integrationId, startDate, endDate);
      
      if (storedTransactions.length > 0) {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log(`Using ${storedTransactions.length} stored transactions for analytics`);
        return this.calculateAnalytics(storedTransactions);
      }

      // If no stored data, fetch from PayPal API
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('Fetching fresh data from PayPal API');
      const transactions = await this.fetchTransactions(startDate, endDate);
      
      // Store the transactions for future use
      await this.storeTransactions(transactions, userId, integrationId);
      
      // Calculate and store analytics
      const analytics = this.calculateAnalytics(transactions);
      await this.storeAnalytics(analytics, userId, integrationId);
      
      return analytics;
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error fetching PayPal analytics: ', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.getAccessToken();
      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('PayPal API connection test failed: ', error);
      return false;
    }
  }
} 