import { IntegrationBaseService, type IntegrationConfig, type TestConnectionResult, type SyncResult } from '../core/IntegrationBaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import { DataMappingService } from '../core/DataMappingService';
import { z } from 'zod';

// PayPal Transaction Schema
export const PayPalTransactionSchema = z.object({
  id: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: z.string(),
  date: z.string(),
  description: z.string().optional(),
  payer_email: z.string().optional(),
  payee_email: z.string().optional(),
  transaction_type: z.string().optional(),
});

export type PayPalTransaction = z.infer<typeof PayPalTransactionSchema>;

// PayPal Analytics Schema
export const PayPalAnalyticsSchema = z.object({
  totalRevenue: z.number(),
  totalTransactions: z.number(),
  averageTransactionValue: z.number(),
  successRate: z.number(),
  currency: z.string(),
  timeRange: z.object({
    start: z.string(),
    end: z.string(),
  }),
  transactions: z.array(PayPalTransactionSchema),
  trends: z.object({
    daily: z.array(z.object({
      date: z.string(),
      revenue: z.number(),
      transactions: z.number(),
    })),
    monthly: z.array(z.object({
      month: z.string(),
      revenue: z.number(),
      transactions: z.number(),
    })),
  }),
});

export type PayPalAnalytics = z.infer<typeof PayPalAnalyticsSchema>;

/**
 * PayPal Integration Service
 * Provides PayPal-specific integration functionality
 * 
 * Extends IntegrationBaseService for consistent interface
 */
export class PayPalIntegrationService extends IntegrationBaseService {
  protected readonly integrationType = 'paypal';
  protected readonly platform = 'paypal';
  private dataMappingService = new DataMappingService();

  /**
   * Test connection to PayPal
   */
  async testConnection(integrationId: string): Promise<ServiceResponse<TestConnectionResult>> {
    return this.executeDbOperation(async () => {
      // Get integration details
      const { data: integration, error } = await this.supabase
        .from('integrations')
        .select('*')
        .eq('id', integrationId)
        .single();

      if (error) throw error;

      try {
        // Test PayPal API connection
        const response = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${integration.credentials?.clientId}:${integration.credentials?.clientSecret}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: 'grant_type=client_credentials',
        });

        if (!response.ok) {
          throw new Error(`PayPal API error: ${response.statusText}`);
        }

        const data = await response.json();

        return {
          data: {
            success: true,
            details: {
              apiVersion: 'v1',
              environment: integration.credentials?.environment || 'sandbox',
              tokenType: data.token_type,
            },
          },
          error: null,
        };
      } catch (error) {
        await this.logError(integrationId, error instanceof Error ? error.message : 'Unknown error');
        
        return {
          data: {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to connect to PayPal',
          },
          error: null,
        };
      }
    }, `test PayPal connection for integration ${integrationId}`);
  }

  /**
   * Sync data from PayPal
   */
  async syncData(integrationId: string): Promise<ServiceResponse<SyncResult>> {
    return this.executeDbOperation(async () => {
      const startTime = Date.now();
      const errors: string[] = [];
      let recordsProcessed = 0;

      try {
        // Get integration details
        const { data: integration, error } = await this.supabase
          .from('integrations')
          .select('*')
          .eq('id', integrationId)
          .single();

        if (error) throw error;

        // Sync transactions
        const transactionsResult = await this.syncTransactions(integration);
        recordsProcessed += transactionsResult.recordsProcessed;
        errors.push(...transactionsResult.errors);

        // Update integration status
        await this.updateStatus(integrationId, 'connected', {
          lastSync: new Date().toISOString(),
          dataCount: recordsProcessed,
        });

        const duration = Date.now() - startTime;

        return {
          data: {
            success: errors.length === 0,
            recordsProcessed,
            errors,
            duration,
            lastSync: new Date().toISOString(),
          },
          error: null,
        };
      } catch (error) {
        await this.logError(integrationId, error instanceof Error ? error.message : 'Unknown error');
        
        return {
          data: {
            success: false,
            recordsProcessed,
            errors: [error instanceof Error ? error.message : 'Unknown error'],
            duration: Date.now() - startTime,
            lastSync: new Date().toISOString(),
          },
          error: null,
        };
      }
    }, `sync PayPal data for integration ${integrationId}`);
  }

  /**
   * Connect to PayPal
   */
  async connect(integrationId: string, credentials: any): Promise<ServiceResponse<any>> {
    return this.executeDbOperation(async () => {
      // Test the connection first
      const testResult = await this.testConnection(integrationId);
      if (testResult.error || !testResult.data?.success) {
        throw new Error(testResult.data?.error || 'Failed to test connection');
      }

      // Update integration with credentials and status
      const result = await this.update(integrationId, {
        credentials,
        status: 'connected',
        updatedAt: new Date().toISOString(),
      });

      return result;
    }, `connect PayPal integration ${integrationId}`);
  }

  /**
   * Disconnect from PayPal
   */
  async disconnect(integrationId: string): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      // Update integration status
      await this.updateStatus(integrationId, 'disconnected');
      return { data: true, error: null };
    }, `disconnect PayPal integration ${integrationId}`);
  }

  /**
   * Get PayPal integration metadata
   */
  async getMetadata(): Promise<ServiceResponse<{
    name: string;
    type: string;
    platform: string;
    description: string;
    capabilities: string[];
    requiredFields: string[];
    optionalFields: string[];
  }>> {
    return this.executeDbOperation(async () => {
      return {
        data: {
          name: 'PayPal Payments',
          type: this.integrationType,
          platform: this.platform,
          description: 'Connect to PayPal to sync payment transactions and analytics',
          capabilities: [
            'sync_transactions',
            'sync_analytics',
            'get_payment_history',
            'get_revenue_analytics',
            'get_transaction_details',
          ],
          requiredFields: ['clientId', 'clientSecret'],
          optionalFields: ['environment', 'refreshToken'],
        },
        error: null,
      };
    }, 'get PayPal metadata');
  }

  /**
   * Validate PayPal configuration
   */
  async validateConfig(config: IntegrationConfig): Promise<ServiceResponse<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>> {
    return this.executeDbOperation(async () => {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Validate required fields
      if (!config.credentials?.clientId) {
        errors.push('PayPal client ID is required');
      }

      if (!config.credentials?.clientSecret) {
        errors.push('PayPal client secret is required');
      }

      // Validate optional fields
      if (!config.credentials?.environment) {
        warnings.push('Environment not specified - defaulting to sandbox');
      }

      // Validate environment value
      if (config.credentials?.environment && !['sandbox', 'live'].includes(config.credentials.environment)) {
        errors.push('Environment must be either "sandbox" or "live"');
      }

      return {
        data: {
          isValid: errors.length === 0,
          errors,
          warnings,
        },
        error: null,
      };
    }, `validate PayPal config`);
  }

  /**
   * Get PayPal analytics
   */
  async getAnalytics(integrationId: string, params: {
    startDate?: string;
    endDate?: string;
    currency?: string;
  } = {}): Promise<ServiceResponse<PayPalAnalytics>> {
    return this.executeDbOperation(async () => {
      try {
        // Get integration details
        const { data: integration, error } = await this.supabase
          .from('integrations')
          .select('*')
          .eq('id', integrationId)
          .single();

        if (error) throw error;

        // Get transactions for analytics
        const { data: transactions, error: transactionsError } = await this.supabase
          .from('integration_data')
          .select('*')
          .eq('integration_id', integrationId)
          .eq('entity_type', 'transaction');

        if (transactionsError) throw transactionsError;

        const analytics = this.calculateAnalytics(transactions || [], params);
        return { data: PayPalAnalyticsSchema.parse(analytics), error: null };
      } catch (error) {
        this.logger.error('Error getting PayPal analytics:', error);
        return { data: null, error: 'Failed to get PayPal analytics' };
      }
    }, `get PayPal analytics for integration ${integrationId}`);
  }

  /**
   * Sync transactions from PayPal
   */
  private async syncTransactions(integration: any): Promise<{ recordsProcessed: number; errors: string[] }> {
    try {
      // Get access token
      const accessToken = await this.getAccessToken(integration.credentials);

      // Fetch transactions from PayPal API
      const response = await fetch(`${this.getBaseUrl(integration.credentials)}/v1/reporting/transactions`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.statusText}`);
      }

      const data = await response.json();
      const transactions = data.transaction_details || [];
      let recordsProcessed = 0;

      for (const transaction of transactions) {
        try {
          // Transform PayPal transaction to internal format
          const transformedTransaction = await this.dataMappingService.transformData(
            this.integrationType,
            'transaction',
            transaction
          );

          if (transformedTransaction.error) {
            throw new Error(transformedTransaction.error);
          }

          // Store in internal database
          const { error } = await this.supabase
            .from('integration_data')
            .upsert({
              integration_id: integration.id,
              entity_type: 'transaction',
              external_id: transaction.transaction_info.transaction_id,
              data: transformedTransaction.data,
              synced_at: new Date().toISOString(),
            });

          if (error) throw error;
          recordsProcessed++;
        } catch (error) {
          this.logger.error(`Failed to sync transaction ${transaction.transaction_info?.transaction_id}:`, error);
        }
      }

      return { recordsProcessed, errors: [] };
    } catch (error) {
      return { 
        recordsProcessed: 0, 
        errors: [error instanceof Error ? error.message : 'Unknown error'] 
      };
    }
  }

  /**
   * Get PayPal access token
   */
  private async getAccessToken(credentials: any): Promise<string> {
    const auth = btoa(`${credentials.clientId}:${credentials.clientSecret}`);
    const response = await fetch(`${this.getBaseUrl(credentials)}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new Error(`PayPal OAuth failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.access_token;
  }

  /**
   * Get PayPal base URL
   */
  private getBaseUrl(credentials: any): string {
    const environment = credentials.environment || 'sandbox';
    return environment === 'live' 
      ? 'https://api-m.paypal.com' 
      : 'https://api-m.sandbox.paypal.com';
  }

  /**
   * Calculate analytics from transactions
   */
  private calculateAnalytics(transactions: any[], params: any): PayPalAnalytics {
    const endDate = params.endDate || new Date().toISOString();
    const startDate = params.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const currency = params.currency || 'USD';

    const filteredTransactions = transactions.filter(t => {
      const date = new Date(t.data.date || t.created_at);
      return date >= new Date(startDate) && date <= new Date(endDate);
    });

    const totalRevenue = filteredTransactions.reduce((sum, t) => sum + (t.data.amount || 0), 0);
    const totalTransactions = filteredTransactions.length;
    const averageTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    const successTransactions = filteredTransactions.filter(t => t.data.status === 'COMPLETED').length;
    const successRate = totalTransactions > 0 ? (successTransactions / totalTransactions) * 100 : 0;

    // Calculate trends
    const dailyTrends = this.calculateDailyTrends(filteredTransactions);
    const monthlyTrends = this.calculateMonthlyTrends(filteredTransactions);

    return {
      totalRevenue,
      totalTransactions,
      averageTransactionValue,
      successRate,
      currency,
      timeRange: { start: startDate, end: endDate },
      transactions: filteredTransactions.map(t => PayPalTransactionSchema.parse(t.data)),
      trends: {
        daily: dailyTrends,
        monthly: monthlyTrends,
      },
    };
  }

  /**
   * Calculate daily trends
   */
  private calculateDailyTrends(transactions: any[]): Array<{ date: string; revenue: number; transactions: number }> {
    const dailyData: Record<string, { revenue: number; transactions: number }> = {};

    transactions.forEach(transaction => {
      const date = new Date(transaction.data.date || transaction.created_at).toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { revenue: 0, transactions: 0 };
      }
      dailyData[date].revenue += transaction.data.amount || 0;
      dailyData[date].transactions += 1;
    });

    return Object.entries(dailyData)
      .map(([date, data]) => ({ date, revenue: data.revenue, transactions: data.transactions }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Calculate monthly trends
   */
  private calculateMonthlyTrends(transactions: any[]): Array<{ month: string; revenue: number; transactions: number }> {
    const monthlyData: Record<string, { revenue: number; transactions: number }> = {};

    transactions.forEach(transaction => {
      const date = new Date(transaction.data.date || transaction.created_at);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[month]) {
        monthlyData[month] = { revenue: 0, transactions: 0 };
      }
      monthlyData[month].revenue += transaction.data.amount || 0;
      monthlyData[month].transactions += 1;
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({ month, revenue: data.revenue, transactions: data.transactions }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }
} 
