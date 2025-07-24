import { PayPalIntegration } from '@/domains/integrations/lib/PayPalIntegration';
import { supabase } from '@/core/supabase';

export interface FinancialMetrics {
  totalRevenue: number;
  revenueChange: number;
  totalTransactions: number;
  transactionsChange: number;
  averageTransaction: number;
  transactionChange: number;
  pendingBalance: number;
  pendingChange: number;
}

export interface Transaction {
  id: string;
  status: string;
  amount: number;
  currency: string;
  date: string;
  payer: {
    name: string;
    email: string;
  };
  description: string;
}

export interface RevenueChart {
  date: string;
  revenue: number;
  transactions: number;
}

export interface Payout {
  id: string;
  status: string;
  amount: number;
  currency: string;
  date: string;
  recipient: string;
  note: string;
}

class PayPalFinanceService {
  private paypalIntegration: PayPalIntegration | null = null;
  private initialized = false;

  async initialize(userId: string): Promise<void> {
    if (this.initialized) return;

    try {
      // Get user's PayPal integration credentials
      const { error } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', userId)
        .eq('integration_id', 'paypal')
        .single();

      if (error || !integration) {
        throw new Error('PayPal integration not found. Please connect your PayPal account first.');
      }

      // Initialize PayPal integration
      this.paypalIntegration = new PayPalIntegration();
      await this.paypalIntegration.sync({ userId, fullSync: true });
      this.initialized = true;
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Failed to initialize PayPal service: ', error);
      throw error;
    }
  }

  async getFinancialMetrics(userId: string): Promise<FinancialMetrics> {
    await this.initialize(userId);

    try {
      if (!this.paypalIntegration) {
        throw new Error('PayPal integration not initialized');
      }

      // Get transaction data
      const data = await this.paypalIntegration.fetchProviderData({ userId, fullSync: false });
      const transactions = data.transactions || [];
      const balance = data.balance || [];

      // Calculate metrics
      const totalRevenue = transactions.reduce((sum, tx) => {
        if (tx.status === 'COMPLETED') {
          return sum + parseFloat(tx.amount.value || '0');
        }
        return sum;
      }, 0);

      const totalTransactions = transactions.filter(tx => tx.status === 'COMPLETED').length;
      const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions: 0;

      // Get pending balance
      const pendingBalance = balance.reduce((sum, bal) => {
        return sum + parseFloat(bal.pending_balance?.value || '0');
      }, 0);

      // Calculate changes (simplified - in real app, you'd compare with previous period)
      const revenueChange = 12.5; // Mock change percentage
      const transactionsChange = 8.3;
      const transactionChange = 15.7;
      const pendingChange = -5.2;

      return {
        totalRevenue,
        revenueChange,
        totalTransactions,
        transactionsChange,
        averageTransaction,
        transactionChange,
        pendingBalance,
        pendingChange
      };
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Failed to get financial metrics: ', error);
      throw error;
    }
  }

  async getRecentTransactions(userId: string): Promise<Transaction[]> {
    await this.initialize(userId);

    try {
      if (!this.paypalIntegration) {
        throw new Error('PayPal integration not initialized');
      }

      const data = await this.paypalIntegration.fetchProviderData({ userId, fullSync: false });
      const transactions = data.transactions || [];

      return transactions.slice(0, 20).map(tx => ({
        id: tx.id,
        status: tx.status,
        amount: parseFloat(tx.amount.value || '0'),
        currency: tx.amount.currency_code,
        date: tx.create_time,
        payer: {
          name: `${tx.payer.name.given_name} ${tx.payer.name.surname}`,
          email: tx.payer.email_address
        },
        description: tx.transactions?.[0]?.description || 'Payment'
      }));
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Failed to get recent transactions: ', error);
      throw error;
    }
  }

  async getRevenueChart(userId: string, days: number = 30): Promise<RevenueChart[]> {
    await this.initialize(userId);

    try {
      if (!this.paypalIntegration) {
        throw new Error('PayPal integration not initialized');
      }

      const data = await this.paypalIntegration.fetchProviderData({ userId, fullSync: false });
      const transactions = data.transactions || [];

      // Group transactions by date
      const dailyRevenue = transactions.reduce((groups, tx) => {
        if (tx.status === 'COMPLETED') {
          const date = new Date(tx.create_time).toISOString().split('T')[0];
          const amount = parseFloat(tx.amount.value || '0');
          
          if (!groups[date]) {
            groups[date] = { revenue: 0, transactions: 0 };
          }
          
          groups[date].revenue += amount;
          groups[date].transactions += 1;
        }
        return groups;
      }, {} as Record<string, { revenue: number; transactions: number }>);

      // Generate chart data for the specified number of days
      const chartData: RevenueChart[] = [];
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const dayData = dailyRevenue[dateStr] || { revenue: 0, transactions: 0 };
        
        chartData.push({
          date: dateStr,
          revenue: dayData.revenue,
          transactions: dayData.transactions
        });
      }

      return chartData;
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Failed to get revenue chart: ', error);
      throw error;
    }
  }

  async getPayouts(userId: string): Promise<Payout[]> {
    await this.initialize(userId);

    try {
      if (!this.paypalIntegration) {
        throw new Error('PayPal integration not initialized');
      }

      const data = await this.paypalIntegration.fetchProviderData({ userId, fullSync: false });
      const payouts = data.payouts || [];

      return payouts.slice(0, 20).map(payout => ({
        id: payout.id,
        status: payout.status,
        amount: parseFloat(payout.amount.value || '0'),
        currency: payout.amount.currency_code,
        date: payout.create_time,
        recipient: payout.payout_item.receiver,
        note: payout.payout_item.note || ''
      }));
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Failed to get payouts: ', error);
      throw error;
    }
  }

  async getBalance(userId: string): Promise<{
    available: number;
    pending: number;
    total: number;
    currency: string;
  }> {
    await this.initialize(userId);

    try {
      if (!this.paypalIntegration) {
        throw new Error('PayPal integration not initialized');
      }

      const data = await this.paypalIntegration.fetchProviderData({ userId, fullSync: false });
      const balance = data.balance || [];

      if (balance.length === 0) {
        return {
          available: 0,
          pending: 0,
          total: 0,
          currency: 'USD'
        };
      }

      const bal = balance[0]; // Usually one balance record
      return {
        available: parseFloat(bal.available_balance?.value || '0'),
        pending: parseFloat(bal.pending_balance?.value || '0'),
        total: parseFloat(bal.total_balance?.value || '0'),
        currency: bal.currency_code || 'USD'
      };
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Failed to get balance: ', error);
      throw error;
    }
  }
}

export const paypalFinanceService = new PayPalFinanceService(); 