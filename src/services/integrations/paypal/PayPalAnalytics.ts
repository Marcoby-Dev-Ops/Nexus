/**
 * PayPal Analytics Service
 * Provides analytics and reporting functionality for PayPal data
 */

export interface PayPalAnalyticsData {
  totalRevenue: number;
  totalTransactions: number;
  averageTransactionValue: number;
  successRate: number;
  currency: string;
  timeRange: {
    start: string;
    end: string;
  };
  transactions: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    date: string;
    description?: string;
  }>;
  trends: {
    daily: Array<{ date: string; revenue: number; transactions: number }>;
    monthly: Array<{ month: string; revenue: number; transactions: number }>;
  };
}

export interface PayPalAnalyticsConfig {
  clientId: string;
  clientSecret: string;
  environment: 'sandbox' | 'live';
}

export class PayPalAnalyticsService {
  private config: PayPalAnalyticsConfig;

  constructor(config?: Partial<PayPalAnalyticsConfig>) {
    this.config = {
      clientId: config?.clientId || import.meta.env.VITE_PAYPAL_CLIENT_ID || '',
      clientSecret: config?.clientSecret || import.meta.env.VITE_PAYPAL_CLIENT_SECRET || '',
      environment: config?.environment || 'sandbox'
    };
  }

  private getBaseUrl(): string {
    return this.config.environment === 'live' 
      ? 'https://api.paypal.com' 
      : 'https://api.sandbox.paypal.com';
  }

  private async getAccessToken(): Promise<string> {
    const auth = btoa(`${this.config.clientId}:${this.config.clientSecret}`);
    const response = await fetch(`${this.getBaseUrl()}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      throw new Error(`PayPal OAuth failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.access_token;
  }

  private async makeRequest(endpoint: string): Promise<any> {
    const token = await this.getAccessToken();
    
    const response = await fetch(`${this.getBaseUrl()}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`PayPal API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get analytics data for a specific time range
   */
  async getAnalyticsData(params: {
    startDate?: string;
    endDate?: string;
    currency?: string;
  } = {}): Promise<PayPalAnalyticsData> {
    const endDate = params.endDate || new Date().toISOString();
    const startDate = params.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const currency = params.currency || 'USD';

    try {
      // Get payment history
      const paymentHistory = await this.makeRequest(
        `/v1/payments/payment?start_time=${startDate}&end_time=${endDate}&count=100`
      );

      const transactions = paymentHistory.payments || [];
      const totalRevenue = transactions.reduce((sum: number, payment: any) => {
        return sum + parseFloat(payment.amount?.total || '0');
      }, 0);

      const successfulTransactions = transactions.filter((payment: any) => 
        payment.state === 'approved' || payment.state === 'completed'
      );

      const averageTransactionValue = transactions.length > 0 
        ? totalRevenue / transactions.length 
        : 0;

      const successRate = transactions.length > 0 
        ? (successfulTransactions.length / transactions.length) * 100 
        : 0;

      // Generate daily trends (last 30 days)
      const dailyTrends = [];
      const monthlyTrends = [];
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayTransactions = transactions.filter((payment: any) => 
          payment.create_time?.startsWith(dateStr)
        );
        
        const dayRevenue = dayTransactions.reduce((sum: number, payment: any) => 
          sum + parseFloat(payment.amount?.total || '0'), 0
        );

        dailyTrends.push({
          date: dateStr,
          revenue: dayRevenue,
          transactions: dayTransactions.length
        });
      }

      // Generate monthly trends (last 12 months)
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStr = date.toISOString().slice(0, 7);
        
        const monthTransactions = transactions.filter((payment: any) => 
          payment.create_time?.startsWith(monthStr)
        );
        
        const monthRevenue = monthTransactions.reduce((sum: number, payment: any) => 
          sum + parseFloat(payment.amount?.total || '0'), 0
        );

        monthlyTrends.push({
          month: monthStr,
          revenue: monthRevenue,
          transactions: monthTransactions.length
        });
      }

      return {
        totalRevenue,
        totalTransactions: transactions.length,
        averageTransactionValue,
        successRate,
        currency,
        timeRange: {
          start: startDate,
          end: endDate
        },
        transactions: transactions.map((payment: any) => ({
          id: payment.id,
          amount: parseFloat(payment.amount?.total || '0'),
          currency: payment.amount?.currency || currency,
          status: payment.state,
          date: payment.create_time,
          description: payment.description
        })),
        trends: {
          daily: dailyTrends,
          monthly: monthlyTrends
        }
      };
    } catch (error) {
      console.error('Error fetching PayPal analytics:', error);
      
      // Return empty data structure on error
      return {
        totalRevenue: 0,
        totalTransactions: 0,
        averageTransactionValue: 0,
        successRate: 0,
        currency,
        timeRange: {
          start: startDate,
          end: endDate
        },
        transactions: [],
        trends: {
          daily: [],
          monthly: []
        }
      };
    }
  }

  /**
   * Get real-time transaction data
   */
  async getRealTimeData(): Promise<{
    recentTransactions: number;
    todayRevenue: number;
    pendingTransactions: number;
  }> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const todayData = await this.makeRequest(
        `/v1/payments/payment?start_time=${yesterday}&end_time=${today}&count=50`
      );

      const transactions = todayData.payments || [];
      const todayRevenue = transactions.reduce((sum: number, payment: any) => 
        sum + parseFloat(payment.amount?.total || '0'), 0
      );

      const pendingTransactions = transactions.filter((payment: any) => 
        payment.state === 'pending' || payment.state === 'created'
      ).length;

      return {
        recentTransactions: transactions.length,
        todayRevenue,
        pendingTransactions
      };
    } catch (error) {
      console.error('Error fetching real-time PayPal data:', error);
      return {
        recentTransactions: 0,
        todayRevenue: 0,
        pendingTransactions: 0
      };
    }
  }
} 