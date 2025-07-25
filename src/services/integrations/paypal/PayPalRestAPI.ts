/**
 * PayPal REST API Client
 * Provides methods for interacting with PayPal's REST API
 */

export interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  environment: 'sandbox' | 'live';
}

export interface PayPalTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export interface PayPalPayment {
  id: string;
  intent: string;
  state: string;
  amount: {
    currency: string;
    total: string;
  };
  create_time: string;
  update_time: string;
}

export class PayPalRestAPI {
  private config: PayPalConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config?: Partial<PayPalConfig>) {
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
    // Check if we have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

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

    const data: PayPalTokenResponse = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000);

    return this.accessToken;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = await this.getAccessToken();
    
    const response = await fetch(`${this.getBaseUrl()}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`PayPal API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get payment details
   */
  async getPayment(paymentId: string): Promise<PayPalPayment> {
    return this.makeRequest(`/v1/payments/payment/${paymentId}`);
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(params: {
    start_time?: string;
    end_time?: string;
    count?: number;
    start_id?: string;
  } = {}): Promise<{ payments: PayPalPayment[]; count: number; next_id?: string }> {
    const queryParams = new URLSearchParams();
    
    if (params.start_time) queryParams.append('start_time', params.start_time);
    if (params.end_time) queryParams.append('end_time', params.end_time);
    if (params.count) queryParams.append('count', params.count.toString());
    if (params.start_id) queryParams.append('start_id', params.start_id);

    const queryString = queryParams.toString();
    const endpoint = `/v1/payments/payment${queryString ? `?${queryString}` : ''}`;
    
    return this.makeRequest(endpoint);
  }

  /**
   * Get account information
   */
  async getAccountInfo(): Promise<any> {
    return this.makeRequest('/v1/identity/oauth2/userinfo');
  }

  /**
   * Get webhook events
   */
  async getWebhookEvents(params: {
    start_time?: string;
    end_time?: string;
    page_size?: number;
    page?: number;
  } = {}): Promise<any> {
    const queryParams = new URLSearchParams();
    
    if (params.start_time) queryParams.append('start_time', params.start_time);
    if (params.end_time) queryParams.append('end_time', params.end_time);
    if (params.page_size) queryParams.append('page_size', params.page_size.toString());
    if (params.page) queryParams.append('page', params.page.toString());

    const queryString = queryParams.toString();
    const endpoint = `/v1/notifications/webhooks-events${queryString ? `?${queryString}` : ''}`;
    
    return this.makeRequest(endpoint);
  }
} 