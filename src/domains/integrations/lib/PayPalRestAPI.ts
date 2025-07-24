/**
 * PayPal REST API Implementation
 * Uses PayPal's REST APIs directly without OAuth for basic functionality
 */

export interface PayPalOrder {
  id: string;
  status: string;
  intent: string;
  paymentsource: {
    paypal: {
      accountid: string;
      emailaddress: string;
      accountstatus: string;
    };
  };
  purchaseunits: Array<{
    referenceid: string;
    amount: {
      currencycode: string;
      value: string;
    };
    payee: {
      emailaddress: string;
      merchantid: string;
    };
    payments: {
      captures: Array<{
        id: string;
        status: string;
        amount: {
          currencycode: string;
          value: string;
        };
        createtime: string;
        updatetime: string;
      }>;
    };
  }>;
  createtime: string;
  updatetime: string;
}

export interface PayPalTransaction {
  transactionid: string;
  transactionstatus: string;
  transactionamount: {
    currencycode: string;
    value: string;
  };
  transactiondate: string;
  transactiontype: string;
  payee: {
    emailaddress: string;
    merchantid: string;
  };
  payer: {
    emailaddress: string;
    payerid: string;
  };
}

export class PayPalRestAPI {
  private baseUrl: string;
  private clientId: string;
  private clientSecret: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_PAYPAL_ENV === 'live' 
      ? 'https: //api.paypal.com' 
      : 'https://api.sandbox.paypal.com';
    this.clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
    this.clientSecret = import.meta.env.VITE_PAYPAL_CLIENT_SECRET;
  }

  /**
   * Get access token using client credentials
   */
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

  /**
   * Create a PayPal order
   */
  async createOrder(amount: string, currency: string = 'USD'): Promise<PayPalOrder> {
    const accessToken = await this.getAccessToken();
    
    const orderData = {
      intent: 'CAPTURE',
      purchaseunits: [
        {
          amount: {
            currencycode: currency,
            value: amount,
          },
        },
      ],
    };

    const response = await fetch(`${this.baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      throw new Error(`Failed to create order: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Capture a PayPal order
   */
  async captureOrder(orderId: string): Promise<PayPalOrder> {
    const accessToken = await this.getAccessToken();
    
    const response = await fetch(`${this.baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to capture order: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Get transaction history (requires OAuth for user-specific data)
   * This is a simplified version - full implementation would need OAuth
   */
  async getTransactions(startDate: string, endDate: string): Promise<PayPalTransaction[]> {
    const accessToken = await this.getAccessToken();
    
    const response = await fetch(
      `${this.baseUrl}/v1/reporting/transactions?start_date=${startDate}&end_date=${endDate}&fields=transaction_info,payer_info,shipping_info,auction_info,incentive_info,store_info`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get transactions: ${response.status}`);
    }

    const data = await response.json();
    return data.transaction_details || [];
  }

  /**
   * Get order details
   */
  async getOrder(orderId: string): Promise<PayPalOrder> {
    const accessToken = await this.getAccessToken();
    
    const response = await fetch(`${this.baseUrl}/v2/checkout/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get order: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getAccessToken();
      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('PayPal connection test failed: ', error);
      return false;
    }
  }
}

/**
 * PayPal Integration using REST APIs
 * This approach doesn't require OAuth for basic functionality
 */
export class PayPalRestIntegration {
  private api: PayPalRestAPI;

  constructor() {
    this.api = new PayPalRestAPI();
  }

  /**
   * Test the integration
   */
  async testIntegration(): Promise<{
    success: boolean;
    message: string;
    data?: any;
    error?: string;
  }> {
    try {
      const connected = await this.api.testConnection();
      
      if (!connected) {
        return {
          success: false,
          message: 'Connection test failed',
          error: 'Unable to connect to PayPal API'
        };
      }

      // Test creating a small order
      const testOrder = await this.api.createOrder('0.01', 'USD');
      
      return {
        success: true,
        message: 'PayPal REST API integration is working correctly',
        data: {
          orderId: testOrder.id,
          status: testOrder.status,
          lastTested: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Integration test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Process a payment
   */
  async processPayment(amount: string, currency: string = 'USD'): Promise<{
    success: boolean;
    orderId?: string;
    error?: string;
  }> {
    try {
      const order = await this.api.createOrder(amount, currency);
      
      return {
        success: true,
        orderId: order.id
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
} 