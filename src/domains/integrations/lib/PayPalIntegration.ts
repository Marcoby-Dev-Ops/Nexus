import { BaseIntegration } from '@/domains/integrations/lib/baseIntegration';
import type { SyncResult } from '@/domains/integrations/lib/baseIntegration';
import { syncIntegration } from '@/domains/integrations/lib/syncService';
import { OAuthTokenService } from '@/domains/integrations/lib/oauthTokenService';
import { supabase } from '@/core/supabase';
import { logger } from '@/core/auth/logger';
import type { AuthType } from './authTypes';

interface PayPalTransaction {
  id: string;
  status: string;
  amount: {
    currencycode: string;
    value: string;
  };
  paymentsource: {
    paypal?: {
      accountid: string;
      accounttype: string;
    };
    card?: {
      lastdigits: string;
      brand: string;
    };
  };
  createtime: string;
  updatetime: string;
  intent: string;
  payer: {
    payerid: string;
    name: {
      givenname: string;
      surname: string;
    };
    emailaddress: string;
  };
  shipping: {
    name: {
      fullname: string;
    };
    address: {
      addressline1: string;
      adminarea2: string;
      adminarea1: string;
      postalcode: string;
      countrycode: string;
    };
  };
  transactions: Array<{
    amount: {
      currencycode: string;
      value: string;
    };
    description: string;
    customid: string;
    invoiceid: string;
  }>;
}

interface PayPalPayout {
  id: string;
  status: string;
  amount: {
    currencycode: string;
    value: string;
  };
  createtime: string;
  updatetime: string;
  payoutbatchid: string;
  payoutitem: {
    recipienttype: string;
    amount: {
      currencycode: string;
      value: string;
    };
    receiver: string;
    note: string;
    senderitemid: string;
  };
}

interface PayPalBalance {
  currencycode: string;
  value: string;
  availablebalance: {
    currencycode: string;
    value: string;
  };
  pendingbalance: {
    currencycode: string;
    value: string;
  };
  totalbalance: {
    currencycode: string;
    value: string;
  };
}

export class PayPalIntegration extends BaseIntegration {
  id = 'paypal';
  name = 'PayPal';
  dataFields = ['transactions', 'payouts', 'balance', 'webhooks'];
  authType: AuthType = 'oauth';

  private async getAccessToken(userId: string): Promise<string> {
    const token = await OAuthTokenService.getTokens('paypal');
    if (!token?.access_token) {
      throw new Error('No valid PayPal access token found. Please reconnect your account.');
    }
    return token.access_token;
  }

  private async makePayPalRequest<T>(endpoint: string, accessToken: string): Promise<T[]> {
    const baseUrl = import.meta.env.VITE_PAYPAL_ENV === 'live' 
      ? 'https: //api.paypal.com' 
      : 'https://api.sandbox.paypal.com';
    const url = `${baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error({ endpoint, status: response.status, error: errorText }, 'PayPal API request failed');
      throw new Error(`PayPal API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data: [data];
  }

  async fetchProviderData({ userId, fullSync = false }: { userId: string; fullSync?: boolean }): Promise<Record<string, any[]>> {
    try {
      logger.info({ userId, fullSync }, 'Starting PayPal data fetch');
      
      const accessToken = await this.getAccessToken(userId);
      
      // Fetch data in parallel for better performance
      const [
        transactions,
        payouts,
        balance,
        webhooks
      ] = await Promise.all([
        this.fetchTransactions(accessToken, fullSync),
        this.fetchPayouts(accessToken, fullSync),
        this.fetchBalance(accessToken),
        this.fetchWebhooks(accessToken)
      ]);

      const result = {
        transactions,
        payouts,
        balance,
        webhooks
      };

      logger.info({ 
        userId, 
        transactionCount: transactions.length,
        payoutCount: payouts.length,
        balanceCount: balance.length,
        webhookCount: webhooks.length
      }, 'PayPal data fetch completed');

      return result;
    } catch (error) {
      logger.error({ userId, error }, 'Failed to fetch PayPal data');
      throw error;
    }
  }

  private async fetchTransactions(accessToken: string, fullSync: boolean): Promise<PayPalTransaction[]> {
    try {
      const now = new Date();
      const startDate = fullSync 
        ? new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000)) // 1 year ago for full sync: new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)); // 30 days ago for incremental
      
      const endpoint = `/v1/reporting/transactions?start_date=${startDate.toISOString()}&end_date=${now.toISOString()}&transaction_status=S&page_size=100`;
      
      return await this.makePayPalRequest<PayPalTransaction>(endpoint, accessToken);
    } catch (error) {
      logger.error({ error }, 'Failed to fetch PayPal transactions');
      return [];
    }
  }

  private async fetchPayouts(accessToken: string, fullSync: boolean): Promise<PayPalPayout[]> {
    try {
      const now = new Date();
      const startDate = fullSync 
        ? new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000)) // 1 year ago for full sync: new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)); // 30 days ago for incremental
      
      const endpoint = `/v1/payments/payouts?start_date=${startDate.toISOString()}&end_date=${now.toISOString()}&page_size=100`;
      
      return await this.makePayPalRequest<PayPalPayout>(endpoint, accessToken);
    } catch (error) {
      logger.error({ error }, 'Failed to fetch PayPal payouts');
      return [];
    }
  }

  private async fetchBalance(accessToken: string): Promise<PayPalBalance[]> {
    try {
      const endpoint = '/v1/accounts/balance';
      const balance = await this.makePayPalRequest<PayPalBalance>(endpoint, accessToken);
      return balance;
    } catch (error) {
      logger.error({ error }, 'Failed to fetch PayPal balance');
      return [];
    }
  }

  private async fetchWebhooks(accessToken: string): Promise<any[]> {
    try {
      const endpoint = '/v1/notifications/webhooks';
      return await this.makePayPalRequest<any>(endpoint, accessToken);
    } catch (error) {
      logger.error({ error }, 'Failed to fetch PayPal webhooks');
      return [];
    }
  }

  async sync(options: { userId: string; fullSync?: boolean }): Promise<SyncResult> {
    try {
      logger.info({ userId: options.userId, fullSync: options.fullSync }, 'Starting PayPal sync');
      
      const result = await syncIntegration({ integration: this, ...options });
      
      // Store sync metadata
      await this.updateSyncMetadata(options.userId, {
        lastSync: new Date().toISOString(),
        syncType: options.fullSync ? 'full' : 'incremental',
        dataPoints: Object.values(result).reduce((sum: number, items: any[]) => sum + (Array.isArray(items) ? items.length: 0), 0)
      });

      logger.info({ userId: options.userId, result }, 'PayPal sync completed');
      return result;
    } catch (error) {
      logger.error({ userId: options.userId, error }, 'PayPal sync failed');
      throw error;
    }
  }

  private async updateSyncMetadata(userId: string, metadata: any): Promise<void> {
    try {
      await supabase
        .from('user_integrations')
        .upsert({
          userid: userId,
          integrationid: this.id,
          integrationname: this.name,
          integrationtype: 'oauth',
          lastsync_at: metadata.lastSync,
          updatedat: new Date().toISOString()
        }, { onConflict: 'user_id,integration_id' });
    } catch (error) {
      logger.error({ userId, error }, 'Failed to update PayPal sync metadata');
    }
  }

  async testConnection(userId: string): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken(userId);
      // Test with a simple API call to get user info
      const userInfo = await this.makePayPalRequest<any>('/v1/identity/oauth2/userinfo', accessToken);
      return userInfo.length > 0;
    } catch (error) {
      logger.error({ userId, error }, 'PayPal connection test failed');
      return false;
    }
  }

  async getConnectionStatus(userId: string): Promise<{
    connected: boolean;
    lastSync?: string;
    dataPoints?: number;
    error?: string;
  }> {
    try {
      const connected = await this.testConnection(userId);
      
      if (!connected) {
        return { connected: false, error: 'Not connected to PayPal' };
      }

      // Get sync metadata
      const { data: integration } = await supabase
        .from('user_integrations')
        .select('last_sync_at')
        .eq('user_id', userId)
        .eq('integration_id', this.id)
        .single();

      return {
        connected: true,
        lastSync: integration?.last_sync_at || undefined,
        dataPoints: 0 // Will be calculated from actual data
      };
    } catch (error) {
      logger.error({ userId, error }, 'Failed to get PayPal connection status');
      return { connected: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Test the integration with a simple API call
   */
  async testIntegration(userId: string): Promise<{
    success: boolean;
    message: string;
    data?: any;
    error?: string;
  }> {
    try {
      logger.info({ userId }, 'Testing PayPal integration');
      
      // Test connection
      const connected = await this.testConnection(userId);
      if (!connected) {
        return {
          success: false,
          message: 'Connection test failed',
          error: 'Unable to connect to PayPal API'
        };
      }

      // Test a simple API call
      const accessToken = await this.getAccessToken(userId);
      if (!accessToken) {
        return {
          success: false,
          message: 'No valid access token',
          error: 'OAuth token not found or expired'
        };
      }

      // Test user info endpoint
      const userInfo = await this.makePayPalRequest<any>('/v1/identity/oauth2/userinfo', accessToken);
      
      if (userInfo.length === 0) {
        return {
          success: false,
          message: 'User info not accessible',
          error: 'Insufficient permissions or API error'
        };
      }

      const user = userInfo[0];
      
      return {
        success: true,
        message: 'PayPal integration is working correctly',
        data: {
          user: {
            payerid: user.payer_id,
            name: user.name,
            emailaddress: user.email_address,
            verifiedaccount: user.verified_account
          },
          scopes: user.scope || [],
          lastTested: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error({ userId, error }, 'PayPal integration test failed');
      return {
        success: false,
        message: 'Integration test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
} 