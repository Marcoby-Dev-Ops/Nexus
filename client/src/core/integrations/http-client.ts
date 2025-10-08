/**
 * Resilient HTTP Client
 * 
 * Provides a hardened HTTP layer with:
 * - Timeouts and retries with exponential backoff
 * - Rate limiting via Bottleneck
 * - Circuit breaker effect via max retries + backoff
 * - Provider-specific concurrency/rate configs
 */

import type { HttpClientConfig, HttpRequest, HttpResponse } from './types';
import { logger } from '@/shared/utils/logger';

// Simple rate limiter implementation (can be replaced with Bottleneck)
class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private perWindow: number;

  constructor(maxRequests: number, perWindow: number) {
    this.maxRequests = maxRequests;
    this.perWindow = perWindow;
  }

  async waitForSlot(): Promise<void> {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.perWindow);
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.perWindow - (now - oldestRequest);
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    this.requests.push(now);
  }
}

export class HttpClient {
  private config: HttpClientConfig;
  private rateLimiter?: RateLimiter;
  private retryCount = 0;

  constructor(config: HttpClientConfig) {
    this.config = {
      timeout: 15000,
      maxRetries: 3,
      retryDelay: 1000,
      ...config,
    };

    if (config.rateLimit) {
      this.rateLimiter = new RateLimiter(
        config.rateLimit.maxRequests,
        config.rateLimit.perWindow
      );
    }
  }

  /**
   * Make an HTTP request with retries and rate limiting
   */
  async request<T = any>(request: HttpRequest): Promise<HttpResponse<T>> {
    const startTime = Date.now();
    
    try {
      // Wait for rate limit slot
      if (this.rateLimiter) {
        await this.rateLimiter.waitForSlot();
      }

      return await this.executeRequest<T>(request);
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('HTTP request failed', {
        url: request.url,
        method: request.method,
        duration,
        error: error instanceof Error ? error.message : String(error),
        retryCount: this.retryCount,
      });

      // Retry logic with exponential backoff
      if (this.retryCount < this.config.maxRetries!) {
        return this.retryRequest<T>(request);
      }

      throw error;
    }
  }

  /**
   * Execute a single HTTP request
   */
  private async executeRequest<T>(request: HttpRequest): Promise<HttpResponse<T>> {
    const url = request.url.startsWith('http') 
      ? request.url 
      : `${this.config.baseUrl}${request.url}`;

    const headers = {
      'Content-Type': 'application/json',
      ...this.config.headers,
      ...request.headers,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), request.timeout || this.config.timeout);

    try {
      const response = await fetch(url, {
        method: request.method,
        headers,
        body: request.body ? JSON.stringify(request.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        data,
        url: response.url,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Retry request with exponential backoff
   */
  private async retryRequest<T>(request: HttpRequest): Promise<HttpResponse<T>> {
    this.retryCount++;
    
    const delay = this.config.retryDelay! * Math.pow(2, this.retryCount - 1);
    const jitter = Math.random() * 0.1 * delay; // 10% jitter
    
    logger.info('Retrying HTTP request', {
      url: request.url,
      method: request.method,
      retryCount: this.retryCount,
      delay: delay + jitter,
    });

    await new Promise(resolve => setTimeout(resolve, delay + jitter));
    
    return this.executeRequest<T>(request);
  }

  /**
   * Convenience methods for common HTTP verbs
   */
  async get<T = any>(url: string, headers?: Record<string, string>): Promise<HttpResponse<T>> {
    return this.request<T>({ method: 'GET', url, headers });
  }

  async post<T = any>(url: string, body?: any, headers?: Record<string, string>): Promise<HttpResponse<T>> {
    return this.request<T>({ method: 'POST', url, body, headers });
  }

  async put<T = any>(url: string, body?: any, headers?: Record<string, string>): Promise<HttpResponse<T>> {
    return this.request<T>({ method: 'PUT', url, body, headers });
  }

  async patch<T = any>(url: string, body?: any, headers?: Record<string, string>): Promise<HttpResponse<T>> {
    return this.request<T>({ method: 'PATCH', url, body, headers });
  }

  async delete<T = any>(url: string, headers?: Record<string, string>): Promise<HttpResponse<T>> {
    return this.request<T>({ method: 'DELETE', url, headers });
  }

  /**
   * Reset retry counter (useful for new request sequences)
   */
  resetRetryCount(): void {
    this.retryCount = 0;
  }
}

/**
 * Provider-specific HTTP client factory
 */
export class HttpClientFactory {
  private static clients = new Map<string, HttpClient>();

  static createClient(providerId: string, config: HttpClientConfig): HttpClient {
    if (!this.clients.has(providerId)) {
      this.clients.set(providerId, new HttpClient(config));
    }
    return this.clients.get(providerId)!;
  }

  static getClient(providerId: string): HttpClient | undefined {
    return this.clients.get(providerId);
  }

  static clearClient(providerId: string): void {
    this.clients.delete(providerId);
  }
}

/**
 * Pre-configured provider configs
 */
export const PROVIDER_CONFIGS = {
  hubspot: {
    name: 'HubSpot',
    baseUrl: 'https://api.hubapi.com',
    authType: 'oauth2' as const,
    rateLimits: {
      requestsPerSecond: 4,
      burstSize: 10,
    },
    timeouts: {
      request: 30000,
      connect: 10000,
    },
    retryConfig: {
      maxRetries: 3,
      backoffMultiplier: 2,
      maxBackoff: 60000,
    },
    webhookConfig: {
      secret: process.env.HUBSPOT_WEBHOOK_SECRET,
      algorithm: 'sha256' as const,
      headerName: 'X-HubSpot-Signature',
      tolerance: 300,
    },
  },
  
  slack: {
    name: 'Slack',
    baseUrl: 'https://slack.com/api',
    authType: 'bearer' as const,
    rateLimits: {
      requestsPerSecond: 1,
      burstSize: 3,
    },
    timeouts: {
      request: 15000,
      connect: 5000,
    },
    retryConfig: {
      maxRetries: 3,
      backoffMultiplier: 2,
      maxBackoff: 30000,
    },
    webhookConfig: {
      secret: process.env.SLACK_WEBHOOK_SECRET,
      algorithm: 'sha256' as const,
      headerName: 'X-Slack-Signature',
      tolerance: 300,
    },
  },

  salesforce: {
    name: 'Salesforce',
    baseUrl: 'https://login.salesforce.com',
    authType: 'oauth2' as const,
    rateLimits: {
      requestsPerSecond: 2,
      burstSize: 5,
    },
    timeouts: {
      request: 60000,
      connect: 15000,
    },
    retryConfig: {
      maxRetries: 5,
      backoffMultiplier: 2,
      maxBackoff: 120000,
    },
  },

  microsoft365: {
    name: 'Microsoft 365',
    baseUrl: 'https://graph.microsoft.com/v1.0',
    authType: 'oauth2' as const,
    rateLimits: {
      requestsPerSecond: 3,
      burstSize: 8,
    },
    timeouts: {
      request: 30000,
      connect: 10000,
    },
    retryConfig: {
      maxRetries: 3,
      backoffMultiplier: 2,
      maxBackoff: 60000,
    },
    webhookConfig: {
      secret: process.env.MICROSOFT_WEBHOOK_SECRET,
      algorithm: 'sha256' as const,
      headerName: 'X-Microsoft-Signature',
      tolerance: 300,
    },
  },

  google: {
    name: 'Google APIs',
    baseUrl: 'https://www.googleapis.com',
    authType: 'oauth2' as const,
    rateLimits: {
      requestsPerSecond: 5,
      burstSize: 15,
    },
    timeouts: {
      request: 30000,
      connect: 10000,
    },
    retryConfig: {
      maxRetries: 3,
      backoffMultiplier: 2,
      maxBackoff: 60000,
    },
  },

  stripe: {
    name: 'Stripe',
    baseUrl: 'https://api.stripe.com/v1',
    authType: 'oauth2' as const,
    rateLimits: {
      requestsPerSecond: 2,
      burstSize: 5,
    },
    timeouts: {
      request: 30000,
      connect: 10000,
    },
    retryConfig: {
      maxRetries: 3,
      backoffMultiplier: 2,
      maxBackoff: 60000,
    },
    webhookConfig: {
      secret: process.env.STRIPE_WEBHOOK_SECRET,
      algorithm: 'sha256' as const,
      headerName: 'Stripe-Signature',
      tolerance: 300,
    },
  },

  notion: {
    name: 'Notion',
    baseUrl: 'https://api.notion.com/v1',
    authType: 'oauth2' as const,
    rateLimits: {
      requestsPerSecond: 3,
      burstSize: 10,
    },
    timeouts: {
      request: 30000,
      connect: 10000,
    },
    retryConfig: {
      maxRetries: 3,
      backoffMultiplier: 2,
      maxBackoff: 60000,
    },
    webhookConfig: {
      secret: process.env.NOTION_WEBHOOK_SECRET,
      algorithm: 'sha256' as const,
      headerName: 'X-Notion-Signature',
      tolerance: 300,
    },
  },

  quickbooks: {
    name: 'QuickBooks',
    baseUrl: 'https://sandbox-accounting.api.intuit.com/v3',
    authType: 'oauth2' as const,
    rateLimits: {
      requestsPerSecond: 5,
      burstSize: 15,
    },
    timeouts: {
      request: 30000,
      connect: 10000,
    },
    retryConfig: {
      maxRetries: 3,
      backoffMultiplier: 2,
      maxBackoff: 60000,
    },
    webhookConfig: {
      secret: process.env.QUICKBOOKS_WEBHOOK_SECRET,
      algorithm: 'sha256' as const,
      headerName: 'X-Intuit-Signature',
      tolerance: 300,
    },
  },

           github: {
           name: 'GitHub',
           baseUrl: 'https://api.github.com',
           authType: 'oauth2' as const,
           rateLimits: {
             requestsPerSecond: 5,
             burstSize: 20,
           },
           timeouts: {
             request: 30000,
             connect: 10000,
           },
           retryConfig: {
             maxRetries: 3,
             backoffMultiplier: 2,
             maxBackoff: 60000,
           },
           webhookConfig: {
             secret: process.env.GITHUB_WEBHOOK_SECRET,
             algorithm: 'sha256' as const,
             headerName: 'X-Hub-Signature-256',
             tolerance: 300,
           },
         },
         shopify: {
           name: 'Shopify',
           baseUrl: 'https://api.shopify.com',
           authType: 'oauth2' as const,
           rateLimits: {
             requestsPerSecond: 2,
             burstSize: 40,
           },
           timeouts: {
             request: 30000,
             connect: 10000,
           },
           retryConfig: {
             maxRetries: 3,
             backoffMultiplier: 2,
             maxBackoff: 60000,
           },
           webhookConfig: {
             secret: process.env.SHOPIFY_WEBHOOK_SECRET,
             algorithm: 'sha256' as const,
             headerName: 'X-Shopify-Hmac-Sha256',
             tolerance: 300,
           },
         },
         zoom: {
           name: 'Zoom',
           baseUrl: 'https://api.zoom.us/v2',
           authType: 'oauth2' as const,
           rateLimits: {
             requestsPerSecond: 10,
             burstSize: 100,
           },
           timeouts: {
             request: 30000,
             connect: 10000,
           },
           retryConfig: {
             maxRetries: 3,
             backoffMultiplier: 2,
             maxBackoff: 60000,
           },
           webhookConfig: {
             secret: process.env.ZOOM_WEBHOOK_SECRET,
             algorithm: 'sha256' as const,
             headerName: 'X-Zoom-Signature',
             tolerance: 300,
           },
         },
} as const;
